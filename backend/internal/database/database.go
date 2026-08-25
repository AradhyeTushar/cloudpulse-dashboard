package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type DB struct {
	Pool  *pgxpool.Pool
	Redis *redis.Client
}

func Connect(ctx context.Context, databaseURL, redisURL string) (*DB, error) {
	db := &DB{}

	// Connect to PostgreSQL
	pgConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Printf("[DB WARNING] Failed to parse PostgreSQL URL: %v (fallback mode)", err)
	} else {
		pgConfig.MaxConns = 25
		pgConfig.MinConns = 5
		pgConfig.MaxConnLifetime = time.Hour
		pgConfig.MaxConnIdleTime = 30 * time.Minute

		poolCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		pool, err := pgxpool.NewWithConfig(poolCtx, pgConfig)
		if err != nil {
			log.Printf("[DB WARNING] Could not connect to PostgreSQL: %v (running with in-memory fallback)", err)
		} else if err := pool.Ping(poolCtx); err != nil {
			log.Printf("[DB WARNING] PostgreSQL ping failed: %v (running with in-memory fallback)", err)
			pool.Close()
		} else {
			log.Println("[DB SUCCESS] Connected to PostgreSQL successfully")
			db.Pool = pool
			if err := Migrate(ctx, pool); err != nil {
				log.Printf("[DB MIGRATION WARNING] Migration notice: %v", err)
			}
		}
	}

	// Connect to Redis
	redisOpt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[REDIS WARNING] Failed to parse Redis URL: %v", err)
	} else {
		rClient := redis.NewClient(redisOpt)
		rCtx, rCancel := context.WithTimeout(ctx, 2*time.Second)
		defer rCancel()

		if err := rClient.Ping(rCtx).Err(); err != nil {
			log.Printf("[REDIS WARNING] Could not connect to Redis: %v (running with in-memory fallback)", err)
		} else {
			log.Println("[REDIS SUCCESS] Connected to Redis successfully")
			db.Redis = rClient
		}
	}

	return db, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
	if db.Redis != nil {
		_ = db.Redis.Close()
	}
}

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	schema := `
	-- 1. users
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role VARCHAR(32) NOT NULL DEFAULT 'user',
		workspace_name VARCHAR(255) DEFAULT 'Default Workspace',
		two_factor_enabled BOOLEAN DEFAULT FALSE,
		two_factor_secret TEXT,
		status VARCHAR(32) NOT NULL DEFAULT 'active',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 2. plans
	CREATE TABLE IF NOT EXISTS plans (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(128) NOT NULL,
		slug VARCHAR(64) UNIQUE NOT NULL,
		price_monthly NUMERIC(10,2) NOT NULL,
		price_per_gb NUMERIC(6,3) NOT NULL,
		bandwidth_gb INT NOT NULL DEFAULT 100,
		threads_limit INT NOT NULL DEFAULT 500,
		dedicated_pools BOOLEAN DEFAULT FALSE,
		features TEXT[] NOT NULL DEFAULT '{}',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 3. subscriptions
	CREATE TABLE IF NOT EXISTS subscriptions (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		plan_id VARCHAR(64) NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
		status VARCHAR(32) NOT NULL DEFAULT 'active',
		auto_renew BOOLEAN DEFAULT TRUE,
		current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
		payment_method VARCHAR(64) DEFAULT 'Credit Card',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 4. api_keys
	CREATE TABLE IF NOT EXISTS api_keys (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		prefix VARCHAR(24) NOT NULL,
		secret_hash VARCHAR(64) NOT NULL,
		scopes TEXT[] NOT NULL DEFAULT '{}',
		last_used_at TIMESTAMP WITH TIME ZONE,
		expires_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 5. proxy_credentials
	CREATE TABLE IF NOT EXISTS proxy_credentials (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		proxy_type VARCHAR(32) NOT NULL DEFAULT 'residential',
		protocol VARCHAR(16) NOT NULL DEFAULT 'http',
		rotation_mode VARCHAR(32) NOT NULL DEFAULT 'rotating',
		session_duration_min INT DEFAULT 10,
		target_country VARCHAR(64) DEFAULT 'United States',
		target_country_code VARCHAR(8) DEFAULT 'US',
		target_state VARCHAR(64),
		target_city VARCHAR(64),
		username VARCHAR(64) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		plain_password VARCHAR(255),
		ip_whitelist TEXT[] NOT NULL DEFAULT '{}',
		status VARCHAR(32) NOT NULL DEFAULT 'active',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 6. sticky_sessions
	CREATE TABLE IF NOT EXISTS sticky_sessions (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		credential_id VARCHAR(64) REFERENCES proxy_credentials(id) ON DELETE CASCADE,
		exit_ip VARCHAR(45) NOT NULL,
		country VARCHAR(64) NOT NULL,
		country_code VARCHAR(8) NOT NULL,
		city VARCHAR(64),
		protocol VARCHAR(16) NOT NULL DEFAULT 'https',
		duration_seconds INT DEFAULT 0,
		bytes_in BIGINT DEFAULT 0,
		bytes_out BIGINT DEFAULT 0,
		requests_count INT DEFAULT 0,
		status VARCHAR(32) NOT NULL DEFAULT 'active',
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 7. usage_records
	CREATE TABLE IF NOT EXISTS usage_records (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		credential_id VARCHAR(64) REFERENCES proxy_credentials(id) ON DELETE SET NULL,
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		bytes_in BIGINT DEFAULT 0,
		bytes_out BIGINT DEFAULT 0,
		requests_count INT DEFAULT 0,
		target_domain VARCHAR(255),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 8. locations
	CREATE TABLE IF NOT EXISTS locations (
		id VARCHAR(64) PRIMARY KEY,
		country VARCHAR(64) NOT NULL,
		country_code VARCHAR(8) UNIQUE NOT NULL,
		flag VARCHAR(16) NOT NULL,
		region VARCHAR(64) NOT NULL,
		total_ips BIGINT NOT NULL DEFAULT 0,
		available_ips BIGINT NOT NULL DEFAULT 0,
		avg_latency_ms INT NOT NULL DEFAULT 25,
		status VARCHAR(32) NOT NULL DEFAULT 'optimal',
		active_nodes INT NOT NULL DEFAULT 0,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 9. providers
	CREATE TABLE IF NOT EXISTS providers (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(128) NOT NULL,
		type VARCHAR(64) NOT NULL,
		region VARCHAR(128) NOT NULL,
		total_nodes INT NOT NULL DEFAULT 0,
		active_nodes INT NOT NULL DEFAULT 0,
		latency_ms INT NOT NULL DEFAULT 20,
		uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 99.99,
		status VARCHAR(32) NOT NULL DEFAULT 'online',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 10. audit_logs
	CREATE TABLE IF NOT EXISTS audit_logs (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
		action VARCHAR(64) NOT NULL,
		resource_type VARCHAR(64) NOT NULL,
		resource_id VARCHAR(64),
		ip_address VARCHAR(45),
		user_agent TEXT,
		details JSONB,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- 11. abuse_events
	CREATE TABLE IF NOT EXISTS abuse_events (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
		ip_address VARCHAR(45) NOT NULL,
		target_domain VARCHAR(255) NOT NULL,
		reason TEXT NOT NULL,
		action_taken VARCHAR(32) NOT NULL DEFAULT 'Blocked',
		severity VARCHAR(16) NOT NULL DEFAULT 'high',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to run 11-table schema migrations: %w", err)
	}
	log.Println("[DB MIGRATIONS] All 11 foundational CloudPulse tables ensured in PostgreSQL")
	return nil
}
