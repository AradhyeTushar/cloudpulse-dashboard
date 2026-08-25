package controlplane

import (
	"context"
	"testing"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
)

func setupControlPlane() (*ControlPlaneService, string, string, string, users.Repository, credentials.Repository) {
	userRepo := users.NewMemoryRepository()
	credRepo := credentials.NewMemoryRepository()
	plansService := plans.NewService()
	sessionService := sessions.NewService(nil)

	ctx := context.Background()

	// 1. Create User
	passHash, _ := auth.HashPassword("Pass123!", nil)
	user := &users.User{
		ID:           "usr_tenant_1",
		Name:         "Enterprise Analytics Client",
		Email:        "client@enterprise-analytics.com",
		PasswordHash: passHash,
		Role:         "user",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	_ = userRepo.Create(ctx, user)

	// 2. Create Proxy Credential
	credPassHash, _ := auth.HashPassword("secret_proxy_pass", nil)
	cred := &credentials.ProxyCredential{
		ID:                 "pcred_101",
		UserID:             user.ID,
		Name:               "US Resident Pool",
		ProxyType:          "residential",
		Protocol:           "http",
		RotationMode:       "sticky",
		SessionDurationMin: 15,
		TargetCountry:      "United States",
		TargetCountryCode:  "US",
		Username:           "cp_app_client",
		PasswordHash:       credPassHash,
		PlainPassword:      "secret_proxy_pass",
		IPWhitelist:        []string{"203.0.113.5", "198.51.100.0/24"},
		Status:             "active",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	_ = credRepo.CreateProxyCredential(ctx, cred)

	cpService := NewService(userRepo, credRepo, plansService, sessionService)
	return cpService, user.ID, cred.Username, "secret_proxy_pass", userRepo, credRepo
}

func TestControlPlaneAuthorizationPipeline(t *testing.T) {
	cpService, userID, username, password, userRepo, credRepo := setupControlPlane()
	ctx := context.Background()

	// -------------------------------------------------------------------------
	// CASE 1: Valid Proxy Connection from Whitelisted IP
	// -------------------------------------------------------------------------
	t.Run("Valid Connection Success", func(t *testing.T) {
		req := &ProxyAuthRequest{
			Username:      username,
			Password:      password,
			ClientIP:      "203.0.113.5",
			TargetHost:    "httpbin.org",
			TargetPort:    443,
			TargetCountry: "United States",
			Protocol:      "https",
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if !decision.Allowed {
			t.Fatalf("Expected connection allowed, got false (reason: %s)", decision.Reason)
		}
		if decision.StatusCode != 200 {
			t.Errorf("Expected status 200, got %d", decision.StatusCode)
		}
		if decision.AssignedExitIP == "" {
			t.Errorf("Expected assigned exit IP")
		}
		if decision.UpstreamHost == "" {
			t.Errorf("Expected assigned upstream host")
		}

		// Release connection
		cpService.ReleaseConnection(userID)
	})

	// -------------------------------------------------------------------------
	// CASE 2: Invalid Password
	// -------------------------------------------------------------------------
	t.Run("Invalid Password Rejection", func(t *testing.T) {
		req := &ProxyAuthRequest{
			Username: username,
			Password: "WrongPassword999",
			ClientIP: "203.0.113.5",
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if decision.Allowed {
			t.Errorf("Expected allowed=false for wrong password")
		}
		if decision.StatusCode != 401 {
			t.Errorf("Expected 401 Unauthorized, got %d", decision.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// CASE 3: Unauthorized Client IP (Whitelist enforcement)
	// -------------------------------------------------------------------------
	t.Run("IP Whitelist Block", func(t *testing.T) {
		req := &ProxyAuthRequest{
			Username: username,
			Password: password,
			ClientIP: "1.2.3.4", // Not in whitelist
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if decision.Allowed {
			t.Errorf("Expected allowed=false for non-whitelisted IP")
		}
		if decision.StatusCode != 403 {
			t.Errorf("Expected 403 Forbidden, got %d", decision.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// CASE 4: Restricted / Sanctioned Country Targeting
	// -------------------------------------------------------------------------
	t.Run("Restricted Country Block", func(t *testing.T) {
		req := &ProxyAuthRequest{
			Username:      username,
			Password:      password,
			ClientIP:      "203.0.113.5",
			TargetCountry: "North Korea",
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if decision.Allowed {
			t.Errorf("Expected allowed=false for restricted country")
		}
		if decision.StatusCode != 403 {
			t.Errorf("Expected 403 Forbidden, got %d", decision.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// CASE 5: Suspended User Account Rejection
	// -------------------------------------------------------------------------
	t.Run("Suspended Account Rejection", func(t *testing.T) {
		user, _ := userRepo.GetByID(ctx, userID)
		user.Status = "suspended"
		_ = userRepo.Update(ctx, user)

		req := &ProxyAuthRequest{
			Username: username,
			Password: password,
			ClientIP: "203.0.113.5",
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if decision.Allowed {
			t.Errorf("Expected allowed=false for suspended user")
		}
		if decision.StatusCode != 403 {
			t.Errorf("Expected 403 Forbidden, got %d", decision.StatusCode)
		}

		// Restore
		user.Status = "active"
		_ = userRepo.Update(ctx, user)
	})

	// -------------------------------------------------------------------------
	// CASE 6: Disabled Proxy Credential Rejection
	// -------------------------------------------------------------------------
	t.Run("Disabled Credential Rejection", func(t *testing.T) {
		cred, _ := credRepo.GetProxyCredentialByID(ctx, "pcred_101")
		cred.Status = "disabled"
		_ = credRepo.UpdateProxyCredential(ctx, cred)

		req := &ProxyAuthRequest{
			Username: username,
			Password: password,
			ClientIP: "203.0.113.5",
		}

		decision, err := cpService.AuthorizeProxyRequest(ctx, req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if decision.Allowed {
			t.Errorf("Expected allowed=false for disabled credential")
		}

		// Restore
		cred.Status = "active"
		_ = credRepo.UpdateProxyCredential(ctx, cred)
	})
}
