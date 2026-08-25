package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	ActiveConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "cloudpulse_gateway_active_connections",
			Help: "Current active proxy tunnel connections",
		},
	)

	ConnectionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_connections_total",
			Help: "Total proxy connection requests processed by CloudPulse Gateway",
		},
		[]string{"protocol", "status"},
	)

	BytesTransferredTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_bytes_transferred_total",
			Help: "Total bytes transferred through proxy tunnels",
		},
		[]string{"direction"}, // inbound / outbound
	)

	AuthFailuresTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_auth_failures_total",
			Help: "Total authentication and credential validation rejections",
		},
		[]string{"reason"},
	)

	RateLimitHitsTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_rate_limit_hits_total",
			Help: "Total requests throttled by edge rate limiting",
		},
	)

	ProviderRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_provider_requests_total",
			Help: "Total upstream proxy allocations requested per provider",
		},
		[]string{"provider"},
	)

	ProviderFailuresTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cloudpulse_gateway_provider_failures_total",
			Help: "Total upstream proxy allocation failures per provider",
		},
		[]string{"provider"},
	)

	ConnectionDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "cloudpulse_gateway_connection_duration_seconds",
			Help:    "Duration of completed proxy tunnel connections in seconds",
			Buckets: []float64{0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300},
		},
		[]string{"protocol"},
	)
)
