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
// PROMETHEUS METRICS (Data Plane & Fast-Path Telemetry)
// =========================================================================

var (
	proxyRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_requests_total",
			Help: "Total proxy tunnel requests processed by CloudPulse Gateway",
		},
		[]string{"protocol", "status"},
	)

	proxyBytesTransferred = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_bytes_transferred_total",
			Help: "Total bytes transferred through proxy gateway",
		},
		[]string{"direction", "user_id"},
	)

	activeTunnels = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "cloudpulse_gateway_active_tunnels",
			Help: "Current active proxy connections",
		},
	)

	sessionCacheHits = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_session_cache_hits_total",
			Help: "Total fast-path session cache hits (bypassing Control Plane HTTP roundtrip)",
		},
	)

	sessionCacheMisses = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_session_cache_misses_total",
			Help: "Total session cache misses (requiring Control Plane allocation)",
		},
	)

	dialLatency = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "cloudpulse_gateway_dial_duration_seconds",
			Help:    "Upstream connection dial latency in seconds",
			Buckets: prometheus.DefBuckets,
		},
	)

	rateLimitHits = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_rate_limit_hits_total",
			Help: "Total rate limit rejections at gateway edge",
		},
	)
)

// =========================================================================
// DATA STRUCTURES
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

// Local Policy Cache to avoid redundant Control Plane roundtrips
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

func (c *PolicyCache) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries = make(map[string]*cachedPolicy)
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
	redisClient     *redis.Client
	inMemSessions   map[string]*AuthDecision
	sessMu          sync.RWMutex
}

