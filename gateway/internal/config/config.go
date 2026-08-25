package config

import (
	"os"
	"time"
)

type Config struct {
	HTTPPort        string
	MetricsPort     string
	ControlPlaneURL string
	RedisURL        string
	DialTimeout     time.Duration
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	FlushInterval   time.Duration
	RateLimitReqs   int
	RateLimitWindow time.Duration
	MaxConcurrency  int
}

func Load() *Config {
	return &Config{
		HTTPPort:        getEnv("GATEWAY_HTTP_PORT", "8000"),
		MetricsPort:     getEnv("GATEWAY_METRICS_PORT", "9100"),
		ControlPlaneURL: getEnv("CONTROL_PLANE_URL", "http://localhost:8080"),
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379"),
		DialTimeout:     10 * time.Second,
		ReadTimeout:     30 * time.Second,
		WriteTimeout:    30 * time.Second,
		IdleTimeout:     120 * time.Second,
		FlushInterval:   5 * time.Second,
		RateLimitReqs:   120,
		RateLimitWindow: time.Minute,
		MaxConcurrency:  500,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
