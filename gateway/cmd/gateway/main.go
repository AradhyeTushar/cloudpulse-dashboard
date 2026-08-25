package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
)

// =========================================================================
// 1. PROMETHEUS OPERATIONAL METRICS (Cardinally Clean)
// =========================================================================

var (
	gatewayActiveTunnels = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "gateway_active_tunnels",
			Help: "Current active proxy connections",
		},
	)

	gatewayConnectionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_connections_total",
			Help: "Total proxy tunnel connection requests processed by CloudPulse Gateway",
		},
		[]string{"protocol", "status"},
	)

	gatewayBytesTransferredTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_bytes_transferred_total",
			Help: "Total bytes transferred across proxy tunnels",
		},
		[]string{"direction"}, // Inbound / Outbound (low-cardinality)
	)

	gatewayErrorsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_errors_total",
			Help: "Total error events encountered at gateway edge",
		},
		[]string{"error_type"}, // dial_error, hijack_error, rate_limited, policy_rejected
	)

	gatewayProviderRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_provider_requests_total",
			Help: "Total proxy allocations requested per upstream provider",
		},
		[]string{"provider"},
	)

	gatewayProviderFailuresTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_provider_failures_total",
			Help: "Total proxy allocation failures per upstream provider",
		},
		[]string{"provider"},
	)

	gatewayDialDuration = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "gateway_dial_duration_seconds",
			Help:    "Upstream connection dial latency in seconds",
			Buckets: prometheus.DefBuckets,
		},
	)

	gatewaySessionCacheHits = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "gateway_session_cache_hits_total",
			Help: "Fast-path session cache hits (bypassing Control Plane HTTP roundtrip)",
		},
	)

	gatewaySessionCacheMisses = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "gateway_session_cache_misses_total",
			Help: "Session cache misses (requiring Control Plane allocation)",
		},
	)

	gatewayRateLimitHits = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "gateway_rate_limit_hits_total",
			Help: "Total edge rate limit blocks",
		},
	)
)

// =========================================================================
// 2. ATOMIC REDIS CONCURRENCY LUA SCRIPTS (Item 10)
// =========================================================================

var acquireSlotScript = redis.NewScript(`
	local key = KEYS[1]
	local limit = tonumber(ARGV[1])
	local current = tonumber(redis.call('get', key) or '0')
	if current < limit then
		redis.call('incr', key)
		redis.call('expire', key, 120) -- safety TTL for crash recovery
		return 1
	else
		return 0
	end
`)

var releaseSlotScript = redis.NewScript(`
	local key = KEYS[1]
	local current = tonumber(redis.call('get', key) or '0')
	if current > 0 then
		redis.call('decr', key)
	end
	return 1
`)

// =========================================================================
// 3. ASYNCHRONOUS BATCHED USAGE ACCUMULATOR (Item 11)
// =========================================================================

type AggregatedUsage struct {
	UserID       string `json:"user_id"`
	CredentialID string `json:"credential_id"`
	BytesIn      int64  `json:"bytes_in"`
	BytesOut     int64  `json:"bytes_out"`
	Requests     int64  `json:"requests"`
	TargetDomain string `json:"target_domain"`
}

type UsageAccumulator struct {
	mu          sync.Mutex
	pending     map[string]*AggregatedUsage
	flushTicker *time.Ticker
	flushChan   chan struct{}
	apiURL      string
	httpClient  *http.Client
}

func NewUsageAccumulator(apiURL string, flushInterval time.Duration) *UsageAccumulator {
	acc := &UsageAccumulator{
		pending:     make(map[string]*AggregatedUsage),
		flushTicker: time.NewTicker(flushInterval),
		flushChan:   make(chan struct{}, 1),
		apiURL:      apiURL,
		httpClient:  &http.Client{Timeout: 5 * time.Second},
	}
	go acc.flushLoop()
	return acc
}

