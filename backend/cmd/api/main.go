package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/abuse"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/admin"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/audit"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/config"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/controlplane"
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

	// 3. Initialize Services with PostgreSQL repositories
	tokenService := auth.NewTokenService(cfg.JWTSecret, cfg.JWTExpiry)

	userRepo := users.NewRepository(db.Pool)
	userService := users.NewService(userRepo, tokenService)
	userHandler := users.NewHandler(userService)

	plansService := plans.NewService()
	plansHandler := plans.NewHandler(plansService)

	credRepo := credentials.NewRepository(db.Pool)
	credService := credentials.NewService(credRepo)
	credService.SetRedisClient(db.Redis)
	credHandler := credentials.NewHandler(credService)

	sessionService := sessions.NewService(db.Redis)
	sessionHandler := sessions.NewHandler(sessionService)

	// Control Plane Authorization Engine (Step 7)
	controlPlaneService := controlplane.NewService(userRepo, credRepo, plansService, sessionService)
	controlPlaneService.SetPool(db.Pool)
	controlPlaneHandler := controlplane.NewHandler(controlPlaneService)

	usageService := usage.NewService()
	usageHandler := usage.NewHandler(usageService)

	providerService := providers.NewService()
	providerHandler := providers.NewHandler(providerService)

	adminService := admin.NewService(userRepo, credRepo, plansService, db.Redis)
	adminHandler := admin.NewHandler(adminService)

	auditService := audit.NewService()
	auditHandler := audit.NewHandler(auditService)

	rateLimiter := abuse.NewRateLimiter(120) // 120 requests/minute per IP

	// 4. Seed default test users and deterministic proxy credentials
	u1, _ := userService.Register(ctx, &users.RegisterRequest{
		Name:     "Alex Mercer",
		Email:    "alex.mercer@cloudinfra.io",
		Password: "Password123!",
	})
	if u1 == nil {
		if ex, err := userRepo.GetByEmail(ctx, "alex.mercer@cloudinfra.io"); err == nil {
			_ = credService.SeedProxyCredential(ctx, ex.ID, "cp_1638ac43", "p_sec_0068cfdb54424bbf", "Alex US Residential Grid", "United States")
		}
	} else {
		_ = credService.SeedProxyCredential(ctx, u1.User.ID, "cp_1638ac43", "p_sec_0068cfdb54424bbf", "Alex US Residential Grid", "United States")
	}

	u2, _ := userService.Register(ctx, &users.RegisterRequest{
		Name:     "CloudPulse Operator",
		Email:    "admin.operator@cloudpulse.io",
		Password: "AdminSecurePass123!",
	})
	if u2 == nil {
		if ex, err := userRepo.GetByEmail(ctx, "admin.operator@cloudpulse.io"); err == nil {
			_ = credService.SeedProxyCredential(ctx, ex.ID, "cp_b5033187", "p_sec_d2a742fbf1e60994", "Admin Master Gateway Credential", "Germany")
		}
	} else {
		_ = credService.SeedProxyCredential(ctx, u2.User.ID, "cp_b5033187", "p_sec_d2a742fbf1e60994", "Admin Master Gateway Credential", "Germany")
	}

	u3, _ := userService.Register(ctx, &users.RegisterRequest{
		Name:     "Enterprise Validator",
		Email:    "validator@enterprise.com",
		Password: "DeployPassword123!",
	})
	if u3 == nil {
		if ex, err := userRepo.GetByEmail(ctx, "validator@enterprise.com"); err == nil {
			_ = credService.SeedProxyCredential(ctx, ex.ID, "cp_76b59065", "p_sec_a9cfccf6a8bba986", "Validator Automated Probe", "India")
		}
	} else {
		_ = credService.SeedProxyCredential(ctx, u3.User.ID, "cp_76b59065", "p_sec_a9cfccf6a8bba986", "Validator Automated Probe", "India")
	}

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

	// Better Auth Protocol Endpoints (/api/auth/*)
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/sign-in/email", userHandler.BetterAuthSignIn)
		r.Post("/sign-up/email", userHandler.BetterAuthSignUp)
		r.Post("/sign-out", userHandler.BetterAuthSignOut)
		r.Get("/get-session", userHandler.BetterAuthGetSession)
		r.Get("/session", userHandler.BetterAuthGetSession)
		r.Get("/me", userHandler.BetterAuthGetSession)
	})

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			response.Success(w, "CloudPulse API is healthy", map[string]string{"status": "UP", "version": "1.0.0"})
		})

		// Real Ping & Telemetry Probe Handshake (India & Edge Gateways)
		r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			startTime := time.Now()
			clientIP := r.RemoteAddr
			if fwd := r.Header.Get("CF-Connecting-IP"); fwd != "" {
				clientIP = fwd
			} else if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
				clientIP = strings.Split(fwd, ",")[0]
			}

			country := r.Header.Get("CF-IPCountry")
			if country == "" {
				country = "IN"
			}

			serverProcessingTimeUs := time.Since(startTime).Microseconds()

			response.Success(w, "Ping handshake successful", map[string]any{
				"pong":                 true,
				"client_ip":            clientIP,
				"client_country":       country,
				"server_region":        "Asia/Kolkata (India)",
				"server_node":          "in-bom-gw01.cloudpulse.net",
				"server_time_utc":      time.Now().UTC().Format(time.RFC3339Nano),
				"server_processing_us": serverProcessingTimeUs,
				"datacenter":           "Mumbai (BOM-01)",
				"india_nodes": []map[string]any{
					{"city": "Mumbai", "code": "BOM", "status": "optimal", "target": "103.27.234.1"},
					{"city": "Delhi NCR", "code": "DEL", "status": "optimal", "target": "103.194.228.1"},
					{"city": "Bengaluru", "code": "BLR", "status": "optimal", "target": "103.21.244.0"},
					{"city": "Hyderabad", "code": "HYD", "status": "optimal", "target": "103.22.200.0"},
				},
			})
		})

		// Public Auth
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", userHandler.Register)
			r.Post("/login", userHandler.Login)
		})

		// Public Plans Catalog
		r.Get("/plans", plansHandler.ListPlans)

		// Internal Control Plane Handshake (For Gateway / Data Plane)
		r.Route("/internal/proxy", func(r chi.Router) {
			r.Post("/authorize", controlPlaneHandler.Authorize)
			r.Post("/release", controlPlaneHandler.Release)
			r.Post("/telemetry", controlPlaneHandler.ReportTelemetry)
			r.Post("/telemetry/batch", controlPlaneHandler.ReportBatchTelemetry)
			r.Post("/abuse-event", controlPlaneHandler.ReportAbuse)
		})

		// Protected Routes (Customer & Tenant)
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(tokenService, credService))

			// User & Profile
			r.Route("/user", func(r chi.Router) {
				r.Get("/profile", userHandler.GetProfile)
				r.Put("/profile", userHandler.UpdateProfile)
				r.Post("/password", userHandler.ChangePassword)
			})

			// Proxy Credentials (proxy_credentials table)
			r.Route("/proxy-credentials", func(r chi.Router) {
				r.Get("/", credHandler.ListProxyCredentials)
				r.Post("/", credHandler.CreateProxyCredential)
				r.Post("/{id}/reset", credHandler.ResetProxyCredential)
				r.Delete("/{id}", credHandler.DeleteProxyCredential)
			})

			// API Keys (api_keys table)
			r.Route("/api-keys", func(r chi.Router) {
				r.Get("/", credHandler.ListApiKeys)
				r.Post("/", credHandler.CreateApiKey)
				r.Delete("/{id}", credHandler.DeleteApiKey)
			})

			// Backward compatibility alias for /credentials
			r.Route("/credentials", func(r chi.Router) {
				r.Get("/", credHandler.ListApiKeys)
				r.Post("/", credHandler.CreateApiKey)
				r.Delete("/{id}", credHandler.DeleteApiKey)
			})

			// Subscriptions
			r.Route("/billing/subscriptions", func(r chi.Router) {
				r.Get("/", plansHandler.ListSubscriptions)
				r.Post("/", plansHandler.CreateSubscription)
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

			// Admin Control Plane (Milestone 1) - Protected by Strict Role-Based RBAC
			r.Route("/admin", func(r chi.Router) {
				r.Use(middleware.RequireRole("admin", "owner"))
				r.Get("/overview", adminHandler.GetOverview)
				r.Get("/users", adminHandler.ListUsers)
				r.Post("/users/{id}/status", adminHandler.ToggleUserStatus)
				r.Post("/users/{id}/plan", adminHandler.AssignUserPlan)
				r.Post("/users/{id}/reset-credential", credHandler.ResetProxyCredential)
			})
		})
	})

	// 6. Start HTTP Server
	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
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
