package server

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/accounting"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/config"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/limits"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/metrics"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/policy"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/upstream"
)

type GatewayServer struct {
	cfg         *config.Config
	rateLimiter *limits.RateLimiter
	concurrency *limits.ConcurrencyTracker
	policyCache *policy.Cache
	sessions    *sessions.SessionManager
	upstream    *upstream.ControlPlaneClient
	accumulator *accounting.UsageAccumulator
}

func NewGatewayServer(
	cfg *config.Config,
	rateLimiter *limits.RateLimiter,
	concurrency *limits.ConcurrencyTracker,
	policyCache *policy.Cache,
	sessionMgr *sessions.SessionManager,
	upstreamClient *upstream.ControlPlaneClient,
	accumulator *accounting.UsageAccumulator,
) *GatewayServer {
	return &GatewayServer{
		cfg:         cfg,
		rateLimiter: rateLimiter,
		concurrency: concurrency,
		policyCache: policyCache,
		sessions:    sessionMgr,
		upstream:    upstreamClient,
		accumulator: accumulator,
	}
}

func (s *GatewayServer) InvalidateTarget(target string) {
	s.policyCache.Invalidate(target)
	s.sessions.Invalidate(target)
}

func (s *GatewayServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}

	// 1. Edge Rate Limiting Protection
	if !s.rateLimiter.Allow(clientIP) {
		metrics.RateLimitHitsTotal.Inc()
		metrics.ConnectionsTotal.WithLabelValues(r.Method, "rate_limited").Inc()
		s.upstream.ReportAbuse("", clientIP, r.Host, "Rate limit exceeded (120 req/min)", "medium")
		http.Error(w, "CloudPulse Edge Rate Limit Exceeded", http.StatusTooManyRequests)
		return
	}

	// 2. Authentication Verification (Never an open proxy)
	creds := auth.ExtractCredentials(r)
	if creds == nil || (creds.Username == "" && creds.Password == "") {
		metrics.AuthFailuresTotal.WithLabelValues("missing_credentials").Inc()
		metrics.ConnectionsTotal.WithLabelValues(r.Method, "unauthorized").Inc()
		w.Header().Set("Proxy-Authenticate", `Basic realm="CloudPulse Authenticated Proxy Gateway"`)
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

	// 3. Resolve Policy & Session (Tier 1 Local Cache -> Tier 2 Session Manager -> Tier 3 Control Plane)
	decision := s.resolvePolicy(r.Context(), creds, clientIP, targetHost, targetPort, r.Method)
	if decision == nil || !decision.Allowed {
		reason := "Authentication or policy check failed"
		status := http.StatusForbidden
		if decision != nil {
			if decision.Reason != "" {
				reason = decision.Reason
			}
			if decision.StatusCode != 0 {
				status = decision.StatusCode
			}
			if status == http.StatusUnauthorized || status == http.StatusProxyAuthRequired {
				metrics.AuthFailuresTotal.WithLabelValues("invalid_credentials").Inc()
				w.Header().Set("Proxy-Authenticate", `Basic realm="CloudPulse Authenticated Proxy Gateway"`)
			} else {
				metrics.AuthFailuresTotal.WithLabelValues("policy_blocked").Inc()
			}
		} else {
			metrics.AuthFailuresTotal.WithLabelValues("upstream_unreachable").Inc()
		}

		metrics.ConnectionsTotal.WithLabelValues(r.Method, "rejected").Inc()
		s.upstream.ReportAbuse(creds.Username, clientIP, targetHost, reason, "high")
		http.Error(w, fmt.Sprintf("CloudPulse Proxy Rejected: %s", reason), status)
		return
	}

	// 4. Atomic Concurrency Enforcement (Lua Script)
	limit := decision.ThreadsLimit
	if limit <= 0 {
		limit = s.cfg.MaxConcurrency
	}

	if !s.concurrency.Acquire(r.Context(), decision.UserID, limit) {
		metrics.ConnectionsTotal.WithLabelValues(r.Method, "concurrency_limit").Inc()
		http.Error(w, "Plan Concurrency Limit Exceeded", http.StatusTooManyRequests)
		return
	}
	defer s.concurrency.Release(r.Context(), decision.UserID)

	metrics.ProviderRequestsTotal.WithLabelValues(decision.UpstreamProvider).Inc()

	// 5. Data Plane Proxy Tunneling
	startTime := time.Now()
	if r.Method == http.MethodConnect {
		s.handleConnectTunnel(w, r, decision)
	} else {
		s.handleDirectProxy(w, r, decision)
	}
	metrics.ConnectionDuration.WithLabelValues(r.Method).Observe(time.Since(startTime).Seconds())
}

