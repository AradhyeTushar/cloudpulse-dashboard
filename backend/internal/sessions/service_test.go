package sessions

import (
	"context"
	"testing"
	"time"
)

func TestRedisProxySessions(t *testing.T) {
	service := NewService(nil) // in-memory store mode for tests
	ctx := context.Background()

	// STEP 1: Create a Sticky Session for user usr_tenant_99 with session=abc123 and country=US
	params := GetOrCreateSessionParams{
		SessionID:      "abc123",
		UserID:         "usr_tenant_99",
		Country:        "US",
		Provider:       "BrightData / Oxylabs PeerGrid",
		ExitIP:         "198.51.100.42",
		Host:           "egress-res-us1.cloudpulse.net",
		Port:           8080,
		RotationPolicy: "sticky",
		DurationMin:    15,
	}

	session, isNew, err := service.GetOrCreateProxySession(ctx, params)
	if err != nil {
		t.Fatalf("GetOrCreateProxySession failed: %v", err)
	}
	if !isNew {
		t.Errorf("Expected first request to create a NEW session")
	}

	// Verify All 5 Essential Fields in Redis session
	if session.SessionID != "abc123" {
		t.Errorf("Expected SessionID abc123, got %s", session.SessionID)
	}
	if session.UserID != "usr_tenant_99" {
		t.Errorf("Expected UserID usr_tenant_99, got %s", session.UserID)
	}
	if session.Country != "US" {
		t.Errorf("Expected Country US, got %s", session.Country)
	}
	if session.Provider != "BrightData / Oxylabs PeerGrid" {
		t.Errorf("Expected Provider BrightData / Oxylabs PeerGrid, got %s", session.Provider)
	}
	if session.RotationPolicy != "sticky" {
		t.Errorf("Expected RotationPolicy sticky, got %s", session.RotationPolicy)
	}
	if session.ExpiresAt.Before(time.Now()) {
		t.Errorf("Expected session expiry to be in the future")
	}

	// STEP 2: Second Request with identical session=abc123 should RESUME and return identical ExitIP
	params2 := GetOrCreateSessionParams{
		SessionID:      "abc123",
		UserID:         "usr_tenant_99",
		Country:        "US",
		Provider:       "Different Provider",
		ExitIP:         "999.999.999.999", // Attempting different IP
		RotationPolicy: "sticky",
	}

	session2, isNew2, err := service.GetOrCreateProxySession(ctx, params2)
	if err != nil {
		t.Fatalf("Second request failed: %v", err)
	}
	if isNew2 {
		t.Errorf("Expected second request with session=abc123 to RESUME existing session, not create new")
	}
	if session2.ExitIP != "198.51.100.42" {
		t.Errorf("Expected sticky ExitIP 198.51.100.42 to be preserved, got %s", session2.ExitIP)
	}

	// STEP 3: On-Demand IP Rotation
	rotated, err := service.RotateProxySession(ctx, "abc123", "198.51.100.99")
	if err != nil {
		t.Fatalf("RotateProxySession failed: %v", err)
	}
	if rotated.ExitIP != "198.51.100.99" {
		t.Errorf("Expected rotated exit IP 198.51.100.99, got %s", rotated.ExitIP)
	}

	// STEP 4: Listing active sessions
	list, err := service.ListUserProxySessions(ctx, "usr_tenant_99")
	if err != nil || len(list) != 1 {
		t.Fatalf("Expected 1 active session for user, got %d", len(list))
	}

	// STEP 5: Revoke Session
	if err := service.RevokeProxySession(ctx, "abc123"); err != nil {
		t.Fatalf("RevokeProxySession failed: %v", err)
	}
	_, err = service.GetProxySession(ctx, "abc123")
	if err == nil {
		t.Errorf("Expected error fetching revoked session")
	}
}
