package providers

import (
	"context"
	"errors"
	"sync"
	"time"
)

var (
	ErrNoProviderAvailable = errors.New("no upstream provider available matching criteria")
	ErrProviderNotFound    = errors.New("requested provider not found")
)

// ProxyRequest contains requirements for allocating an upstream proxy node
type ProxyRequest struct {
	Country        string `json:"country"`
	State          string `json:"state,omitempty"`
	City           string `json:"city,omitempty"`
	Type           string `json:"type"` // residential, datacenter, mobile
	SessionID      string `json:"session_id,omitempty"`
	RotationPolicy string `json:"rotation_policy"` // sticky, rotating
	DurationMin    int    `json:"duration_min,omitempty"`
}

// ProxyAllocation represents a concrete upstream proxy connection allocated by a provider
type ProxyAllocation struct {
	Provider       string    `json:"provider"`
	ExitIP         string    `json:"exit_ip"`
	Host           string    `json:"host"`
	Port           int       `json:"port"`
	Username       string    `json:"username"`
	Password       string    `json:"password"`
	Country        string    `json:"country"`
	LatencyMs      int       `json:"latency_ms"`
	ExpiresAt      time.Time `json:"expires_at"`
}

// Provider is the common interface that all upstream proxy suppliers must implement
type Provider interface {
	Name() string
	Type() string // residential, datacenter, mobile
	GetProxy(ctx context.Context, req *ProxyRequest) (*ProxyAllocation, error)
	ReleaseProxy(ctx context.Context, allocation *ProxyAllocation) error
	HealthCheck(ctx context.Context) (bool, int, error) // isHealthy, latencyMs, error
}

// Registry manages and routes between multiple upstream providers
type Registry struct {
	mu        sync.RWMutex
	providers map[string]Provider
}

func NewRegistry() *Registry {
	return &Registry{
		providers: make(map[string]Provider),
	}
}

func (r *Registry) Register(p Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Name()] = p
}

func (r *Registry) GetProvider(name string) (Provider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, exists := r.providers[name]
	if !exists {
		return nil, ErrProviderNotFound
	}
	return p, nil
}

func (r *Registry) ListProviders() []Provider {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Provider
	for _, p := range r.providers {
		list = append(list, p)
	}
	return list
}

// SelectBestProvider selects the lowest latency healthy provider matching the proxy type
func (r *Registry) SelectBestProvider(ctx context.Context, proxyType string) (Provider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var bestProvider Provider
	lowestLatency := 999999

	for _, p := range r.providers {
		if proxyType != "" && p.Type() != proxyType {
			continue
		}

		healthy, latency, err := p.HealthCheck(ctx)
		if err == nil && healthy {
			if latency < lowestLatency {
				lowestLatency = latency
				bestProvider = p
			}
		}
	}

	if bestProvider == nil {
		// Fallback to any provider if none matched type
		for _, p := range r.providers {
			return p, nil
		}
		return nil, ErrNoProviderAvailable
	}

	return bestProvider, nil
}
