package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/abuse"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/admin"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/audit"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/config"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/database"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/usage"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/middleware"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	log.Println("[BOOT] Initializing CloudPulse API Control Plane...")

	// 1. Load Configuration
	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. Connect Database & Redis
	db, err := database.Connect(ctx, cfg.DatabaseURL, cfg.RedisURL)
	if err != nil {
		log.Printf("[DB WARNING] Database initialization message: %v", err)
	}
	defer db.Close()

	// 3. Initialize Services
	tokenService := auth.NewTokenService(cfg.JWTSecret, cfg.JWTExpiry)
	userRepo := users.NewRepository(db.Pool)
	userService := users.NewService(userRepo, tokenService)
	userHandler := users.NewHandler(userService)

	plansService := plans.NewService()
	plansHandler := plans.NewHandler(plansService)

	credService := credentials.NewService()
	credHandler := credentials.NewHandler(credService)

	sessionService := sessions.NewService(db.Redis)
	sessionHandler := sessions.NewHandler(sessionService)

	usageService := usage.NewService()
	usageHandler := usage.NewHandler(usageService)

	providerService := providers.NewService()
	providerHandler := providers.NewHandler(providerService)

	adminService := admin.NewService()
	adminHandler := admin.NewHandler(adminService)

	auditService := audit.NewService()
	auditHandler := audit.NewHandler(auditService)

	rateLimiter := abuse.NewRateLimiter(120) // 120 requests/minute per IP

	// 4. Seed default test user for instantaneous local development & API access
	_, _ = userService.Register(ctx, &users.RegisterRequest{
		Name:     "Alex Mercer",
		Email:    "alex.mercer@cloudinfra.io",
		Password: "Password123!",
	})

	// 5. Router Setup
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.Metrics)
	r.Use(rateLimiter.Middleware)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health and Observability Probes
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, "CloudPulse API is healthy", map[string]string{
			"status":      "UP",
			"environment": cfg.Environment,
			"version":     "1.0.0",
		})
	})
	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, "CloudPulse API is ready", map[string]bool{"ready": true})
	})
	r.Handle("/metrics", promhttp.Handler())

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public Auth
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", userHandler.Register)
			r.Post("/login", userHandler.Login)
		})

		// Public Plans Catalog
		r.Get("/plans", plansHandler.ListPlans)

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(tokenService, credService))

			// User & Profile
			r.Route("/user", func(r chi.Router) {
				r.Get("/profile", userHandler.GetProfile)
				r.Put("/profile", userHandler.UpdateProfile)
				r.Post("/password", userHandler.ChangePassword)
			})

			// Subscriptions
			r.Route("/billing/subscriptions", func(r chi.Router) {
				r.Get("/", plansHandler.ListSubscriptions)
				r.Post("/", plansHandler.CreateSubscription)
			})

			// API Credentials (keys)
			r.Route("/credentials", func(r chi.Router) {
				r.Get("/", credHandler.List)
				r.Post("/", credHandler.Create)
				r.Delete("/{id}", credHandler.Delete)
			})

			// Sessions
			r.Route("/sessions", func(r chi.Router) {
				r.Get("/", sessionHandler.List)
				r.Delete("/{id}", sessionHandler.Revoke)
			})

			// VPS Fleet & Telemetry
			r.Route("/vps", func(r chi.Router) {
				r.Get("/", providerHandler.List)
				r.Post("/", providerHandler.Create)
				r.Get("/{id}", providerHandler.Get)
				r.Post("/{id}/action", providerHandler.Action)
				r.Get("/{id}/firewall", providerHandler.GetFirewall)
				r.Get("/{id}/usage", usageHandler.GetVpsUsage)
			})

			// Audit Logs
			r.Get("/audit/logs", auditHandler.List)

			// Admin Control Plane
			r.Get("/admin/overview", adminHandler.GetOverview)
		})
	})

	// 6. Start HTTP Server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[READY] CloudPulse Backend listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] HTTP server error: %v", err)
		}
	}()

	// 7. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[SHUTDOWN] Shutting down gracefully...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[ERROR] Forced shutdown: %v", err)
	}

	log.Println("[EXIT] CloudPulse API cleanly stopped.")
	fmt.Println()
}
