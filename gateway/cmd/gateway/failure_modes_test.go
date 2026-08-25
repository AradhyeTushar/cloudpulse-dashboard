package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
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

func TestGatewayFailClosedModes(t *testing.T) {
	// -------------------------------------------------------------------------
	// 1. Control Plane Unavailable -> Fails Closed for Unknown Customer
	// -------------------------------------------------------------------------
	t.Run("Failure Mode 1: Control Plane Unavailable Rejects Unknown Customer", func(t *testing.T) {
		cfg := &config.Config{DialTimeout: 500 * time.Millisecond, FlushInterval: 100 * time.Millisecond}
		rateLimiter := limits.NewRateLimiter(100, time.Minute)
		concurrency := limits.NewConcurrencyTracker(nil)
		policyCache := policy.NewCache(30 * time.Second)
		sessionMgr := sessions.NewSessionManager(nil)
		// Dead URL to simulate Control Plane crash/unavailability
		upstreamClient := upstream.NewControlPlaneClient("http://127.0.0.1:59999", 500*time.Millisecond)
		accumulator := accounting.NewUsageAccumulator("http://127.0.0.1:59999", 100*time.Millisecond)
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

		proxyServer := httptest.NewServer(gwServer)
		defer proxyServer.Close()

		proxyURL, _ := url.Parse(proxyServer.URL)
		client := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(proxyURL),
			},
			Timeout: 2 * time.Second,
		}

		req, _ := http.NewRequest("GET", "http://example.com/data", nil)
		req.SetBasicAuth("unknown_user", "password123")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// MUST NOT BE 200 OK (Never open proxy on failure)
		if resp.StatusCode == http.StatusOK {
			t.Fatalf("CRITICAL SECURITY FLAW: Open proxy behavior observed during Control Plane outage!")
		}
		if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusServiceUnavailable && resp.StatusCode != http.StatusBadGateway {
			t.Logf("Notice: Returned status %d on control plane outage", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// 2. Control Plane Unavailable BUT Valid Cached Policy Exists -> Resilient Pass
	// -------------------------------------------------------------------------
	t.Run("Failure Mode 2: Control Plane Unavailable but Valid Cached Policy Resiliently Passes", func(t *testing.T) {
		targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"cached_resilience_ok"}`))
		}))
		defer targetServer.Close()

		cfg := &config.Config{DialTimeout: 500 * time.Millisecond, FlushInterval: 100 * time.Millisecond}
		rateLimiter := limits.NewRateLimiter(100, time.Minute)
		concurrency := limits.NewConcurrencyTracker(nil)
		policyCache := policy.NewCache(30 * time.Second)
		sessionMgr := sessions.NewSessionManager(nil)
		upstreamClient := upstream.NewControlPlaneClient("http://127.0.0.1:59999", 500*time.Millisecond)
		accumulator := accounting.NewUsageAccumulator("http://127.0.0.1:59999", 100*time.Millisecond)
		defer accumulator.Stop()

		// Pre-populate policy cache with valid active customer decision
		validDec := &policy.Decision{
			Allowed:          true,
			StatusCode:       200,
			UserID:           "usr_cached_tenant",
			CredentialID:     "pcred_cached_1",
			SessionID:        "sess_cached_123",
			AssignedExitIP:   "198.51.100.55",
			UpstreamProvider: "mock-residential-grid",
			ThreadsLimit:     10,
		}
		sessionMgr.SaveSession(context.Background(), "sess_cached_123", validDec, 15*time.Minute)

		gwServer := server.NewGatewayServer(
			cfg,
			rateLimiter,
			concurrency,
			policyCache,
			sessionMgr,
			upstreamClient,
			accumulator,
		)

		proxyServer := httptest.NewServer(gwServer)
		defer proxyServer.Close()

		proxyURL, _ := url.Parse(proxyServer.URL)
		client := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(proxyURL),
			},
			Timeout: 2 * time.Second,
		}

		req, _ := http.NewRequest("GET", targetServer.URL+"/cached-test", nil)
		req.SetBasicAuth("usr_cached_tenant-session-sess_cached_123", "password123")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200 OK using cached policy, got %d", resp.StatusCode)
		}
	})

	// -------------------------------------------------------------------------
	// 3. Upstream Provider Failure -> Fails Closed with 502/503
	// -------------------------------------------------------------------------
	t.Run("Failure Mode 3: Upstream Provider Down Fails Closed", func(t *testing.T) {
		cfg := &config.Config{DialTimeout: 200 * time.Millisecond, FlushInterval: 100 * time.Millisecond}
		rateLimiter := limits.NewRateLimiter(100, time.Minute)
		concurrency := limits.NewConcurrencyTracker(nil)
		policyCache := policy.NewCache(30 * time.Second)
		sessionMgr := sessions.NewSessionManager(nil)
		upstreamClient := upstream.NewControlPlaneClient("http://127.0.0.1:59999", 200*time.Millisecond)
		accumulator := accounting.NewUsageAccumulator("http://127.0.0.1:59999", 100*time.Millisecond)
		defer accumulator.Stop()

		// Pre-populate session with unreachable upstream host
		unreachableDec := &policy.Decision{
			Allowed:          true,
			StatusCode:       200,
			UserID:           "usr_tenant_provider_down",
			SessionID:        "sess_dead_upstream",
			UpstreamProvider: "dead-provider",
			UpstreamHost:     "127.0.0.1:59998", // Dead upstream port
		}
		sessionMgr.SaveSession(context.Background(), "sess_dead_upstream", unreachableDec, 15*time.Minute)

		gwServer := server.NewGatewayServer(
			cfg,
			rateLimiter,
			concurrency,
			policyCache,
			sessionMgr,
			upstreamClient,
			accumulator,
		)

		proxyServer := httptest.NewServer(gwServer)
		defer proxyServer.Close()

		proxyURL, _ := url.Parse(proxyServer.URL)
		client := &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(proxyURL),
			},
			Timeout: 2 * time.Second,
		}

		req, _ := http.NewRequest("GET", "http://example.com/upstream-test", nil)
		req.SetBasicAuth("usr-session-sess_dead_upstream", "pass")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadGateway && resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("Expected 502 Bad Gateway or 503 Service Unavailable, got %d", resp.StatusCode)
		}
	})
}