func (s *GatewayServer) resolvePolicy(ctx context.Context, creds *auth.ProxyCredentials, clientIP, host string, port int, method string) *policy.Decision {
	// Fast Path 1: Check Session Manager if session ID is present
	if creds.SessionID != "" {
		if dec, hit := s.sessions.GetSession(ctx, creds.SessionID); hit {
			return dec
		}
	}

	// Fast Path 2: Check Local Negative / Positive Policy Cache
	credKey := fmt.Sprintf("cred:%s:%s:%s", creds.Username, creds.Password, clientIP)
	if dec, hit := s.policyCache.Get(credKey); hit && !dec.Allowed {
		return dec
	}

	// Cold Path: Authorize with Control Plane
	targetCountry := creds.Country
	dec, err := s.upstream.Authorize(ctx, &upstream.AuthRequest{
		Username:      creds.Username,
		Password:      creds.Password,
		ClientIP:      clientIP,
		TargetHost:    host,
		TargetPort:    port,
		TargetCountry: targetCountry,
		Protocol:      strings.ToLower(method),
	})
	if err != nil {
		return nil
	}

	s.policyCache.Set(credKey, dec)

	if dec.Allowed && dec.SessionID != "" {
		s.sessions.SaveSession(ctx, dec.SessionID, dec, 15*time.Minute)
	}

	return dec
}

func (s *GatewayServer) handleConnectTunnel(w http.ResponseWriter, r *http.Request, decision *policy.Decision) {
	destHost := r.Host
	if decision != nil && decision.UpstreamHost != "" && !strings.Contains(decision.UpstreamHost, "cloudpulse.net") {
		destHost = decision.UpstreamHost
	}

	dialer := net.Dialer{Timeout: s.cfg.DialTimeout}
	destConn, err := dialer.Dial("tcp", destHost)
	if err != nil {
		metrics.ConnectionsTotal.WithLabelValues("CONNECT", "dial_error").Inc()
		if decision != nil && decision.UpstreamProvider != "" {
			metrics.ProviderFailuresTotal.WithLabelValues(decision.UpstreamProvider).Inc()
		}
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer destConn.Close()

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "Hijacking unsupported", http.StatusInternalServerError)
		return
	}

	clientConn, _, err := hijacker.Hijack()
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer clientConn.Close()

	_, _ = clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	metrics.ActiveConnections.Inc()
	metrics.ConnectionsTotal.WithLabelValues("CONNECT", "success").Inc()
	defer metrics.ActiveConnections.Dec()

	var bytesIn, bytesOut int64
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		n, _ := io.Copy(destConn, clientConn)
		bytesIn += n
		metrics.BytesTransferredTotal.WithLabelValues("inbound").Add(float64(n))
	}()

	go func() {
		defer wg.Done()
		n, _ := io.Copy(clientConn, destConn)
		bytesOut += n
		metrics.BytesTransferredTotal.WithLabelValues("outbound").Add(float64(n))
	}()

	wg.Wait()

	if decision != nil {
		s.accumulator.Record(decision.UserID, decision.CredentialID, bytesIn, bytesOut, r.Host)
	}
}

func (s *GatewayServer) handleDirectProxy(w http.ResponseWriter, r *http.Request, decision *policy.Decision) {
	outReq := r.Clone(r.Context())
	outReq.RequestURI = ""

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   s.cfg.DialTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        100,
		IdleConnTimeout:     s.cfg.IdleTimeout,
		DisableCompression: true,
	}

	resp, err := transport.RoundTrip(outReq)
	if err != nil {
		metrics.ConnectionsTotal.WithLabelValues(r.Method, "upstream_error").Inc()
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
	metrics.BytesTransferredTotal.WithLabelValues("outbound").Add(float64(n))
	metrics.ConnectionsTotal.WithLabelValues(r.Method, "success").Inc()

	if decision != nil {
		s.accumulator.Record(decision.UserID, decision.CredentialID, 0, n, r.Host)
	}
}
