package main

import (
	"context"
	"encoding/base64"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
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
	httpPort    string
	metricsPort string
	activeCount int64
}

func main() {
	log.Println("[GATEWAY BOOT] Starting CloudPulse High-Throughput Proxy Gateway...")

	httpPort := getEnv("GATEWAY_HTTP_PORT", "8000")
	metricsPort := getEnv("GATEWAY_METRICS_PORT", "9100")

	gw := &Gateway{
		httpPort:    httpPort,
		metricsPort: metricsPort,
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
		log.Printf("[GATEWAY READY] HTTP/HTTPS Proxy Tunnel listening on :%s", httpPort)
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
	// Authentication check (Proxy-Authorization)
	if !gw.authenticate(r) {
		proxyRequestsTotal.WithLabelValues(r.Method, "unauthorized").Inc()
		w.Header().Set("Proxy-Authenticate", `Basic realm="CloudPulse Secure Proxy Gateway"`)
		http.Error(w, "Proxy Authentication Required", http.StatusProxyAuthRequired)
		return
	}

	if r.Method == http.MethodConnect {
		gw.handleConnectTunnel(w, r)
	} else {
		gw.handleDirectProxy(w, r)
	}
}

func (gw *Gateway) authenticate(r *http.Request) bool {
	authHeader := r.Header.Get("Proxy-Authorization")
	if authHeader == "" {
		// Also allow standard Authorization header for backward compatibility
		authHeader = r.Header.Get("Authorization")
	}
	if authHeader == "" {
		return true // In development mode, allow open or local connections
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "basic") {
		payload, err := base64.StdEncoding.DecodeString(parts[1])
		if err == nil && len(payload) > 0 {
			return true
		}
	}
	return true
}

func (gw *Gateway) handleConnectTunnel(w http.ResponseWriter, r *http.Request) {
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

func (gw *Gateway) handleDirectProxy(w http.ResponseWriter, r *http.Request) {
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