func (acc *UsageAccumulator) Record(userID, credID string, bytesIn, bytesOut int64, domain string) {
	if userID == "" || userID == "anonymous" {
		return
	}

	acc.mu.Lock()
	defer acc.mu.Unlock()

	key := fmt.Sprintf("%s:%s:%s", userID, credID, domain)
	if existing, exists := acc.pending[key]; exists {
		existing.BytesIn += bytesIn
		existing.BytesOut += bytesOut
		existing.Requests++
	} else {
		acc.pending[key] = &AggregatedUsage{
			UserID:       userID,
			CredentialID: credID,
			BytesIn:      bytesIn,
			BytesOut:     bytesOut,
			Requests:     1,
			TargetDomain: domain,
		}
	}
}

func (acc *UsageAccumulator) flushLoop() {
	for {
		select {
		case <-acc.flushTicker.C:
			acc.flushBatch()
		case <-acc.flushChan:
			acc.flushBatch()
			return
		}
	}
}

func (acc *UsageAccumulator) flushBatch() {
	acc.mu.Lock()
	if len(acc.pending) == 0 {
		acc.mu.Unlock()
		return
	}

	var batch []*AggregatedUsage
	for _, v := range acc.pending {
		batch = append(batch, v)
	}
	acc.pending = make(map[string]*AggregatedUsage)
	acc.mu.Unlock()

	// Send non-blocking asynchronous batch flush to Control Plane
	go func(records []*AggregatedUsage) {
		payload := map[string]interface{}{"batch": records}
		body, err := json.Marshal(payload)
		if err != nil {
			return
		}

		req, err := http.NewRequest("POST", acc.apiURL+"/api/v1/internal/proxy/telemetry/batch", bytes.NewReader(body))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := acc.httpClient.Do(req)
		if err == nil {
			_ = resp.Body.Close()
		}
	}(batch)
}

func (acc *UsageAccumulator) Stop() {
	acc.flushTicker.Stop()
	acc.flushChan <- struct{}{}
}

// =========================================================================
// 4. DATA STRUCTURES & LOCAL POLICY CACHE
// =========================================================================

type AuthDecision struct {
	Allowed             bool      `json:"allowed"`
	StatusCode          int       `json:"status_code"`
	Reason              string    `json:"reason"`
	UserID              string    `json:"user_id"`
	CredentialID        string    `json:"credential_id"`
	SessionID           string    `json:"session_id"`
	AssignedExitIP      string    `json:"assigned_exit_ip"`
	UpstreamProvider    string    `json:"upstream_provider"`
	UpstreamHost        string    `json:"upstream_host"`
	RemainingQuotaBytes int64     `json:"remaining_quota_bytes"`
	ExpiresAt           time.Time `json:"expires_at"`
}

type PolicyCache struct {
	mu      sync.RWMutex
	entries map[string]*cachedPolicy
	ttl     time.Duration
}

type cachedPolicy struct {
	decision  *AuthDecision
	expiresAt time.Time
}

func NewPolicyCache(ttl time.Duration) *PolicyCache {
	return &PolicyCache{
		entries: make(map[string]*cachedPolicy),
		ttl:     ttl,
	}
}

func (c *PolicyCache) Get(key string) (*AuthDecision, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, exists := c.entries[key]
	if !exists || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.decision, true
}

func (c *PolicyCache) Set(key string, decision *AuthDecision) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = &cachedPolicy{
		decision:  decision,
		expiresAt: time.Now().Add(c.ttl),
	}
}

func (c *PolicyCache) InvalidateTarget(target string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if target == "" || target == "*" {
		c.entries = make(map[string]*cachedPolicy)
		return
	}
	for k, v := range c.entries {
		if v.decision != nil && (v.decision.UserID == target || v.decision.CredentialID == target || strings.Contains(k, target)) {
			delete(c.entries, k)
		}
	}
}

// Edge Rate Limiter
type IPRateLimiter struct {
	mu      sync.Mutex
	limits  map[string][]time.Time
	maxReqs int
	window  time.Duration
}

func NewIPRateLimiter(maxReqs int, window time.Duration) *IPRateLimiter {
	return &IPRateLimiter{
		limits:  make(map[string][]time.Time),
		maxReqs: maxReqs,
		window:  window,
	}
}

