package providers

import (
	"context"
	"errors"
	"os"
	"sync"
	"time"
)

var (
	ErrNoProviderAvailable = errors.New("no upstream provider available matching criteria")
	ErrProviderNotFound    = errors.New("requested provider not found")
)

type RotationMode string

const (
	RotationSticky   RotationMode = "sticky"
	RotationRotating RotationMode = "rotating"
)

// ProxyRequest contains explicit requirements for allocating an upstream proxy node
type ProxyRequest struct {
	Country   string       `json:"country"`
	SessionID string       `json:"session_id"`
	Rotation  RotationMode `json:"rotation"`
}

// ProxyAllocation represents internal upstream provider runtime allocation attributes.
// IMPORTANT: ProxyAllocation is strictly internal and must never be serialized into customer API responses.
type ProxyAllocation struct {
	ProviderName string    `json:"-"`
	Host         string    `json:"-"`
	Port         int       `json:"-"`
	Username     string    `json:"-"`
	Password     string    `json:"-"`
	Country      string    `json:"-"`
	ExitIP       string    `json:"-"`
	ExpiresAt    time.Time `json:"-"`
}

// Provider is the common interface that all upstream proxy suppliers must implement
type Provider interface {
	Name() string
	Type() string // residential, datacenter, mobile
	GetProxy(ctx context.Context, req *ProxyRequest) (*ProxyAllocation, error)
	ReleaseProxy(ctx context.Context, alloc *ProxyAllocation) error
	HealthCheck(ctx context.Context) (bool, int, error) // isHealthy, latencyMs, error
}

// Registry manages dynamic routing and failover across multiple configured providers
type Registry struct {
	mu               sync.RWMutex
	providers        map[string]Provider
	primaryProvider  string
	fallbackProvider string
}

func NewRegistry() *Registry {
	primary := getEnv("PROVIDER_PRIMARY", "provider-a")
	fallback := getEnv("PROVIDER_FALLBACK", "provider-b")

	return &Registry{
		providers:        make(map[string]Provider),
		primaryProvider:  primary,
		fallbackProvider: fallback,
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

// AllocateProxy routes the request to PRIMARY provider, failing over to FALLBACK provider if needed
func (r *Registry) AllocateProxy(ctx context.Context, req *ProxyRequest) (*ProxyAllocation, Provider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// 1. Try Primary Provider
	if p, exists := r.providers[r.primaryProvider]; exists {
		healthy, _, _ := p.HealthCheck(ctx)
		if healthy {
			alloc, err := p.GetProxy(ctx, req)
			if err == nil {
				return alloc, p, nil
			}
		}
	}

	// 2. Try Fallback Provider
	if fb, exists := r.providers[r.fallbackProvider]; exists {
		healthy, _, _ := fb.HealthCheck(ctx)
		if healthy {
			alloc, err := fb.GetProxy(ctx, req)
			if err == nil {
				return alloc, fb, nil
			}
		}
	}

	// 3. Try any available registered provider
	for _, p := range r.providers {
		healthy, _, _ := p.HealthCheck(ctx)
		if healthy {
			alloc, err := p.GetProxy(ctx, req)
			if err == nil {
				return alloc, p, nil
			}
		}
	}

	return nil, nil, ErrNoProviderAvailable
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
