package credentials

import (
	"context"
	"strings"
	"testing"
)

func TestCredentialsService(t *testing.T) {
	repo := NewMemoryRepository()
	service := NewService(repo)
	ctx := context.Background()

	// 1. Create API key
	resp, err := service.CreateApiKey(ctx, "usr_123", &CreateApiKeyRequest{
		Name:      "Deployment Secret",
		Scopes:    []string{"proxy:read", "proxy:write"},
		ExpiresIn: 30,
	})
	if err != nil {
		t.Fatalf("Create API key failed: %v", err)
	}

	if !strings.HasPrefix(resp.PlainTextSecret, "cp_live_") {
		t.Errorf("Expected secret prefix cp_live_, got %s", resp.PlainTextSecret)
	}
	if resp.ApiKey.Prefix == "" {
		t.Errorf("Expected non-empty masked prefix")
	}

	// 2. Validate secret
	key, err := service.ValidateSecret(ctx, resp.PlainTextSecret)
	if err != nil {
		t.Fatalf("ValidateSecret failed: %v", err)
	}
	if key.UserID != "usr_123" {
		t.Errorf("Expected user ID usr_123, got %s", key.UserID)
	}

	// 3. Create Proxy Credential
	pCred, err := service.CreateProxyCredential(ctx, "usr_123", &CreateProxyCredentialRequest{
		Name:               "US Residential Pool",
		ProxyType:          "residential",
		Protocol:           "http",
		RotationMode:       "sticky",
		SessionDurationMin: 15,
		TargetCountry:      "United States",
		TargetCountryCode:  "US",
	})
	if err != nil {
		t.Fatalf("CreateProxyCredential failed: %v", err)
	}
	if !strings.HasPrefix(pCred.Username, "cp_") {
		t.Errorf("Expected username prefix cp_, got %s", pCred.Username)
	}
	if pCred.PlainPassword == "" {
		t.Errorf("Expected non-empty generated password")
	}

	// 4. List Proxy Credentials
	pList, err := service.ListProxyCredentials(ctx, "usr_123")
	if err != nil || len(pList) != 1 {
		t.Fatalf("Expected 1 proxy credential in list, got %d", len(pList))
	}

	// 5. Delete Proxy Credential
	if err := service.DeleteProxyCredential(ctx, "usr_123", pCred.ID); err != nil {
		t.Fatalf("DeleteProxyCredential failed: %v", err)
	}
	pListAfter, _ := service.ListProxyCredentials(ctx, "usr_123")
	if len(pListAfter) != 0 {
		t.Errorf("Expected 0 proxy credentials after deletion, got %d", len(pListAfter))
	}
}
