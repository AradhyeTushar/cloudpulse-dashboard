package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
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

type mockUserSecurityState struct {
	mu           sync.Mutex
	userStatus   string // active, suspended
	credStatus   string // active, disabled, reset
	subStatus    string // active, expired
	allowedLands []string
}

func TestSecurityInvalidationScenarios(t *testing.T) {
	state := &mockUserSecurityState{
		userStatus:   "active",
		credStatus:   "active",
		subStatus:    "active",
		allowedLands: []string{"US", "DE"},
	}

	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"secure_data_delivered"}`))
	}))
	defer targetServer.Close()

	controlPlane := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/internal/proxy/authorize" {
			var req upstream.AuthRequest
			_ = json.NewDecoder(r.Body).Decode(&req)

			state.mu.Lock()
			defer state.mu.Unlock()

			// 1. Check user status
			if state.userStatus != "active" {
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"decision": policy.Decision{
						Allowed:    false,
						StatusCode: 403,
						Reason:     "User account is " + state.userStatus,
						UserID:     "usr_sec_tenant",
					},
				})
				return
			}

			// 2. Check credential status
			if state.credStatus != "active" {
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"decision": policy.Decision{
						Allowed:    false,
						StatusCode: 403,
						Reason:     "Proxy credential is " + state.credStatus,
						UserID:     "usr_sec_tenant",
					},
				})
				return
			}

			// 3. Check subscription status
			if state.subStatus != "active" {
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"decision": policy.Decision{
						Allowed:    false,
						StatusCode: 403,
						Reason:     "Subscription is " + state.subStatus,
						UserID:     "usr_sec_tenant",
					},
				})
				return
			}

			// 4. Check country permission
			if req.TargetCountry != "" {
				countryAllowed := false
				for _, c := range state.allowedLands {
					if strings.EqualFold(c, req.TargetCountry) {
						countryAllowed = true
						break
					}
				}
				if !countryAllowed {
					w.WriteHeader(http.StatusForbidden)
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"success": false,
						"decision": policy.Decision{
							Allowed:    false,
							StatusCode: 403,
							Reason:     "Country " + req.TargetCountry + " not authorized under plan",
							UserID:     "usr_sec_tenant",
						},
					})
					return
				}
			}

			// Authorized
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": policy.Decision{
					Allowed:          true,
					StatusCode:       200,
					UserID:           "usr_sec_tenant",
					CredentialID:     "pcred_sec_1",
					SessionID:        req.Username,
					AssignedExitIP:   "198.51.100.77",
					UpstreamProvider: "mock-residential-grid",
					ThreadsLimit:     10,
				},
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"success":true}`))
	}))
	defer controlPlane.Close()

	// Assemble Gateway
	cfg := &config.Config{DialTimeout: 2 * time.Second, FlushInterval: 100 * time.Millisecond}
	rateLimiter := limits.NewRateLimiter(500, time.Minute)
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
	// STAGE 1: Baseline Active User -> ALLOWED
	// -------------------------------------------------------------------------
	t.Run("Stage 1: Active User Allowed & Cached", func(t *testing.T) {
		req, _ := http.NewRequest("GET", targetServer.URL+"/sec-test-1", nil)
		req.SetBasicAuth("usr_sec_tenant-country-US-session-sess_sec_99", "secret_pass")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			t.Fatalf("Stage 1 failed: expected 200 OK, got %v", resp)
		}
		defer resp.Body.Close()
	})

	// -------------------------------------------------------------------------
	// STAGE 2: Admin Suspends User + Invalidation -> REJECTED
	// -------------------------------------------------------------------------
	t.Run("Stage 2: Admin Suspends User & PubSub Invalidation Rejects", func(t *testing.T) {
		state.mu.Lock()
		state.userStatus = "suspended"
		state.mu.Unlock()

		// Trigger near-real-time invalidation
		gwServer.InvalidateTarget("usr_sec_tenant")

		req, _ := http.NewRequest("GET", targetServer.URL+"/sec-test-2", nil)
		req.SetBasicAuth("usr_sec_tenant-country-US-session-sess_sec_99", "secret_pass")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden after suspension, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// STAGE 3: Credential Disabled / Reset + Invalidation -> REJECTED
	// -------------------------------------------------------------------------
	t.Run("Stage 3: Credential Disabled Rejection", func(t *testing.T) {
		state.mu.Lock()
		state.userStatus = "active" // restore user
		state.credStatus = "disabled"
		state.mu.Unlock()

		gwServer.InvalidateTarget("pcred_sec_1")

		req, _ := http.NewRequest("GET", targetServer.URL+"/sec-test-3", nil)
		req.SetBasicAuth("usr_sec_tenant-country-US-session-sess_sec_99", "secret_pass")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for disabled credential, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// STAGE 4: Subscription Expired + Invalidation -> REJECTED
	// -------------------------------------------------------------------------
	t.Run("Stage 4: Subscription Expired Rejection", func(t *testing.T) {
		state.mu.Lock()
		state.credStatus = "active"
		state.subStatus = "expired"
		state.mu.Unlock()

		gwServer.InvalidateTarget("usr_sec_tenant")

		req, _ := http.NewRequest("GET", targetServer.URL+"/sec-test-4", nil)
		req.SetBasicAuth("usr_sec_tenant-country-US-session-sess_sec_99", "secret_pass")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for expired subscription, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// STAGE 5: Country Permission Removed -> REJECTED
	// -------------------------------------------------------------------------
	t.Run("Stage 5: Country Permission Removal Rejection", func(t *testing.T) {
		state.mu.Lock()
		state.subStatus = "active"
		state.allowedLands = []string{"US"} // remove DE
		state.mu.Unlock()

		gwServer.InvalidateTarget("usr_sec_tenant")

		// Attempt to request German egress
		req, _ := http.NewRequest("GET", targetServer.URL+"/sec-test-5", nil)
		req.SetBasicAuth("usr_sec_tenant-country-DE-session-sess_sec_99", "secret_pass")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for unauthorized country, got %d", resp.StatusCode)
		}
	})
}
