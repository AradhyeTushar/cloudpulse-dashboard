package example

import (
	"context"
	"testing"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

func TestExampleProviderAdapter(t *testing.T) {
	// Initialize adapter as the common Provider interface
	var provider providers.Provider = NewProvider()
	ctx := context.Background()

	// Verify Metadata
	if provider.Name() == "" {
		t.Errorf("Expected non-empty provider name")
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

	// 1. Request Sticky Proxy Allocation (session=sess_123, country=US)
	req1 := &providers.ProxyRequest{
		Country:        "US",
		Type:           "residential",
		SessionID:      "sess_123",
		RotationPolicy: "sticky",
		DurationMin:    15,
	}

	alloc1, err := provider.GetProxy(ctx, req1)
	if err != nil {
		t.Fatalf("GetProxy failed: %v", err)
	}
	if alloc1.Endpoint == "" {
		t.Errorf("Expected valid gateway endpoint, got empty")
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

	// 3. Request with different session ID should produce different exit IP
	req3 := &providers.ProxyRequest{
		Country:        "US",
		Type:           "residential",
		SessionID:      "sess_999",
		RotationPolicy: "sticky",
	}
	alloc3, err := provider.GetProxy(ctx, req3)
	if err != nil {
		t.Fatalf("Third GetProxy failed: %v", err)
	}
	if alloc3.ExitIP == alloc1.ExitIP {
		t.Logf("Notice: Exit IPs coincided, which is possible but unlikely")
	}

	// 4. Release Proxy
	if err := provider.ReleaseProxy(ctx, alloc1); err != nil {
		t.Errorf("ReleaseProxy returned error: %v", err)
	}
}

func TestProviderRegistry(t *testing.T) {
	registry := providers.NewRegistry()
	p := NewProvider()
	registry.Register(p)

	ctx := context.Background()
	best, err := registry.SelectBestProvider(ctx, "residential")
	if err != nil {
		t.Fatalf("SelectBestProvider failed: %v", err)
	}
	if best.Name() != p.Name() {
		t.Errorf("Expected provider %s, got %s", p.Name(), best.Name())
	}
}