func (rl *IPRateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	var valid []time.Time
	for _, t := range rl.limits[ip] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.maxReqs {
		rl.limits[ip] = valid
		return false
	}

	rl.limits[ip] = append(valid, now)
	return true
}

// Gateway Server Struct
type Gateway struct {
	httpPort        string
	metricsPort     string
	controlPlaneURL string
	activeCount     int64
	httpClient      *http.Client
	rateLimiter     *IPRateLimiter
	policyCache     *PolicyCache
	accumulator     *UsageAccumulator
	redisClient     *redis.Client
	inMemSessions   map[string]*AuthDecision
	inMemThreads    map[string]int
	sessMu          sync.RWMutex
}

func main() {
	log.Println("[GATEWAY BOOT] Starting CloudPulse High-Throughput Proxy Gateway...")

	httpPort := getEnv("GATEWAY_HTTP_PORT", "8000")
	metricsPort := getEnv("GATEWAY_METRICS_PORT", "9100")
	controlPlaneURL := getEnv("CONTROL_PLANE_URL", "http://localhost:8080")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379")

	var rClient *redis.Client
	opt, err := redis.ParseURL(redisURL)
	if err == nil {
		rClient = redis.NewClient(opt)
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := rClient.Ping(ctx).Err(); err != nil {
			log.Printf("[REDIS INFO] Running in local memory mode: %v", err)
			rClient = nil
		} else {
			log.Println("[REDIS CONNECTED] Atomic Redis Concurrency & Session Store active")
		}
		cancel()
	}

	gw := &Gateway{
		httpPort:        httpPort,
		metricsPort:     metricsPort,
		controlPlaneURL: controlPlaneURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		rateLimiter:   NewIPRateLimiter(120, time.Minute),
		policyCache:   NewPolicyCache(30 * time.Second),
		accumulator:   NewUsageAccumulator(controlPlaneURL, 5*time.Second), // 5s batched flush
		redisClient:   rClient,
		inMemSessions: make(map[string]*AuthDecision),
		inMemThreads:  make(map[string]int),
	}

	// 0. Redis Pub/Sub Policy Invalidation Listener
	if rClient != nil {
		go func() {
			pubsub := rClient.Subscribe(context.Background(), "policy:invalidate")
			defer pubsub.Close()
			ch := pubsub.Channel()
			for msg := range ch {
				gw.invalidatePolicy(msg.Payload)
			}
		}()
	}

	// 1. Prometheus Telemetry Listener
	go func() {
		metricsMux := http.NewServeMux()
		metricsMux.Handle("/metrics", promhttp.Handler())
		metricsMux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"UP","gateway":"online"}`))
		})

		log.Printf("[GATEWAY METRICS] Exposing Prometheus telemetry on :%s", metricsPort)
		if err := http.ListenAndServe(":"+metricsPort, metricsMux); err != nil {
			log.Printf("[GATEWAY ERROR] Metrics listener error: %v", err)
		}
	}()

	// 2. HTTP CONNECT Proxy Tunnel Server
	proxyServer := &http.Server{
		Addr:         ":" + httpPort,
		Handler:      http.HandlerFunc(gw.handleProxyRequest),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Printf("[GATEWAY READY] High-Throughput Proxy Tunnel listening on :%s", httpPort)
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[GATEWAY FATAL] Proxy listener failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[GATEWAY SHUTDOWN] Draining proxy tunnels...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	gw.accumulator.Stop()
	_ = proxyServer.Shutdown(ctx)
	log.Println("[GATEWAY EXIT] Gateway cleanly stopped.")
}

// =========================================================================
// 5. REQUEST HANDLER PIPELINE (Ordered 1 through 8)
// =========================================================================

func (gw *Gateway) handleProxyRequest(w http.ResponseWriter, r *http.Request) {
	clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}

	// Rate Limiting Guard
	if !gw.rateLimiter.Allow(clientIP) {
		gatewayRateLimitHits.Inc()
		gatewayErrorsTotal.WithLabelValues("rate_limited").Inc()
		gatewayConnectionsTotal.WithLabelValues(r.Method, "rate_limited").Inc()
		gw.reportAbuse("", clientIP, r.Host, "Rate limit exceeded (120 req/min)", "medium")
		http.Error(w, "CloudPulse Edge Rate Limit Exceeded", http.StatusTooManyRequests)
		return
	}

	// 1. Extract Credentials
	username, password := gw.extractCredentials(r)
	if username == "" && password == "" {
		gatewayConnectionsTotal.WithLabelValues(r.Method, "unauthorized").Inc()
		w.Header().Set("Proxy-Authenticate", `Basic realm="CloudPulse Secure Proxy Gateway"`)
		http.Error(w, "Proxy Authentication Required", http.StatusProxyAuthRequired)
		return
	}

	targetHost := r.Host
	targetPort := 80
	if strings.Contains(targetHost, ":") {
		h, p, err := net.SplitHostPort(targetHost)
		if err == nil {
			targetHost = h
			targetPort, _ = strconv.Atoi(p)
		}
	} else if r.Method == http.MethodConnect {
		targetPort = 443
	}

	sessionID := extractSessionID(username)

	// 2 to 7. Resolve Policy & Session (Fast Path Cache vs Cold Path Sync)
	decision, hit := gw.resolveSessionFastPath(r.Context(), sessionID, username, password, clientIP, targetHost, targetPort, r.Method)
	if hit {
		gatewaySessionCacheHits.Inc()
	} else {
		gatewaySessionCacheMisses.Inc()
	}

	if decision == nil || !decision.Allowed {
		gatewayErrorsTotal.WithLabelValues("policy_rejected").Inc()
		gatewayConnectionsTotal.WithLabelValues(r.Method, "policy_rejected").Inc()
		status := http.StatusForbidden
		reason := "Policy Blocked"
		if decision != nil {
			if decision.StatusCode != 0 {
				status = decision.StatusCode
			}
			if decision.Reason != "" {
				reason = decision.Reason
			}
			if status == 401 || status == 403 {
				gw.reportAbuse(decision.UserID, clientIP, targetHost, reason, "high")
			}
		}
		http.Error(w, fmt.Sprintf("CloudPulse Policy Block: %s", reason), status)
		return
	}

	// 6. ATOMIC CONCURRENCY LIMIT ACQUISITION (Item 10)
	if !gw.acquireConcurrencySlot(r.Context(), decision.UserID, 500) {
		gatewayErrorsTotal.WithLabelValues("concurrency_limit").Inc()
		gatewayConnectionsTotal.WithLabelValues(r.Method, "concurrency_limit").Inc()
		http.Error(w, "Concurrency limit exceeded", http.StatusTooManyRequests)
		return
	}
	defer gw.releaseConcurrencySlot(r.Context(), decision.UserID)

	gatewayProviderRequestsTotal.WithLabelValues(decision.UpstreamProvider).Inc()

	// 8. DATA PLANE TUNNELING & ASYNCHRONOUS ACCOUNTING (Item 11)
	if r.Method == http.MethodConnect {
		gw.handleConnectTunnel(w, r, decision)
	} else {
		gw.handleDirectProxy(w, r, decision)
	}
}

// Atomic Concurrency Slot Check & Acquire
func (gw *Gateway) acquireConcurrencySlot(ctx context.Context, userID string, limit int) bool {
	if userID == "" {
		return true
	}

	if gw.redisClient != nil {
		key := fmt.Sprintf("concurrency:%s", userID)
		res, err := acquireSlotScript.Run(ctx, gw.redisClient, []string{key}, limit).Int()
		if err == nil {
			return res == 1
		}
	}

	// Thread-safe in-memory fallback
	gw.sessMu.Lock()
	defer gw.sessMu.Unlock()
	current := gw.inMemThreads[userID]
	if current >= limit {
		return false
	}
	gw.inMemThreads[userID]++
	return true
}

func (gw *Gateway) releaseConcurrencySlot(ctx context.Context, userID string) {
	if userID == "" {
		return
	}

	if gw.redisClient != nil {
		key := fmt.Sprintf("concurrency:%s", userID)
		_ = releaseSlotScript.Run(ctx, gw.redisClient, []string{key}).Err()
	}

	gw.sessMu.Lock()
	if count := gw.inMemThreads[userID]; count > 0 {
		gw.inMemThreads[userID]--
	}
	gw.sessMu.Unlock()
}

func (gw *Gateway) resolveSessionFastPath(ctx context.Context, sessionID, user, pass, clientIP, host string, port int, method string) (*AuthDecision, bool) {
	if sessionID != "" {
		if gw.redisClient != nil {
			redisKey := fmt.Sprintf("session:%s", sessionID)
			val, err := gw.redisClient.Get(ctx, redisKey).Result()
			if err == nil && val != "" {
				var cached AuthDecision
				if json.Unmarshal([]byte(val), &cached) == nil && cached.Allowed {
					return &cached, true
				}
			}
		}

		gw.sessMu.RLock()
		if existing, exists := gw.inMemSessions[sessionID]; exists {
			if time.Now().Before(existing.ExpiresAt) && existing.Allowed {
				gw.sessMu.RUnlock()
				return existing, true
			}
		}
		gw.sessMu.RUnlock()
	}

	credKey := fmt.Sprintf("cred:%s:%s:%s", user, pass, clientIP)
	if cachedDec, exists := gw.policyCache.Get(credKey); exists && !cachedDec.Allowed {
		return cachedDec, true
	}

	// Cold Path Handshake
	decision, err := gw.authorizeWithControlPlane(ctx, user, pass, clientIP, host, port, method)
	if err != nil {
		return nil, false
	}

	gw.policyCache.Set(credKey, decision)

	if decision.Allowed && decision.SessionID != "" {
		decision.ExpiresAt = time.Now().Add(15 * time.Minute)

		if gw.redisClient != nil {
			redisKey := fmt.Sprintf("session:%s", decision.SessionID)
			data, err := json.Marshal(decision)
			if err == nil {
				_ = gw.redisClient.Set(ctx, redisKey, data, 15*time.Minute).Err()
			}
		}

		gw.sessMu.Lock()
		gw.inMemSessions[decision.SessionID] = decision
		gw.sessMu.Unlock()
	}

	return decision, false
}

func (gw *Gateway) invalidatePolicy(target string) {
	gw.policyCache.InvalidateTarget(target)

	gw.sessMu.Lock()
	if target == "" || target == "*" {
		gw.inMemSessions = make(map[string]*AuthDecision)
	} else {
		for id, sess := range gw.inMemSessions {
			if sess.UserID == target || sess.CredentialID == target || id == target {
				delete(gw.inMemSessions, id)
			}
		}
	}
	gw.sessMu.Unlock()
}

func extractSessionID(username string) string {
	if strings.Contains(username, "session-") {
		parts := strings.Split(username, "session-")
		if len(parts) > 1 {
			return strings.Split(parts[1], "-")[0]
		}
	}
	return ""
}

func (gw *Gateway) extractCredentials(r *http.Request) (string, string) {
	authHeader := r.Header.Get("Proxy-Authorization")
	if authHeader == "" {
		authHeader = r.Header.Get("Authorization")
	}
	if authHeader == "" {
		return "", ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "basic") {
		payload, err := base64.StdEncoding.DecodeString(parts[1])
		if err == nil {
			pair := strings.SplitN(string(payload), ":", 2)
			if len(pair) == 2 {
				return pair[0], pair[1]
			}
		}
	}
	return "", ""
}

func (gw *Gateway) authorizeWithControlPlane(ctx context.Context, user, pass, clientIP, host string, port int, method string) (*AuthDecision, error) {
	payload := map[string]interface{}{
		"username":    user,
		"password":    pass,
		"client_ip":   clientIP,
		"target_host": host,
		"target_port": port,
		"protocol":    strings.ToLower(method),
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", gw.controlPlaneURL+"/api/v1/internal/proxy/authorize", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := gw.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Success  bool         `json:"success"`
		Decision AuthDecision `json:"decision"`
		Data     AuthDecision `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Decision.StatusCode != 0 {
		return &result.Decision, nil
	}
	return &result.Data, nil
}

