package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/controlplane"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/middleware"
	"github.com/go-chi/chi/v5"
)

func TestMilestone1CompleteJourney(t *testing.T) {
	ctx := context.Background()

	// 1. Initialize repositories & services
	tokenService := auth.NewTokenService("test_secret_for_milestone_verification_12345", 24*time.Hour)
	userRepo := users.NewMemoryRepository()
	userService := users.NewService(userRepo, tokenService)
	userHandler := users.NewHandler(userService)

	plansService := plans.NewService()
	plansHandler := plans.NewHandler(plansService)

	credRepo := credentials.NewMemoryRepository()
	credService := credentials.NewService(credRepo)
	credHandler := credentials.NewHandler(credService)

	sessionService := sessions.NewService(nil)

	controlPlaneService := controlplane.NewService(userRepo, credRepo, plansService, sessionService)
	controlPlaneHandler := controlplane.NewHandler(controlPlaneService)

	// 2. Wire Router
	r := chi.NewRouter()
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", userHandler.Register)
			r.Post("/login", userHandler.Login)
		})

		r.Route("/internal/proxy", func(r chi.Router) {
			r.Post("/authorize", controlPlaneHandler.Authorize)
			r.Post("/release", controlPlaneHandler.Release)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(tokenService, credService))

			r.Get("/user/profile", userHandler.GetProfile)
			r.Get("/billing/subscriptions", plansHandler.ListSubscriptions)

			r.Route("/proxy-credentials", func(r chi.Router) {
				r.Get("/", credHandler.ListProxyCredentials)
				r.Post("/", credHandler.CreateProxyCredential)
				r.Post("/{id}/reset", credHandler.ResetProxyCredential)
				r.Delete("/{id}", credHandler.DeleteProxyCredential)
			})
		})
	})

	server := httptest.NewServer(r)
	defer server.Close()
	client := server.Client()

	// =========================================================================
	// STEP 1: REGISTER
	// =========================================================================
	t.Run("1. Register Account", func(t *testing.T) {
		regBody, _ := json.Marshal(map[string]string{
			"name":     "Elena Rostova",
			"email":    "elena.rostova@acme-data.com",
			"password": "SecurePassword123!",
		})

		resp, err := client.Post(server.URL+"/api/v1/auth/register", "application/json", bytes.NewReader(regBody))
		if err != nil {
			t.Fatalf("Register failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created, got %d", resp.StatusCode)
		}

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Token string      `json:"token"`
				User  *users.User `json:"user"`
			} `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		if res.Data.User.Email != "elena.rostova@acme-data.com" {
			t.Errorf("Expected user email to match, got %s", res.Data.User.Email)
		}
	})

	// =========================================================================
	// STEP 2: LOGIN
	// =========================================================================
	var authToken string
	t.Run("2. Login Account", func(t *testing.T) {
		loginBody, _ := json.Marshal(map[string]string{
			"email":    "elena.rostova@acme-data.com",
			"password": "SecurePassword123!",
		})

		resp, err := client.Post(server.URL+"/api/v1/auth/login", "application/json", bytes.NewReader(loginBody))
		if err != nil {
			t.Fatalf("Login failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Token string      `json:"token"`
				User  *users.User `json:"user"`
			} `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		if res.Data.Token == "" {
			t.Fatalf("Expected non-empty JWT token")
		}
		authToken = res.Data.Token
	})

	// =========================================================================
	// STEP 3: DASHBOARD / USER PROFILE
	// =========================================================================
	t.Run("3. Fetch Dashboard Profile", func(t *testing.T) {
		req, _ := http.NewRequest("GET", server.URL+"/api/v1/user/profile", nil)
		req.Header.Set("Authorization", "Bearer "+authToken)

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Profile request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		var res struct {
			Success bool        `json:"success"`
			Data    *users.User `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		if res.Data.Status != "active" {
			t.Errorf("Expected active status, got %s", res.Data.Status)
		}
	})

	// =========================================================================
	// STEP 4 & 5: CREATE PROXY CREDENTIAL & SELECT COUNTRY (DE / Germany)
	// =========================================================================
	var proxyUsername string
	var proxyPassword string
	var credID string

	t.Run("4 & 5. Create Proxy Credential with Country Selection (DE)", func(t *testing.T) {
		credBody, _ := json.Marshal(map[string]interface{}{
			"name":                 "Germany Production Crawler",
			"proxy_type":           "residential",
			"protocol":             "http",
			"rotation_mode":        "sticky",
			"session_duration_min": 15,
			"target_country":       "Germany",
			"target_country_code":  "DE",
		})

		req, _ := http.NewRequest("POST", server.URL+"/api/v1/proxy-credentials", bytes.NewReader(credBody))
		req.Header.Set("Authorization", "Bearer "+authToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Create credential failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created, got %d", resp.StatusCode)
		}

		var res struct {
			Success bool                         `json:"success"`
			Data    *credentials.ProxyCredential `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		credID = res.Data.ID
		proxyUsername = res.Data.Username
		proxyPassword = res.Data.PlainPassword

		if res.Data.TargetCountryCode != "DE" {
			t.Errorf("Expected target country DE, got %s", res.Data.TargetCountryCode)
		}
		if proxyUsername == "" || proxyPassword == "" {
			t.Errorf("Expected generated username and password")
		}
	})

	// =========================================================================
	// STEP 6: CREATE SESSION & MOCK PROVIDER ALLOCATION
	// =========================================================================
	var assignedExitIP string
	var sessionID string
	var userID string

	t.Run("6. Create Session & Mock Provider Allocation Handshake", func(t *testing.T) {
		authReqBody, _ := json.Marshal(map[string]interface{}{
			"username":       proxyUsername,
			"password":       proxyPassword,
			"client_ip":      "198.51.100.5",
			"target_host":    "httpbin.org",
			"target_port":    443,
			"target_country": "Germany",
			"protocol":       "https",
		})

		resp, err := client.Post(server.URL+"/api/v1/internal/proxy/authorize", "application/json", bytes.NewReader(authReqBody))
		if err != nil {
			t.Fatalf("Authorize handshake failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		var res struct {
			Success bool                              `json:"success"`
			Data    *controlplane.ProxyAuthDecision   `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		if !res.Data.Allowed {
			t.Fatalf("Expected authorization allowed, reason: %s", res.Data.Reason)
		}
		if res.Data.AssignedExitIP == "" {
			t.Errorf("Expected assigned exit IP from provider")
		}
		if res.Data.UpstreamProvider == "" {
			t.Errorf("Expected assigned upstream provider")
		}

		assignedExitIP = res.Data.AssignedExitIP
		sessionID = res.Data.SessionID
		userID = res.Data.UserID

		t.Logf("Allocated Exit IP: %s via Provider: %s (Session: %s)", assignedExitIP, res.Data.UpstreamProvider, sessionID)
	})

	// =========================================================================
	// STEP 7: RELEASE SESSION
	// =========================================================================
	t.Run("7. Release Session Concurrency Slot", func(t *testing.T) {
		relBody, _ := json.Marshal(map[string]string{
			"user_id": userID,
		})

		resp, err := client.Post(server.URL+"/api/v1/internal/proxy/release", "application/json", bytes.NewReader(relBody))
		if err != nil {
			t.Fatalf("Release failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK on release, got %d", resp.StatusCode)
		}
	})

	_ = credID
	_ = ctx
}
