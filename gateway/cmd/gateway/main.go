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
	"sync/atomic"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

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
		[]string{"direction"},
	)

	activeTunnels = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "cloudpulse_gateway_active_tunnels",
			Help: "Current active proxy connections",
		},
	)
)

type Gateway struct {
	httpPort        string
	metricsPort     string
	controlPlaneURL string
	activeCount     int64
	httpClient      *http.Client
}

type AuthDecision struct {
	Allowed          bool   `json:"allowed"`
	StatusCode       int    `json:"status_code"`
	Reason           string `json:"reason"`
	UserID           string `json:"user_id"`
	SessionID        string `json:"session_id"`
	AssignedExitIP   string `json:"assigned_exit_ip"`
	UpstreamProvider string `json:"upstream_provider"`
	UpstreamHost     string `json:"upstream_host"`
}

func main() {
	log.Println("[GATEWAY BOOT] Starting CloudPulse High-Throughput Proxy Gateway...")

	httpPort := getEnv("GATEWAY_HTTP_PORT", "8000")
	metricsPort := getEnv("GATEWAY_METRICS_PORT", "9100")
	controlPlaneURL := getEnv("CONTROL_PLANE_URL", "http://localhost:8080")

	gw := &Gateway{
		httpPort:        httpPort,
		metricsPort:     metricsPort,
		controlPlaneURL: controlPlaneURL,
		httpClient: &http.Client{
			Timeout: 3 * time.Second,
		},
	}

	// 1. Start Prometheus Metrics Listener
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

	// 2. Start HTTP CONNECT Proxy Tunnel Server
	proxyServer := &http.Server{
		Addr:         ":" + httpPort,
		Handler:      http.HandlerFunc(gw.handleProxyRequest),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Printf("[GATEWAY READY] HTTP/HTTPS Proxy Tunnel listening on :%s (Connected to Control Plane %s)", httpPort, controlPlaneURL)
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

func (gw *Gateway) handleProxyRequest(w http.ResponseWriter, r *http.Request) {
	// Parse credentials from Proxy-Authorization or Authorization
	username, password := gw.extractCredentials(r)
	if username == "" && password == "" {
		proxyRequestsTotal.WithLabelValues(r.Method, "unauthorized").Inc()
		w.Header().Set("Proxy-Authenticate", `Basic realm="CloudPulse Secure Proxy Gateway"`)
		http.Error(w, "Proxy Authentication Required", http.StatusProxyAuthRequired)
		return
	}

	clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	if clientIP == "" {
		clientIP = r.RemoteAddr
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

	// -------------------------------------------------------------------------
	// Handshake with Control Plane Engine
	// -------------------------------------------------------------------------
	decision, err := gw.authorizeWithControlPlane(r.Context(), username, password, clientIP, targetHost, targetPort, r.Method)
	if err != nil {
		log.Printf("[CONTROL PLANE WARNING] Handshake error: %v (falling back to direct transit)", err)
	} else if !decision.Allowed {
		proxyRequestsTotal.WithLabelValues(r.Method, "policy_rejected").Inc()
		status := decision.StatusCode
		if status == 0 {
			status = http.StatusForbidden
		}
		http.Error(w, fmt.Sprintf("CloudPulse Policy Block: %s", decision.Reason), status)
		return
	}

	if decision != nil && decision.UserID != "" {
		defer gw.releaseConnection(decision.UserID)
	}

	if r.Method == http.MethodConnect {
		gw.handleConnectTunnel(w, r, decision)
	} else {
		gw.handleDirectProxy(w, r, decision)
	}
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

func (gw *Gateway) handleConnectTunnel(w http.ResponseWriter, r *http.Request, decision *AuthDecision) {
	destConn, err := net.DialTimeout("tcp", r.Host, 10*time.Second)
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

	// Send 200 Connection Established to client
	_, _ = clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	atomic.AddInt64(&gw.activeCount, 1)
	activeTunnels.Inc()
	defer func() {
		atomic.AddInt64(&gw.activeCount, -1)
		activeTunnels.Dec()
	}()

	proxyRequestsTotal.WithLabelValues("CONNECT", "success").Inc()

	// Bi-directional tunnel stream with byte accounting
	done := make(chan struct{}, 2)

	go func() {
		n, _ := io.Copy(destConn, clientConn)
		proxyBytesTransferred.WithLabelValues("inbound").Add(float64(n))
		done <- struct{}{}
	}()

	go func() {
		n, _ := io.Copy(clientConn, destConn)
		proxyBytesTransferred.WithLabelValues("outbound").Add(float64(n))
		done <- struct{}{}
	}()

	<-done
}

func (gw *Gateway) handleDirectProxy(w http.ResponseWriter, r *http.Request, decision *AuthDecision) {
	outReq := r.Clone(r.Context())
	outReq.RequestURI = ""

	transport := &http.Transport{
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		DisableCompression: true,
	}

	resp, err := transport.RoundTrip(outReq)
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
	n, _ := io.Copy(w, resp.Body)
	proxyBytesTransferred.WithLabelValues("outbound").Add(float64(n))
	proxyRequestsTotal.WithLabelValues(r.Method, "success").Inc()
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
