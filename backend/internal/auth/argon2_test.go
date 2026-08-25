package auth

import (
	"testing"
	"time"
)

func TestArgon2PasswordHashing(t *testing.T) {
	password := "CloudPulseSecurePass123!"

	// Use lightweight params for quick test execution
	params := &Argon2Params{
		Memory:      16 * 1024,
		Iterations:  2,
		Parallelism: 2,
		SaltLength:  16,
		KeyLength:   32,
	}

	hash, err := HashPassword(password, params)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hash == "" {
		t.Fatal("Expected non-empty hash string")
	}

	// Verify correct password matches
	match, err := VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("VerifyPassword error: %v", err)
	}
	if !match {
		t.Errorf("Expected password to match hash")
	}

	// Verify incorrect password fails
	badMatch, err := VerifyPassword("WrongPassword!", hash)
	if err != nil {
		t.Fatalf("VerifyPassword error on wrong password: %v", err)
	}
	if badMatch {
		t.Errorf("Expected wrong password to fail matching")
	}
}

func TestTokenService(t *testing.T) {
	ts := NewTokenService("test_secret_key_minimum_32_bytes_long!", time.Hour)
	token, exp, err := ts.GenerateToken("usr_123", "test@cloudpulse.io", "owner", "Test Workspace")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("Token is empty")
	}
	if exp.IsZero() {
		t.Fatal("Expiration time is zero")
	}

	claims, err := ts.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != "usr_123" {
		t.Errorf("Expected userID usr_123, got %s", claims.UserID)
	}
	if claims.Role != "owner" {
		t.Errorf("Expected role owner, got %s", claims.Role)
	}
}
