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

func TestProxyGatewayProductionFeatures(t *testing.T) {
	// 1. Mock Destination Server
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"origin":"198.51.100.42","status":"fast_path_ok"}`))
	}))
	defer targetServer.Close()

	// 2. Mock Control Plane
	var controlPlaneCalls int64
	var batchTelemetryFlushes int64

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
						UpstreamProvider: "provider-a",
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
		case "/api/v1/internal/proxy/telemetry/batch":
			atomic.AddInt64(&batchTelemetryFlushes, 1)
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"success":true}`))
		case "/api/v1/internal/proxy/release", "/api/v1/internal/proxy/telemetry", "/api/v1/internal/proxy/abuse-event":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"success":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer controlPlane.Close()

	// 3. Initialize Gateway with Fast-Path Session Manager and Asynchronous Accumulator (100ms flush for test)
	gw := &Gateway{
		controlPlaneURL: controlPlane.URL,
		httpClient:      &http.Client{Timeout: 3 * time.Second},
		rateLimiter:     NewIPRateLimiter(100, time.Minute),
		policyCache:     NewPolicyCache(30 * time.Second),
		accumulator:     NewUsageAccumulator(controlPlane.URL, 100*time.Millisecond),
		inMemSessions:   make(map[string]*AuthDecision),
		inMemThreads:    make(map[string]int),
	}
	defer gw.accumulator.Stop()

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
	// CASE 1: Cold Path Miss & Tunnel Establishment
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
	// CASE 2: Fast Path Session Reuse (<0.5ms)
	// -------------------------------------------------------------------------
	t.Run("Fast Path: Second Request Reuses Session Manager directly", func(t *testing.T) {
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

		// Control Plane calls must remain 1
		if atomic.LoadInt64(&controlPlaneCalls) != 1 {
			t.Errorf("Fast-path failed: expected Control Plane calls to remain 1, got %d", atomic.LoadInt64(&controlPlaneCalls))
		}
	})

	// -------------------------------------------------------------------------
	// CASE 3: Asynchronous Batch Telemetry Flush (Non-blocking)
	// -------------------------------------------------------------------------
	t.Run("Asynchronous Batch Telemetry Flush", func(t *testing.T) {
		// Allow the 100ms ticker to flush the accumulated records
		time.Sleep(250 * time.Millisecond)

		if atomic.LoadInt64(&batchTelemetryFlushes) == 0 {
			t.Errorf("Expected at least 1 batched telemetry flush to Control Plane, got %d", atomic.LoadInt64(&batchTelemetryFlushes))
		}
	})

	// -------------------------------------------------------------------------
	// CASE 4: Atomic Concurrency Limit Acquisition
	// -------------------------------------------------------------------------
	t.Run("Atomic Concurrency Limit", func(t *testing.T) {
		userID := "usr_test_concurrency"
		limit := 2

		// Slot 1
		ok1 := gw.acquireConcurrencySlot(t.Context(), userID, limit)
		if !ok1 {
			t.Errorf("Expected slot 1 acquisition to succeed")
		}

		// Slot 2
		ok2 := gw.acquireConcurrencySlot(t.Context(), userID, limit)
		if !ok2 {
			t.Errorf("Expected slot 2 acquisition to succeed")
		}

		// Slot 3 (Should be rejected)
		ok3 := gw.acquireConcurrencySlot(t.Context(), userID, limit)
		if ok3 {
			t.Errorf("Expected slot 3 acquisition to be rejected by atomic limit")
		}

		// Release 1 slot
		gw.releaseConcurrencySlot(t.Context(), userID)

		// Slot 3 retry (Should succeed)
		okRetry := gw.acquireConcurrencySlot(t.Context(), userID, limit)
		if !okRetry {
			t.Errorf("Expected slot retry acquisition to succeed after release")
		}

		// Clean up
		gw.releaseConcurrencySlot(t.Context(), userID)
		gw.releaseConcurrencySlot(t.Context(), userID)
	})
}
