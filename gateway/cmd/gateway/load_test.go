package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"sync"
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

func TestHighConcurrencyCustomerLoad(t *testing.T) {
	// 1. Target HTTP Web Server
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"origin":"198.51.100.42","bytes":64}`))
	}))
	defer targetServer.Close()

	// 2. Mock Control Plane
	controlPlane := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/internal/proxy/authorize" {
			var req upstream.AuthRequest
			_ = json.NewDecoder(r.Body).Decode(&req)

			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": policy.Decision{
					Allowed:          true,
					StatusCode:       200,
					UserID:           req.Username,
					CredentialID:     "pcred_" + req.Username,
					SessionID:        "sess_" + req.Username,
					AssignedExitIP:   "198.51.100.42",
					UpstreamProvider: "mock-residential-grid",
					ThreadsLimit:     50,
				},
			})
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer controlPlane.Close()

	// 3. Assemble Gateway
	cfg := &config.Config{
		DialTimeout:    2 * time.Second,
		FlushInterval:  1 * time.Second,
		MaxConcurrency: 5000,
	}

	rateLimiter := limits.NewRateLimiter(50000, time.Minute) // High ceiling for benchmark
	concurrency := limits.NewConcurrencyTracker(nil)
	policyCache := policy.NewCache(60 * time.Second)
	sessionMgr := sessions.NewSessionManager(nil)
	upstreamClient := upstream.NewControlPlaneClient(controlPlane.URL, 2*time.Second)
	accumulator := accounting.NewUsageAccumulator(controlPlane.URL, 1*time.Second)
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
	httpClient := &http.Client{
		Transport: &http.Transport{
			Proxy:               http.ProxyURL(proxyURL),
			MaxIdleConnsPerHost: 200,
			MaxIdleConns:        500,
		},
		Timeout: 5 * time.Second,
	}

	numCustomers := 100
	requestsPerCustomer := 10
	totalRequests := numCustomers * requestsPerCustomer // 1,000 total requests

	var successfulRequests int64
	var failedRequests int64
	var totalBytes int64

	latencies := make([]time.Duration, totalRequests)
	var latIndex int64

	t.Logf("⚡ Starting High-Concurrency Load Test: %d concurrent customers, %d requests each (%d total)...", numCustomers, requestsPerCustomer, totalRequests)
	startTime := time.Now()

	var wg sync.WaitGroup
	wg.Add(numCustomers)

	for c := 0; c < numCustomers; c++ {
		custID := fmt.Sprintf("cust_%03d", c)
		go func(customerID string) {
			defer wg.Done()
			for r := 0; r < requestsPerCustomer; r++ {
				reqStart := time.Now()
				req, _ := http.NewRequest("GET", targetServer.URL+"/data", nil)
				req.SetBasicAuth(fmt.Sprintf("%s-session-sess_%s", customerID, customerID), "secure_pass")

				resp, err := httpClient.Do(req)
				dur := time.Since(reqStart)

				idx := atomic.AddInt64(&latIndex, 1) - 1
				if idx < int64(len(latencies)) {
					latencies[idx] = dur
				}

				if err == nil && resp.StatusCode == http.StatusOK {
					atomic.AddInt64(&successfulRequests, 1)
					atomic.AddInt64(&totalBytes, 64)
					_ = resp.Body.Close()
				} else {
					atomic.AddInt64(&failedRequests, 1)
					if resp != nil {
						_ = resp.Body.Close()
					}
				}
			}
		}(custID)
	}

	wg.Wait()
	totalDuration := time.Since(startTime)

	// Latency percentiles calculation
	sort.Slice(latencies, func(i, j int) bool {
		return latencies[i] < latencies[j]
	})

	p50 := latencies[len(latencies)*50/100]
	p90 := latencies[len(latencies)*90/100]
	p99 := latencies[len(latencies)*99/100]
	rps := float64(successfulRequests) / totalDuration.Seconds()

	t.Logf("================ LOAD TEST RESULTS ================")
	t.Logf("Total Time:          %v", totalDuration)
	t.Logf("Successful Requests: %d / %d (%.2f%%)", successfulRequests, totalRequests, float64(successfulRequests)*100/float64(totalRequests))
	t.Logf("Failed Requests:     %d", failedRequests)
	t.Logf("Throughput:          %.2f requests/sec", rps)
	t.Logf("Latency P50:         %v", p50)
	t.Logf("Latency P90:         %v", p90)
	t.Logf("Latency P99:         %v", p99)
	t.Logf("===================================================")

	if successfulRequests < int64(totalRequests) {
		t.Errorf("Expected 100%% success rate under load, got %d / %d", successfulRequests, totalRequests)
	}
}
