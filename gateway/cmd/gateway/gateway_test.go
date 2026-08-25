package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestProxyGatewaySessionManagerFastPath(t *testing.T) {
	// 1. Mock Destination Website
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"origin":"198.51.100.42","status":"fast_path_ok"}`))
	}))
	defer targetServer.Close()

	// 2. Mock Control Plane - Track number of /authorize calls
	var controlPlaneCalls int64
	controlPlane := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/internal/proxy/authorize":
			atomic.AddInt64(&controlPlaneCalls, 1)
			var req map[string]interface{}
			_ = json.NewDecoder(r.Body).Decode(&req)
			user, _ := req["username"].(string)
			pass, _ := req["password"].(string)

			if strings.Contains(user, "valid_user") && pass == "valid_pass" {
				w.WriteHeader(http.StatusOK)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": true,
					"data": AuthDecision{
						Allowed:          true,
						StatusCode:       200,
						UserID:           "usr_tenant_100",
						CredentialID:     "pcred_200",
						SessionID:        "sess_fast_path_123",
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

	// 3. Initialize Gateway with Fast-Path Session Manager
	gw := &Gateway{
		controlPlaneURL: controlPlane.URL,
		httpClient:      &http.Client{Timeout: 3 * time.Second},
		rateLimiter:     NewIPRateLimiter(100, time.Minute),
		policyCache:     NewPolicyCache(30 * time.Second),
		inMemSessions:   make(map[string]*AuthDecision),
	}

	gatewayServer := httptest.NewServer(http.HandlerFunc(gw.handleProxyRequest))
	defer gatewayServer.Close()

	gatewayURL, _ := url.Parse(gatewayServer.URL)

	proxyClient := &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(gatewayURL),
		},
		Timeout: 5 * time.Second,
	}

	// -------------------------------------------------------------------------
	// REQUEST 1 (COLD PATH / MISS): First request with session-sess_fast_path_123
	// -------------------------------------------------------------------------
	t.Run("Cold Path: First Request Hits Control Plane", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/test-data-1", nil)
		req.SetBasicAuth("valid_user-session-sess_fast_path_123", "valid_pass")

		resp, err := proxyClient.Do(req)
		if err != nil {
			t.Fatalf("First request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		if atomic.LoadInt64(&controlPlaneCalls) != 1 {
			t.Errorf("Expected exactly 1 call to Control Plane, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})

	// -------------------------------------------------------------------------
	// REQUEST 2 (FAST PATH / HIT): Subsequent request with SAME session ID
	// Must reuse existing session without calling Control Plane!
	// -------------------------------------------------------------------------
	t.Run("Fast Path: Second Request Reuses Session Manager directly (<0.5ms)", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/test-data-2", nil)
		req.SetBasicAuth("valid_user-session-sess_fast_path_123", "valid_pass")

		resp, err := proxyClient.Do(req)
		if err != nil {
			t.Fatalf("Second request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		// Control Plane call count should STILL be 1 (0 new calls because it hit Fast-Path cache!)
		if atomic.LoadInt64(&controlPlaneCalls) != 1 {
			t.Errorf("Fast-path failed: expected Control Plane calls to remain 1, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})
}
