package credentials

import (
	"context"
	"strings"
	"testing"
)

func TestCredentialsService(t *testing.T) {
	service := NewService()
	ctx := context.Background()

	// 1. Create API key
	resp, err := service.Create(ctx, "usr_123", &CreateCredentialRequest{
		Name:      "Deployment Secret",
		Scopes:    []string{"vps:read", "vps:deploy"},
		ExpiresIn: 30,
	})
	if err != nil {
		t.Fatalf("Create credential failed: %v", err)
	}

	if !strings.HasPrefix(resp.PlainText, "cp_live_") {
		t.Errorf("Expected secret prefix cp_live_, got %s", resp.PlainText)
	}
	if resp.Credential.Prefix == "" {
		t.Errorf("Expected non-empty masked prefix")
	}

	// 2. Validate secret
	cred, err := service.ValidateSecret(ctx, resp.PlainText)
	if err != nil {
		t.Fatalf("ValidateSecret failed: %v", err)
	}
	if cred.UserID != "usr_123" {
		t.Errorf("Expected user ID usr_123, got %s", cred.UserID)
	}

	// 3. List
	list, err := service.List(ctx, "usr_123")
	if err != nil || len(list) != 1 {
		t.Fatalf("Expected 1 credential in list, got %d", len(list))
	}

	// 4. Delete
	if err := service.Delete(ctx, "usr_123", resp.Credential.ID); err != nil {
		t.Fatalf("Delete credential failed: %v", err)
	}

	_, err = service.ValidateSecret(ctx, resp.PlainText)
	if err == nil {
		t.Errorf("Expected validation to fail after deletion")
	}
}
