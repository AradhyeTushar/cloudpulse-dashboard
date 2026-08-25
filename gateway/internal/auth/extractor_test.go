package auth

import (
	"net/http"
	"testing"
)

func TestExtractCredentials(t *testing.T) {
	t.Run("Standard Basic Auth", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "http://example.com", nil)
		req.SetBasicAuth("usr_alice", "secret_pass")

		creds := ExtractCredentials(req)
		if creds == nil {
			t.Fatalf("Expected credentials to be extracted")
		}
		if creds.Username != "usr_alice" {
			t.Errorf("Expected username usr_alice, got %s", creds.Username)
		}
		if creds.Password != "secret_pass" {
			t.Errorf("Expected password secret_pass, got %s", creds.Password)
		}
	})

	t.Run("Inline Country and Session Flags", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "http://example.com", nil)
		req.Header.Set("Proxy-Authorization", "Basic dXNyX2FsaWNlLWNvdW50cnktREUtc2Vzc2lvbi1hYmMxMjM6cGFzczEyMw==") // usr_alice-country-DE-session-abc123:pass123

		creds := ExtractCredentials(req)
		if creds == nil {
			t.Fatalf("Expected credentials to be extracted")
		}
		if creds.Username != "usr_alice" {
			t.Errorf("Expected base username usr_alice, got %s", creds.Username)
		}
		if creds.Country != "DE" {
			t.Errorf("Expected country DE, got %s", creds.Country)
		}
		if creds.SessionID != "abc123" {
			t.Errorf("Expected session ID abc123, got %s", creds.SessionID)
		}
	})

	t.Run("Missing Auth Header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "http://example.com", nil)
		creds := ExtractCredentials(req)
		if creds != nil {
			t.Errorf("Expected nil credentials for request without auth header")
		}
	})
}
