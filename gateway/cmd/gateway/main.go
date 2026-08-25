package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/accounting"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/config"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/limits"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/policy"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/server"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/upstream"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
)

func main() {
	log.Println("[GATEWAY BOOT] Starting CloudPulse High-Throughput Proxy Gateway...")

	cfg := config.Load()

	// 1. Redis Connection (Optional local fallback)
	var rClient *redis.Client
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err == nil {
		rClient = redis.NewClient(opt)
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := rClient.Ping(ctx).Err(); err != nil {
			log.Printf("[REDIS INFO] Running in local in-memory store mode: %v", err)
			rClient = nil
		} else {
			log.Println("[REDIS CONNECTED] Atomic Concurrency Limits & Live Sessions active")
		}
		cancel()
	}

	// 2. Initialize Core Subsystems
	rateLimiter := limits.NewRateLimiter(cfg.RateLimitReqs, cfg.RateLimitWindow)
	concurrency := limits.NewConcurrencyTracker(rClient)
	policyCache := policy.NewCache(30 * time.Second)
	sessionMgr := sessions.NewSessionManager(rClient)
	upstreamClient := upstream.NewControlPlaneClient(cfg.ControlPlaneURL, cfg.DialTimeout)
	accumulator := accounting.NewUsageAccumulator(cfg.ControlPlaneURL, cfg.FlushInterval)

	gwServer := server.NewGatewayServer(
		cfg,
		rateLimiter,
		concurrency,
		policyCache,
		sessionMgr,
		upstreamClient,
		accumulator,
	)

	// 3. Redis Pub/Sub Policy Invalidation Listener
	if rClient != nil {
		go func() {
			pubsub := rClient.Subscribe(context.Background(), "policy:invalidate")
			defer pubsub.Close()
			for msg := range pubsub.Channel() {
				gwServer.InvalidateTarget(msg.Payload)
			}
		}()
	}

	// 4. Prometheus Operational Metrics HTTP Server
	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.Handler())
	metricsMux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"UP","gateway":"online"}`))
	})

	metricsServer := &http.Server{
		Addr:    ":" + cfg.MetricsPort,
		Handler: metricsMux,
	}

	go func() {
		log.Printf("[GATEWAY METRICS] Exposing Prometheus metrics on :%s/metrics", cfg.MetricsPort)
		if err := metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[GATEWAY METRICS ERROR] Listener error: %v", err)
		}
	}()

	// 5. Proxy Gateway HTTP Tunnel Server
	proxyServer := &http.Server{
		Addr:         ":" + cfg.HTTPPort,
		Handler:      gwServer,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	go func() {
		log.Printf("[GATEWAY READY] Closed authenticated proxy tunnel listening on :%s", cfg.HTTPPort)
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[GATEWAY FATAL] Listener failed: %v", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[GATEWAY SHUTDOWN] Gracefully draining tunnels and flushing usage counters...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	accumulator.Stop()
	_ = proxyServer.Shutdown(ctx)
	_ = metricsServer.Shutdown(ctx)
	log.Println("[GATEWAY EXIT] Gateway stopped successfully.")
}
