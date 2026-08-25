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

	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/accounting"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/config"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/limits"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/policy"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/server"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/upstream"
)

func TestGatewayModularIntegration(t *testing.T) {
	// 1. Mock Target Web Server
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"origin":"198.51.100.42","status":"ok"}`))
	}))
	defer targetServer.Close()

	// 2. Mock Control Plane
	var controlPlaneCalls int64
	var batchTelemetryCalls int64

	controlPlane := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/internal/proxy/authorize":
			atomic.AddInt64(&controlPlaneCalls, 1)
			var req upstream.AuthRequest
			_ = json.NewDecoder(r.Body).Decode(&req)

			if strings.Contains(req.Username, "valid_user") && req.Password == "secret123" {
				w.WriteHeader(http.StatusOK)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": true,
					"data": policy.Decision{
						Allowed:          true,
						StatusCode:       200,
						UserID:           "usr_tenant_100",
						CredentialID:     "pcred_200",
						SessionID:        "sess_modular_test_99",
						AssignedExitIP:   "198.51.100.42",
						UpstreamProvider: "mock-residential-grid",
						ThreadsLimit:     2,
					},
				})
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"decision": policy.Decision{
						Allowed:    false,
						StatusCode: 401,
						Reason:     "Invalid proxy credentials",
					},
				})
			}
		case "/api/v1/internal/proxy/telemetry/batch":
			atomic.AddInt64(&batchTelemetryCalls, 1)
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"success":true}`))
		case "/api/v1/internal/proxy/abuse-event":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"success":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer controlPlane.Close()

	// 3. Assemble Gateway Subsystems
	cfg := &config.Config{
		DialTimeout:   2 * time.Second,
		FlushInterval: 100 * time.Millisecond,
	}

	rateLimiter := limits.NewRateLimiter(100, time.Minute)
	concurrency := limits.NewConcurrencyTracker(nil)
	policyCache := policy.NewCache(30 * time.Second)
	sessionMgr := sessions.NewSessionManager(nil)
	upstreamClient := upstream.NewControlPlaneClient(controlPlane.URL, 2*time.Second)
	accumulator := accounting.NewUsageAccumulator(controlPlane.URL, 100*time.Millisecond)
	defer accumulator.Stop()

	gwServer := server.NewGatewayServer(
		cfg,
		rateLimiter,
		concurrency,
		policyCache,
		sessionMgr,
		upstreamClient,
		accumulator,
	)

	proxyTestServer := httptest.NewServer(gwServer)
	defer proxyTestServer.Close()

	proxyURL, _ := url.Parse(proxyTestServer.URL)
	client := &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		},
		Timeout: 5 * time.Second,
	}

	// -------------------------------------------------------------------------
	// 1. Closed Proxy Verification (No anonymous proxy access allowed)
	// -------------------------------------------------------------------------
	t.Run("Security: Reject Anonymous Access with 407", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/anon-test", nil)
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusProxyAuthRequired {
			t.Fatalf("Expected 407 Proxy Authentication Required, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// 2. Cold Path Authorization & Tunnel Connection
	// -------------------------------------------------------------------------
	t.Run("Cold Path: Valid Credentials Authorize with Control Plane", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/auth-test-1", nil)
		req.SetBasicAuth("valid_user-session-sess_modular_test_99", "secret123")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		if atomic.LoadInt64(&controlPlaneCalls) != 1 {
			t.Errorf("Expected 1 call to Control Plane, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})

	// -------------------------------------------------------------------------
	// 3. Fast Path Session Reuse (Bypasses Control Plane)
	// -------------------------------------------------------------------------
	t.Run("Fast Path: Reuses Active Session without Control Plane Roundtrip", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/auth-test-2", nil)
		req.SetBasicAuth("valid_user-session-sess_modular_test_99", "secret123")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
		}

		// Must still be 1 call
		if atomic.LoadInt64(&controlPlaneCalls) != 1 {
			t.Errorf("Expected Control Plane calls to remain 1, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})

	// -------------------------------------------------------------------------
	// 4. Concurrency Limit Enforcement
	// -------------------------------------------------------------------------
	t.Run("Concurrency: Limits Max Concurrent Streams per User", func(t *testing.T) {
		userID := "usr_test_concurrency_mod"
		limit := 2

		if !concurrency.Acquire(t.Context(), userID, limit) {
			t.Errorf("Expected slot 1 to succeed")
		}
		if !concurrency.Acquire(t.Context(), userID, limit) {
			t.Errorf("Expected slot 2 to succeed")
		}
		if concurrency.Acquire(t.Context(), userID, limit) {
			t.Errorf("Expected slot 3 to be blocked by concurrency limit")
		}

		concurrency.Release(t.Context(), userID)

		if !concurrency.Acquire(t.Context(), userID, limit) {
			t.Errorf("Expected retry slot to succeed after release")
		}
		concurrency.Release(t.Context(), userID)
		concurrency.Release(t.Context(), userID)
	})

	// -------------------------------------------------------------------------
	// 5. Asynchronous Batch Usage Flush
	// -------------------------------------------------------------------------
	t.Run("Accounting: Non-blocking Periodic Flush to Control Plane", func(t *testing.T) {
		time.Sleep(250 * time.Millisecond)

		if atomic.LoadInt64(&batchTelemetryCalls) == 0 {
			t.Errorf("Expected at least 1 batched telemetry flush call to Control Plane")
		}
	})

	// -------------------------------------------------------------------------
	// 6. Policy Invalidation
	// -------------------------------------------------------------------------
	t.Run("Policy: Invalidation Evicts Cache", func(t *testing.T) {
		gwServer.InvalidateTarget("usr_tenant_100")

		req, _ := http.NewRequest("GET", targetServer.URL+"/auth-test-3", nil)
		req.SetBasicAuth("valid_user-session-sess_modular_test_99", "secret123")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// Call count should now increase to 2 after invalidation
		if atomic.LoadInt64(&controlPlaneCalls) != 2 {
			t.Errorf("Expected 2 calls to Control Plane after invalidation, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})
}
