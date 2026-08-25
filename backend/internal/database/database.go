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
		log.Printf("[DB WARNING] Failed to parse PostgreSQL URL: %v. Database will run in degraded/mock mode if offline.", err)
	} else {
		pgConfig.MaxConns = 25
		pgConfig.MinConns = 5
		pgConfig.MaxConnLifetime = time.Hour
		pgConfig.MaxConnIdleTime = 30 * time.Minute

		poolCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		pool, err := pgxpool.NewWithConfig(poolCtx, pgConfig)
		if err != nil {
			log.Printf("[DB WARNING] Could not connect to PostgreSQL: %v (running with fallback)", err)
		} else if err := pool.Ping(poolCtx); err != nil {
			log.Printf("[DB WARNING] PostgreSQL ping failed: %v (running with fallback)", err)
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
			log.Printf("[REDIS WARNING] Could not connect to Redis: %v (sessions will use in-memory fallback)", err)
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
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role VARCHAR(32) NOT NULL DEFAULT 'user',
		workspace_name VARCHAR(255) DEFAULT 'Default Workspace',
		two_factor_enabled BOOLEAN DEFAULT FALSE,
		two_factor_secret TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS api_credentials (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		prefix VARCHAR(16) NOT NULL,
		secret_hash VARCHAR(64) NOT NULL,
		scopes TEXT[] NOT NULL DEFAULT '{}',
		last_used_at TIMESTAMP WITH TIME ZONE,
		expires_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS vps_instances (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		hostname VARCHAR(255) NOT NULL,
		plan_id VARCHAR(64) NOT NULL,
		ip_address VARCHAR(45) NOT NULL,
		ipv6_address VARCHAR(45),
		status VARCHAR(32) NOT NULL DEFAULT 'running',
		datacenter VARCHAR(64) NOT NULL,
		vcpu INT NOT NULL DEFAULT 2,
		ram_gb INT NOT NULL DEFAULT 4,
		storage_gb INT NOT NULL DEFAULT 50,
		bandwidth_tb NUMERIC(5,2) DEFAULT 2.0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64),
		action VARCHAR(64) NOT NULL,
		resource_type VARCHAR(64) NOT NULL,
		resource_id VARCHAR(64),
		ip_address VARCHAR(45),
		user_agent TEXT,
		details JSONB,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS plans (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(128) NOT NULL,
		slug VARCHAR(64) UNIQUE NOT NULL,
		price_monthly NUMERIC(10,2) NOT NULL,
		vcpu INT NOT NULL,
		ram_gb INT NOT NULL,
		storage_gb INT NOT NULL,
		bandwidth_tb NUMERIC(5,2) NOT NULL,
		features TEXT[] NOT NULL DEFAULT '{}',
		is_active BOOLEAN DEFAULT TRUE
	);
	`
	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to execute migrations: %w", err)
	}
	log.Println("[DB MIGRATIONS] Core schemas ensured")
	return nil
}
