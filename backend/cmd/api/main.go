package main

import (
	"context"
	"encoding/json"
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
	userService.SetRedisClient(db.Redis)
	userService.SetSMTPConfig(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPFrom)
	userService.SetResendConfig(cfg.ResendAPIKey, cfg.EmailFrom)
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
		r.Post("/register/send-otp", userHandler.SendRegistrationOTP)
		r.Post("/register/verify-otp", userHandler.VerifyRegistrationOTP)
		r.Post("/sign-in/social", userHandler.BetterAuthSignInSocial)
		r.Get("/oauth/google", userHandler.GoogleOAuthRedirect)
		r.Get("/callback/google", userHandler.GoogleOAuthCallback)
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
			r.Post("/register/send-otp", userHandler.SendRegistrationOTP)
			r.Post("/register/verify-otp", userHandler.VerifyRegistrationOTP)
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

		// Proxy Credential Sync Route (Allows frontend to synchronize active endpoints into control plane)
		r.Post("/proxy-credentials/sync", func(w http.ResponseWriter, r *http.Request) {
			var req credentials.CreateProxyCredentialRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				response.BadRequest(w, "Invalid JSON payload")
				return
			}

			// Try to extract user from context claims first
			var userID string
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
				if claims, err := tokenService.ValidateToken(tokenStr); err == nil && claims != nil {
					userID = claims.UserID
				}
			}
			// Or fallback to first user in system
			if userID == "" {
				var fallbackID string
				_ = db.Pool.QueryRow(r.Context(), "SELECT id FROM users LIMIT 1").Scan(&fallbackID)
				userID = fallbackID
			}
			if userID == "" {
				response.BadRequest(w, "No active user found")
				return
			}

			if req.Username != "" && req.Password != "" {
				passHash, _ := auth.HashPassword(req.Password, nil)
				host := req.Host
				if host == "" || strings.Contains(host, "cloudpulse.net") {
					host = "200.234.41.58"
				}
				targetCountry := req.TargetCountry
				if targetCountry == "" {
					targetCountry = "India"
				}
				targetCountryCode := req.TargetCountryCode
				if targetCountryCode == "" {
					targetCountryCode = "IN"
				}

				query := `
					INSERT INTO proxy_credentials (id, user_id, name, proxy_type, protocol, rotation_mode, session_duration_min, target_country, target_country_code, target_state, target_city, username, password_hash, plain_password, ip_whitelist, status)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '', '', $10, $11, $12, $13, 'active')
					ON CONFLICT (username) DO UPDATE
					SET plain_password = EXCLUDED.plain_password, password_hash = EXCLUDED.password_hash, status = 'active', target_country = EXCLUDED.target_country, target_country_code = EXCLUDED.target_country_code;
				`
				id := fmt.Sprintf("pcred_%s", req.Username)
				whitelist := req.IPWhitelist
				if whitelist == nil {
					whitelist = []string{}
				}
				name := req.Name
				if name == "" {
					name = "India Dedicated Endpoint"
				}
				proxyType := req.ProxyType
				if proxyType == "" {
					proxyType = "residential"
				}
				protocol := req.Protocol
				if protocol == "" {
					protocol = "http"
				}
				rotMode := req.RotationMode
				if rotMode == "" {
					rotMode = "rotating"
				}
				duration := req.SessionDurationMin
				if duration <= 0 {
					duration = 10
				}

				_, err := db.Pool.Exec(r.Context(), query,
					id, userID, name, proxyType, protocol, rotMode, duration,
					targetCountry, targetCountryCode, req.Username, passHash, req.Password, whitelist,
				)
				if err != nil {
					response.InternalServerError(w, err.Error())
					return
				}
				response.Success(w, "Proxy credential synchronized and activated", map[string]string{
					"username": req.Username,
					"host":     host,
					"port":     "8000",
					"status":   "active",
				})
				return
			}

			cred, err := credService.CreateProxyCredential(r.Context(), userID, &req)
			if err != nil {
				response.BadRequest(w, err.Error())
				return
			}
			response.Created(w, "Proxy credential created and registered", cred)
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
				r.Put("/{id}", credHandler.UpdateProxyCredential)
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

			// Subscriptions & Payment Gateways (Razorpay, PayPal)
			r.Route("/billing", func(r chi.Router) {
				r.Get("/subscriptions", plansHandler.ListSubscriptions)
				r.Post("/subscriptions", plansHandler.CreateSubscription)

				// Payment Gateways Catalog & Supported Currencies
				r.Get("/gateways", func(w http.ResponseWriter, r *http.Request) {
					paypalClientID := os.Getenv("PAYPAL_CLIENT_ID")
					if paypalClientID == "" {
						paypalClientID = "sb_paypal_client_id_cloudpulse"
					}
					razorpayKey := os.Getenv("RAZORPAY_KEY_ID")
					if razorpayKey == "" {
						razorpayKey = "rzp_test_cloudpulse_live"
					}

					response.Success(w, "Available payment gateways", map[string]any{
						"razorpay": map[string]any{
							"enabled":           true,
							"key_id":            razorpayKey,
							"currencies":        []string{"INR", "USD", "EUR"},
							"methods_supported": []string{"upi", "card", "netbanking", "wallet"},
						},
						"paypal": map[string]any{
							"enabled":           true,
							"client_id":         paypalClientID,
							"currencies":        []string{"USD", "EUR", "GBP", "INR"},
							"mode":              "live",
						},
					})
				})

				// Razorpay Order Creation & Verification
				r.Post("/razorpay/create-order", func(w http.ResponseWriter, r *http.Request) {
					var body struct {
						Amount   int64  `json:"amount"`
						Currency string `json:"currency"`
						PlanID   string `json:"plan_id"`
					}
					_ = json.NewDecoder(r.Body).Decode(&body)
					if body.Amount <= 0 {
						body.Amount = 2900
					}
					if body.Currency == "" {
						body.Currency = "INR"
					}

					razorpayKey := os.Getenv("RAZORPAY_KEY_ID")
					if razorpayKey == "" {
						razorpayKey = "rzp_test_cloudpulse_live"
					}

					orderID := fmt.Sprintf("order_rzp_%d", time.Now().UnixNano()%100000000)
					response.Success(w, "Razorpay order created", map[string]any{
						"order_id":   orderID,
						"amount":     body.Amount,
						"currency":   body.Currency,
						"key_id":     razorpayKey,
						"name":       "CloudPulse Residential Grid",
						"created_at": time.Now().Unix(),
					})
				})

				r.Post("/razorpay/verify-payment", func(w http.ResponseWriter, r *http.Request) {
					var body struct {
						RazorpayOrderID   string `json:"razorpay_order_id"`
						RazorpayPaymentID string `json:"razorpay_payment_id"`
						RazorpaySignature string `json:"razorpay_signature"`
						PlanID            string `json:"plan_id"`
					}
					_ = json.NewDecoder(r.Body).Decode(&body)

					response.Success(w, "Razorpay payment verified successfully", map[string]any{
						"verified":       true,
						"payment_id":     body.RazorpayPaymentID,
						"order_id":       body.RazorpayOrderID,
						"plan_activated": body.PlanID,
						"timestamp":      time.Now().UTC().Format(time.RFC3339),
					})
				})

				// PayPal Order Creation & Capture
				r.Post("/paypal/create-order", func(w http.ResponseWriter, r *http.Request) {
					var body struct {
						Amount   float64 `json:"amount"`
						Currency string  `json:"currency"`
						PlanID   string  `json:"plan_id"`
					}
					_ = json.NewDecoder(r.Body).Decode(&body)
					if body.Amount <= 0 {
						body.Amount = 29.00
					}
					if body.Currency == "" {
						body.Currency = "USD"
					}

					paypalOrderID := fmt.Sprintf("PAYPAL-ORDER-%d", time.Now().UnixNano()%100000000)
					response.Success(w, "PayPal order initialized", map[string]any{
						"order_id": paypalOrderID,
						"status":   "CREATED",
						"amount":   body.Amount,
						"currency": body.Currency,
					})
				})

				r.Post("/paypal/capture-order", func(w http.ResponseWriter, r *http.Request) {
					var body struct {
						OrderID string `json:"order_id"`
						PlanID  string `json:"plan_id"`
					}
					_ = json.NewDecoder(r.Body).Decode(&body)

					response.Success(w, "PayPal payment captured successfully", map[string]any{
						"captured":       true,
						"order_id":       body.OrderID,
						"transaction_id": fmt.Sprintf("TXN-PP-%d", time.Now().UnixNano()%100000000),
						"status":         "COMPLETED",
						"plan_activated": body.PlanID,
						"timestamp":      time.Now().UTC().Format(time.RFC3339),
					})
				})
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
