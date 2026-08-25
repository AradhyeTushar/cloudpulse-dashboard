package example

import (
	"context"
	"testing"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

func TestExampleProviderAdapter(t *testing.T) {
	var provider providers.Provider = NewProvider("provider-a")
	ctx := context.Background()

	// Verify Metadata
	if provider.Name() != "provider-a" {
		t.Errorf("Expected provider name provider-a, got %s", provider.Name())
	}
	if provider.Type() != "residential" {
		t.Errorf("Expected type residential, got %s", provider.Type())
	}

	// Health Check
	healthy, latency, err := provider.HealthCheck(ctx)
	if err != nil || !healthy {
		t.Fatalf("Expected healthy provider, got error: %v", err)
	}
	if latency <= 0 {
		t.Errorf("Expected positive latency, got %d", latency)
	}

	// 1. Request Sticky Proxy Allocation
	req1 := &providers.ProxyRequest{
		Country:   "US",
		SessionID: "sess_123",
		Rotation:  providers.RotationSticky,
	}

	alloc1, err := provider.GetProxy(ctx, req1)
	if err != nil {
		t.Fatalf("GetProxy failed: %v", err)
	}
	if alloc1.Host == "" || alloc1.Port == 0 {
		t.Errorf("Expected valid gateway host and port, got %s:%d", alloc1.Host, alloc1.Port)
	}
	if alloc1.Country != "US" {
		t.Errorf("Expected country US, got %s", alloc1.Country)
	}

	// 2. Request again with identical session=sess_123 should produce identical sticky Exit IP
	alloc2, err := provider.GetProxy(ctx, req1)
	if err != nil {
		t.Fatalf("Second GetProxy failed: %v", err)
	}
	if alloc2.ExitIP != alloc1.ExitIP {
		t.Errorf("Expected sticky exit IP consistency: got %s vs %s", alloc2.ExitIP, alloc1.ExitIP)
	}

	// 3. Release Proxy
	if err := provider.ReleaseProxy(ctx, alloc1); err != nil {
		t.Errorf("ReleaseProxy returned error: %v", err)
	}
}

func TestProviderRegistryDynamicRouting(t *testing.T) {
	registry := providers.NewRegistry()
	pA := NewProvider("provider-a")
	pB := NewProvider("provider-b")
	registry.Register(pA)
	registry.Register(pB)

	ctx := context.Background()
	req := &providers.ProxyRequest{
		Country:   "US",
		SessionID: "sess_primary_test",
		Rotation:  providers.RotationSticky,
	}

	alloc, provider, err := registry.AllocateProxy(ctx, req)
	if err != nil {
		t.Fatalf("AllocateProxy failed: %v", err)
	}
	if provider.Name() != "provider-a" {
		t.Errorf("Expected primary provider provider-a, got %s", provider.Name())
	}
	if alloc.ExitIP == "" {
		t.Errorf("Expected assigned exit IP")
	}
}