func main() {
	log.Println("[GATEWAY BOOT] Starting CloudPulse High-Throughput Proxy Gateway with Fast-Path Session Manager...")

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
			log.Printf("[REDIS INFO] Running with in-memory session fast path (Redis not reachable: %v)", err)
			rClient = nil
		} else {
			log.Println("[REDIS CONNECTED] Direct Redis Session Fast-Path active")
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
		policyCache:   NewPolicyCache(30 * time.Second), // 30s local policy cache
		redisClient:   rClient,
		inMemSessions: make(map[string]*AuthDecision),
	}

	// 0. Start Real-Time Redis Pub/Sub Policy Invalidation Listener
	if rClient != nil {
		go func() {
			pubsub := rClient.Subscribe(context.Background(), "policy:invalidate")
			defer pubsub.Close()
			ch := pubsub.Channel()
			log.Println("[GATEWAY PUBSUB] Subscribed to real-time 'policy:invalidate' channel")
			for msg := range ch {
				log.Printf("[POLICY INVALIDATION] Evicting cached policy for target: %s", msg.Payload)
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
			_, _ = w.Write([]byte(`{"status":"UP","gateway":"online","fast_path":true}`))
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
	_ = proxyServer.Shutdown(ctx)
	log.Println("[GATEWAY EXIT] Gateway cleanly stopped.")
}

// =========================================================================
// REQUEST HANDLER PIPELINE (FAST-PATH SESSION MANAGER)
// =========================================================================

func (gw *Gateway) handleProxyRequest(w http.ResponseWriter, r *http.Request) {
	clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}

	// Step 1: Edge Rate Limiting
	if !gw.rateLimiter.Allow(clientIP) {
		rateLimitHits.Inc()
		proxyRequestsTotal.WithLabelValues(r.Method, "rate_limited").Inc()
		gw.reportAbuse("", clientIP, r.Host, "Rate limit exceeded (120 req/min)", "medium")
		http.Error(w, "CloudPulse Edge Rate Limit Exceeded", http.StatusTooManyRequests)
		return
	}

	// Step 2: Extract Basic Credentials & Session Parameters
	username, password := gw.extractCredentials(r)
	if username == "" && password == "" {
		proxyRequestsTotal.WithLabelValues(r.Method, "unauthorized").Inc()
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

	// Parse optional session ID or country embedded in username (e.g. "usr-country-US-session-abc123")
	sessionID := extractSessionID(username)

	// Step 3 & 4: Fast-Path Session Check (Redis / In-Memory Session Manager)
	decision, hit := gw.resolveSessionFastPath(r.Context(), sessionID, username, password, clientIP, targetHost, targetPort, r.Method)
	if hit {
		sessionCacheHits.Inc()
	} else {
		sessionCacheMisses.Inc()
	}

	if decision == nil || !decision.Allowed {
		proxyRequestsTotal.WithLabelValues(r.Method, "policy_rejected").Inc()
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

	// Active Concurrency Accounting
	if decision.UserID != "" {
		defer gw.releaseConnection(decision.UserID)
	}

	// Step 5: Data Plane Tunneling (Direct Transit to Upstream Provider)
	if r.Method == http.MethodConnect {
		gw.handleConnectTunnel(w, r, decision)
	} else {
		gw.handleDirectProxy(w, r, decision)
	}
}

// resolveSessionFastPath checks:
// 1. Existing Session in Redis / Local Memory (Fast Path -> Reuse immediately <0.5ms!)
// 2. Cold Path -> Calls Control Plane, caches policy & session, returns allocation
func (gw *Gateway) resolveSessionFastPath(ctx context.Context, sessionID, user, pass, clientIP, host string, port int, method string) (*AuthDecision, bool) {
	// 1. FAST PATH: Check Session Manager (Redis / In-Memory)
	if sessionID != "" {
		// Check Redis
		if gw.redisClient != nil {
			redisKey := fmt.Sprintf("session:%s", sessionID)
			val, err := gw.redisClient.Get(ctx, redisKey).Result()
			if err == nil && val != "" {
				var cached AuthDecision
				if json.Unmarshal([]byte(val), &cached) == nil && cached.Allowed {
					return &cached, true // Fast Path Reused!
				}
			}
		}

		// Check In-Memory Fast Cache
		gw.sessMu.RLock()
		if existing, exists := gw.inMemSessions[sessionID]; exists {
			if time.Now().Before(existing.ExpiresAt) && existing.Allowed {
				gw.sessMu.RUnlock()
				return existing, true // Fast Path Reused!
			}
		}
		gw.sessMu.RUnlock()
	}

	// 2. Check Local Policy Cache for this Credential (30s cache)
	credKey := fmt.Sprintf("cred:%s:%s:%s", user, pass, clientIP)
	if cachedDec, exists := gw.policyCache.Get(credKey); exists && !cachedDec.Allowed {
		return cachedDec, true // Fast Path Negative Policy Rejection!
	}

	// 3. COLD PATH: Handshake with Control Plane Engine
	decision, err := gw.authorizeWithControlPlane(ctx, user, pass, clientIP, host, port, method)
	if err != nil {
		log.Printf("[CONTROL PLANE WARNING] Handshake error: %v", err)
		return nil, false
	}

	// Cache Credential Policy
	gw.policyCache.Set(credKey, decision)

	// Save to Session Manager (Redis & In-Memory)
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

func (gw *Gateway) releaseConnection(userID string) {
	payload := map[string]string{"user_id": userID}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", gw.controlPlaneURL+"/api/v1/internal/proxy/release", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := gw.httpClient.Do(req)
	if err == nil {
		_ = resp.Body.Close()
	}
}

func (gw *Gateway) reportTelemetry(userID, credID string, bytesIn, bytesOut int64, domain string) {
	go func() {
		payload := map[string]interface{}{
			"user_id":       userID,
			"credential_id": credID,
			"bytes_in":      bytesIn,
			"bytes_out":     bytesOut,
			"target_domain": domain,
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", gw.controlPlaneURL+"/api/v1/internal/proxy/telemetry", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := gw.httpClient.Do(req)
		if err == nil {
			_ = resp.Body.Close()
		}
	}()
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
	dialLatency.Observe(time.Since(dialStart).Seconds())

	if err != nil {
		proxyRequestsTotal.WithLabelValues("CONNECT", "dial_error").Inc()
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer destConn.Close()

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		proxyRequestsTotal.WithLabelValues("CONNECT", "hijack_unsupported").Inc()
		http.Error(w, "Hijacking not supported", http.StatusInternalServerError)
		return
	}

	clientConn, _, err := hijacker.Hijack()
	if err != nil {
		proxyRequestsTotal.WithLabelValues("CONNECT", "hijack_error").Inc()
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer clientConn.Close()

	_, _ = clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	atomic.AddInt64(&gw.activeCount, 1)
	activeTunnels.Inc()
	defer func() {
		atomic.AddInt64(&gw.activeCount, -1)
		activeTunnels.Dec()
	}()

	proxyRequestsTotal.WithLabelValues("CONNECT", "success").Inc()

	var bytesIn, bytesOut int64
	var wg sync.WaitGroup
	wg.Add(2)

	userID := "anonymous"
	credID := ""
	if decision != nil && decision.UserID != "" {
		userID = decision.UserID
		credID = decision.CredentialID
	}

	go func() {
		defer wg.Done()
		n, _ := io.Copy(destConn, clientConn)
		atomic.AddInt64(&bytesIn, n)
		proxyBytesTransferred.WithLabelValues("inbound", userID).Add(float64(n))
	}()

	go func() {
		defer wg.Done()
		n, _ := io.Copy(clientConn, destConn)
		atomic.AddInt64(&bytesOut, n)
		proxyBytesTransferred.WithLabelValues("outbound", userID).Add(float64(n))
	}()

	wg.Wait()
	gw.reportTelemetry(userID, credID, bytesIn, bytesOut, r.Host)
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
	dialLatency.Observe(time.Since(dialStart).Seconds())

	if err != nil {
		proxyRequestsTotal.WithLabelValues(r.Method, "upstream_error").Inc()
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

	userID := "anonymous"
	credID := ""
	if decision != nil && decision.UserID != "" {
		userID = decision.UserID
		credID = decision.CredentialID
	}

	n, _ := io.Copy(w, resp.Body)
	proxyBytesTransferred.WithLabelValues("outbound", userID).Add(float64(n))
	proxyRequestsTotal.WithLabelValues(r.Method, "success").Inc()

	gw.reportTelemetry(userID, credID, 0, n, r.Host)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
