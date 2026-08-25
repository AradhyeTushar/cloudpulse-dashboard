package sessions

import (
	"context"
	"testing"
	"time"
)

func TestCustomerSessionLifecycle(t *testing.T) {
	service := NewService(nil) // in-memory store mode for tests
	ctx := context.Background()

	// STEP 1: Create a Sticky Session for user usr_tenant_99 with session=abc123 and country=US
	params := GetOrCreateSessionParams{
		SessionID:         "abc123",
		UserID:            "usr_tenant_99",
		CredentialID:      "pcred_42",
		Country:           "US",
		RotationMode:      "sticky",
		ProviderID:        "ExampleResidentialGrid",
		ProviderSessionID: "psess_882",
		DurationMin:       15,
	}

	session, isNew, err := service.GetOrCreateSession(ctx, params)
	if err != nil {
		t.Fatalf("GetOrCreateSession failed: %v", err)
	}
	if !isNew {
		t.Errorf("Expected first request to create a NEW session")
	}

	// Verify All Customer Session Identity Fields (cleanly decoupled from Exit IP)
	if session.ID != "abc123" {
		t.Errorf("Expected Session ID abc123, got %s", session.ID)
	}
	if session.UserID != "usr_tenant_99" {
		t.Errorf("Expected UserID usr_tenant_99, got %s", session.UserID)
	}
	if session.CredentialID != "pcred_42" {
		t.Errorf("Expected CredentialID pcred_42, got %s", session.CredentialID)
	}
	if session.Country != "US" {
		t.Errorf("Expected Country US, got %s", session.Country)
	}
	if session.ProviderID != "ExampleResidentialGrid" {
		t.Errorf("Expected ProviderID ExampleResidentialGrid, got %s", session.ProviderID)
	}
	if session.RotationMode != "sticky" {
		t.Errorf("Expected RotationMode sticky, got %s", session.RotationMode)
	}
	if session.ExpiresAt.Before(time.Now()) {
		t.Errorf("Expected session expiry to be in the future")
	}

	// STEP 2: Second Request with identical session=abc123 should RESUME the session
	session2, isNew2, err := service.GetOrCreateSession(ctx, params)
	if err != nil {
		t.Fatalf("Second request failed: %v", err)
	}
	if isNew2 {
		t.Errorf("Expected second request with session=abc123 to RESUME existing session, not create new")
	}
	if session2.ID != session.ID {
		t.Errorf("Expected session ID equality, got %s vs %s", session2.ID, session.ID)
	}

	// STEP 3: Listing active sessions for customer
	list, err := service.ListUserSessions(ctx, "usr_tenant_99")
	if err != nil || len(list) != 1 {
		t.Fatalf("Expected 1 active session for user, got %d", len(list))
	}

	// STEP 4: Revoke Session
	if err := service.RevokeSession(ctx, "abc123"); err != nil {
		t.Fatalf("RevokeSession failed: %v", err)
	}
	_, err = service.GetSession(ctx, "abc123")
	if err == nil {
		t.Errorf("Expected error fetching revoked session")
	}
}
