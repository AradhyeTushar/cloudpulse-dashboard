package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestProxyGatewayCompleteFlow(t *testing.T) {
	// 1. Mock Target Website (The Internet)
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"origin":"198.51.100.42","status":"success"}`))
	}))
	defer targetServer.Close()

	// 2. Mock Control Plane
	controlPlane := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/internal/proxy/authorize":
			var req map[string]interface{}
			_ = json.NewDecoder(r.Body).Decode(&req)
			user, _ := req["username"].(string)
			pass, _ := req["password"].(string)

			if user == "valid_user" && pass == "valid_pass" {
				w.WriteHeader(http.StatusOK)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": true,
					"data": AuthDecision{
						Allowed:          true,
						StatusCode:       200,
						UserID:           "usr_tenant_100",
						CredentialID:     "pcred_200",
						SessionID:        "sess_test_123",
						AssignedExitIP:   "198.51.100.42",
						UpstreamProvider: "ExampleResidentialGrid",
					},
				})
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"decision": AuthDecision{
						Allowed:    false,
						StatusCode: 401,
						Reason:     "Invalid proxy credentials",
					},
				})
			}
		case "/api/v1/internal/proxy/release", "/api/v1/internal/proxy/telemetry", "/api/v1/internal/proxy/abuse-event":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"success":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer controlPlane.Close()

	// 3. Initialize Gateway Server
	gw := &Gateway{
		controlPlaneURL: controlPlane.URL,
		httpClient:      &http.Client{Timeout: 3 * time.Second},
		rateLimiter:     NewIPRateLimiter(100, time.Minute),
	}

	gatewayServer := httptest.NewServer(http.HandlerFunc(gw.handleProxyRequest))
	defer gatewayServer.Close()

	gatewayURL, _ := url.Parse(gatewayServer.URL)

	// -------------------------------------------------------------------------
	// CASE A: Authorized Request through Proxy Gateway
	// -------------------------------------------------------------------------
	t.Run("Authorized Proxy Request", func(t *testing.T) {
		proxyClient := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(gatewayURL),
			},
			Timeout: 5 * time.Second,
		}

		req, _ := http.NewRequest("GET", targetServer.URL+"/test-data", nil)
		req.SetBasicAuth("valid_user", "valid_pass")

		resp, err := proxyClient.Do(req)
		if err != nil {
			t.Fatalf("Proxy request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected status 200, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "198.51.100.42") {
			t.Errorf("Expected mock response body, got %s", string(body))
		}
	})

	// -------------------------------------------------------------------------
	// CASE B: Unauthorized / Policy Blocked Request
	// -------------------------------------------------------------------------
	t.Run("Policy Rejected Request", func(t *testing.T) {
		proxyClient := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(gatewayURL),
			},
			Timeout: 5 * time.Second,
		}

		req, _ := http.NewRequest("GET", targetServer.URL+"/test-data", nil)
		req.SetBasicAuth("invalid_user", "wrong_pass")

		resp, err := proxyClient.Do(req)
		if err != nil {
			t.Fatalf("Proxy request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusUnauthorized {
			t.Fatalf("Expected status 401 Unauthorized, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// CASE C: Missing Auth (Proxy Authentication Required)
	// -------------------------------------------------------------------------
	t.Run("Missing Proxy Auth Header", func(t *testing.T) {
		proxyClient := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(gatewayURL),
			},
			Timeout: 5 * time.Second,
		}

		req, _ := http.NewRequest("GET", targetServer.URL+"/test-data", nil)
		resp, err := proxyClient.Do(req)
		if err != nil {
			t.Fatalf("Proxy request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusProxyAuthRequired {
			t.Fatalf("Expected status 407 ProxyAuthRequired, got %d", resp.StatusCode)
		}
	})
}
