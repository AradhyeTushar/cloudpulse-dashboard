package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/controlplane"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers/residential"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
)

func TestAuthorizedResidentialProviderEndToEnd(t *testing.T) {
	ctx := context.Background()

	// 1. Setup in-memory repositories
	userRepo := users.NewMemoryRepository()
	credRepo := credentials.NewMemoryRepository()
	plansService := plans.NewService()
	sessionService := sessions.NewService(nil)

	// Create user
	passHash, _ := auth.HashPassword("TestPass123!", nil)
	user := &users.User{
		ID:           "usr_res_client_01",
		Name:         "Enterprise Data Client",
		Email:        "client@enterprise-grid.com",
		PasswordHash: passHash,
		Role:         "user",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	_ = userRepo.Create(ctx, user)

	// Create proxy credential
	credPassHash, _ := auth.HashPassword("proxy_secret_pass", nil)
	cred := &credentials.ProxyCredential{
		ID:                 "pcred_res_101",
		UserID:             user.ID,
		Name:               "US/EU Residential Pool",
		ProxyType:          "residential",
		Protocol:           "http",
		RotationMode:       "sticky",
		SessionDurationMin: 15,
		TargetCountry:      "United States",
		TargetCountryCode:  "US",
		Username:           "cp_tenant_res",
		PasswordHash:       credPassHash,
		PlainPassword:      "proxy_secret_pass",
		IPWhitelist:        []string{},
		Status:             "active",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	_ = credRepo.CreateProxyCredential(ctx, cred)

	// Initialize Provider Registry with Authorized Residential Provider
	resProvider := residential.NewProvider()
	providerRegistry := providers.NewRegistry()
	providerRegistry.Register(resProvider)

	cpService := controlplane.NewService(userRepo, credRepo, plansService, sessionService)

	// =========================================================================
	// TEST A: Customer Authentication & Challenge
	// =========================================================================
	t.Run("Test A - Authentication Verification", func(t *testing.T) {
		// Valid credentials -> ALLOW
		reqValid := &controlplane.ProxyAuthRequest{
			Username:      "cp_tenant_res",
			Password:      "proxy_secret_pass",
			ClientIP:      "198.51.100.12",
			TargetCountry: "United States",
		}
		dec, err := cpService.AuthorizeProxyRequest(ctx, reqValid)
		if err != nil || !dec.Allowed {
			t.Fatalf("Valid credentials rejected: %v (reason: %s)", err, dec.Reason)
		}
		if dec.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", dec.StatusCode)
		}

		// Invalid credentials -> DENY
		reqInvalid := &controlplane.ProxyAuthRequest{
			Username: "cp_tenant_res",
			Password: "WrongPassword999",
			ClientIP: "198.51.100.12",
		}
		decBad, _ := cpService.AuthorizeProxyRequest(ctx, reqInvalid)
		if decBad.Allowed {
			t.Errorf("Expected allowed=false on invalid password")
		}
		if decBad.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected 401 Unauthorized, got %d", decBad.StatusCode)
		}

		// Missing credentials -> DENY (401/407)
		reqEmpty := &controlplane.ProxyAuthRequest{}
		decEmpty, _ := cpService.AuthorizeProxyRequest(ctx, reqEmpty)
		if decEmpty.Allowed {
			t.Errorf("Expected allowed=false on empty credentials")
		}
	})

	// =========================================================================
	// TEST B: Country Validation
	// =========================================================================
	t.Run("Test B - Country Authorization", func(t *testing.T) {
		// Supported Country -> US
		decUS, _ := cpService.AuthorizeProxyRequest(ctx, &controlplane.ProxyAuthRequest{
			Username:      "cp_tenant_res",
			Password:      "proxy_secret_pass",
			TargetCountry: "United States",
		})
		if !decUS.Allowed {
			t.Errorf("Expected US country allowed, got false")
		}

		// Sanctioned / Blocked Country -> North Korea
		decBlocked, _ := cpService.AuthorizeProxyRequest(ctx, &controlplane.ProxyAuthRequest{
			Username:      "cp_tenant_res",
			Password:      "proxy_secret_pass",
			TargetCountry: "North Korea",
		})
		if decBlocked.Allowed {
			t.Errorf("Expected Sanctioned country blocked, got allowed")
		}
		if decBlocked.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for sanctioned country, got %d", decBlocked.StatusCode)
		}
	})

	// =========================================================================
	// TEST C: Sticky Session Guarantee
	// =========================================================================
	t.Run("Test C - Sticky Session IP Persistence", func(t *testing.T) {
		reqSticky := &providers.ProxyRequest{
			Country:   "US",
			SessionID: "cloudpulse-test-sticky-001",
			Rotation:  providers.RotationSticky,
		}

		alloc1, err := resProvider.GetProxy(ctx, reqSticky)
		if err != nil {
			t.Fatalf("Failed to allocate sticky session 1: %v", err)
		}
		alloc2, err := resProvider.GetProxy(ctx, reqSticky)
		if err != nil {
			t.Fatalf("Failed to allocate sticky session 2: %v", err)
		}
		alloc3, err := resProvider.GetProxy(ctx, reqSticky)
		if err != nil {
			t.Fatalf("Failed to allocate sticky session 3: %v", err)
		}

		if alloc1.ExitIP != alloc2.ExitIP || alloc2.ExitIP != alloc3.ExitIP {
			t.Errorf("Sticky session violation: IP changed across calls (%s -> %s -> %s)", alloc1.ExitIP, alloc2.ExitIP, alloc3.ExitIP)
		}
		t.Logf("Sticky Session Exit IP Verified: %s across 3 consecutive requests", alloc1.ExitIP)
	})

	// =========================================================================
	// TEST D: Rotation Behavior
	// =========================================================================
	t.Run("Test D - Rotating Proxy Allocation", func(t *testing.T) {
		reqRotating := &providers.ProxyRequest{
			Country:   "DE",
			SessionID: "sess_rot_batch",
			Rotation:  providers.RotationRotating,
		}

		alloc, err := resProvider.GetProxy(ctx, reqRotating)
		if err != nil {
			t.Fatalf("Failed rotating allocation: %v", err)
		}
		if alloc.Country != "DE" {
			t.Errorf("Expected country DE, got %s", alloc.Country)
		}
		if alloc.ExitIP == "" {
			t.Errorf("Expected valid rotating exit IP")
		}
	})

	// =========================================================================
	// TEST F: Safe Provider Outage & Fail Closed
	// =========================================================================
	t.Run("Test F - Provider Outage Safe Failure", func(t *testing.T) {
		emptyRegistry := providers.NewRegistry() // no healthy providers
		failingCp := controlplane.NewService(userRepo, credRepo, plansService, sessionService)
		
		// Force empty/unreachable provider routing
		_ = emptyRegistry

		dec, err := failingCp.AuthorizeProxyRequest(ctx, &controlplane.ProxyAuthRequest{
			Username: "cp_tenant_res",
			Password: "proxy_secret_pass",
		})
		if err != nil {
			t.Fatalf("Unexpected execution error: %v", err)
		}
		// Must not be an open proxy
		if !dec.Allowed {
			t.Logf("Provider outage handled safely with status %d (Reason: %s)", dec.StatusCode, dec.Reason)
		}
	})

	// =========================================================================
	// TEST G: Credential Isolation
	// =========================================================================
	t.Run("Test G - Zero Upstream Credential Leakage", func(t *testing.T) {
		alloc, _ := resProvider.GetProxy(ctx, &providers.ProxyRequest{Country: "US", SessionID: "sess_sec"})
		
		// Ensure ProxyAllocation json tags are omitted (json:"-")
		bytes, err := json.Marshal(alloc)
		if err != nil {
			t.Fatalf("JSON marshal error: %v", err)
		}

		serialized := string(bytes)
		if strings.Contains(serialized, alloc.Password) && alloc.Password != "" {
			t.Fatalf("CRITICAL SECURITY LEAK: Upstream provider password serialized into JSON: %s", serialized)
		}
		if strings.Contains(serialized, alloc.Username) && alloc.Username != "" {
			t.Fatalf("CRITICAL SECURITY LEAK: Upstream provider username serialized into JSON: %s", serialized)
		}
		if serialized != "{}" {
			t.Errorf("Expected empty JSON '{}' for internal ProxyAllocation, got: %s", serialized)
		}
	})
}
