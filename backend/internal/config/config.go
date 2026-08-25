package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Environment string
	Port        string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	JWTExpiry   time.Duration

	// Argon2id Parameters
	Argon2 struct {
		Memory      uint32
		Iterations  uint32
		Parallelism uint8
		SaltLength  uint32
		KeyLength   uint32
	}

	CORSOrigins []string
}

func Load() *Config {
	cfg := &Config{
		Environment: getEnv("ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/cloudpulse?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:   getEnv("JWT_SECRET", "cloudpulse_super_secret_jwt_key_development_only_min_32_bytes"),
		JWTExpiry:   time.Hour * 24, // 24 hours
		CORSOrigins: []string{"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"},
	}

	// Recommended RFC 9106 Argon2id parameters
	cfg.Argon2.Memory = getEnvAsUint32("ARGON2_MEMORY", 64*1024) // 64 MB
	cfg.Argon2.Iterations = getEnvAsUint32("ARGON2_ITERATIONS", 3)
	cfg.Argon2.Parallelism = uint8(getEnvAsUint32("ARGON2_PARALLELISM", 4))
	cfg.Argon2.SaltLength = 16
	cfg.Argon2.KeyLength = 32

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvAsUint32(key string, fallback uint32) uint32 {
	if val := os.Getenv(key); val != "" {
		if parsed, err := strconv.ParseUint(val, 10, 32); err == nil {
			return uint32(parsed)
		}
	}
	return fallback
}