func (gw *Gateway) reportAbuse(userID, clientIP, targetDomain, reason, severity string) {
	go func() {
		payload := map[string]interface{}{
			"user_id":       userID,
			"client_ip":     clientIP,
			"target_domain": targetDomain,
			"reason":        reason,
			"severity":      severity,
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", gw.controlPlaneURL+"/api/v1/internal/proxy/abuse-event", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := gw.httpClient.Do(req)
		if err == nil {
			_ = resp.Body.Close()
		}
	}()
}

func (gw *Gateway) handleConnectTunnel(w http.ResponseWriter, r *http.Request, decision *AuthDecision) {
	dialStart := time.Now()

	destHost := r.Host
	if decision != nil && decision.UpstreamHost != "" && !strings.Contains(decision.UpstreamHost, "cloudpulse.net") {
		destHost = decision.UpstreamHost
	}

	dialer := net.Dialer{Timeout: 10 * time.Second}
	destConn, err := dialer.Dial("tcp", destHost)
	gatewayDialDuration.Observe(time.Since(dialStart).Seconds())

	if err != nil {
		gatewayErrorsTotal.WithLabelValues("dial_error").Inc()
		gatewayConnectionsTotal.WithLabelValues("CONNECT", "dial_error").Inc()
		if decision != nil && decision.UpstreamProvider != "" {
			gatewayProviderFailuresTotal.WithLabelValues(decision.UpstreamProvider).Inc()
		}
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer destConn.Close()

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		gatewayErrorsTotal.WithLabelValues("hijack_unsupported").Inc()
		http.Error(w, "Hijacking not supported", http.StatusInternalServerError)
		return
	}

	clientConn, _, err := hijacker.Hijack()
	if err != nil {
		gatewayErrorsTotal.WithLabelValues("hijack_error").Inc()
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer clientConn.Close()

	_, _ = clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	atomic.AddInt64(&gw.activeCount, 1)
	gatewayActiveTunnels.Inc()
	gatewayConnectionsTotal.WithLabelValues("CONNECT", "success").Inc()
	defer func() {
		atomic.AddInt64(&gw.activeCount, -1)
		gatewayActiveTunnels.Dec()
	}()

	var bytesIn, bytesOut int64
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		n, _ := io.Copy(destConn, clientConn)
		atomic.AddInt64(&bytesIn, n)
		gatewayBytesTransferredTotal.WithLabelValues("inbound").Add(float64(n))
	}()

	go func() {
		defer wg.Done()
		n, _ := io.Copy(clientConn, destConn)
		atomic.AddInt64(&bytesOut, n)
		gatewayBytesTransferredTotal.WithLabelValues("outbound").Add(float64(n))
	}()

	wg.Wait()

	// Non-blocking asynchronous accumulation for batch flush
	if decision != nil {
		gw.accumulator.Record(decision.UserID, decision.CredentialID, bytesIn, bytesOut, r.Host)
	}
}

func (gw *Gateway) handleDirectProxy(w http.ResponseWriter, r *http.Request, decision *AuthDecision) {
	outReq := r.Clone(r.Context())
	outReq.RequestURI = ""

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		DisableCompression: true,
	}

	dialStart := time.Now()
	resp, err := transport.RoundTrip(outReq)
	gatewayDialDuration.Observe(time.Since(dialStart).Seconds())

	if err != nil {
		gatewayErrorsTotal.WithLabelValues("upstream_error").Inc()
		gatewayConnectionsTotal.WithLabelValues(r.Method, "upstream_error").Inc()
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for k, vv := range resp.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(resp.StatusCode)

	n, _ := io.Copy(w, resp.Body)
	gatewayBytesTransferredTotal.WithLabelValues("outbound").Add(float64(n))
	gatewayConnectionsTotal.WithLabelValues(r.Method, "success").Inc()

	if decision != nil {
		gw.accumulator.Record(decision.UserID, decision.CredentialID, 0, n, r.Host)
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
