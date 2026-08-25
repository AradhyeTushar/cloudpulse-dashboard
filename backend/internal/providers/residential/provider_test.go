package residential

import (
	"context"
	"os"
	"testing"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

func TestResidentialProviderAdapter(t *testing.T) {
	os.Setenv("RESIDENTIAL_PROVIDER_NAME", "residential-auth-1")
	os.Setenv("RESIDENTIAL_PROVIDER_GATEWAY_HOST", "pr.cloudpulse.net")
	os.Setenv("RESIDENTIAL_PROVIDER_GATEWAY_PORT", "8000")
	os.Setenv("RESIDENTIAL_PROVIDER_USERNAME", "customer_auth_user")
	os.Setenv("RESIDENTIAL_PROVIDER_PASSWORD", "secret_pass_123")

	p := NewProvider()
	ctx := context.Background()

	t.Run("HealthCheck", func(t *testing.T) {
		healthy, latency, err := p.HealthCheck(ctx)
		if !healthy || err != nil {
			t.Fatalf("Expected provider healthy, got err: %v", err)
		}
		if latency < 0 {
			t.Errorf("Expected non-negative latency, got %d", latency)
		}
	})

	t.Run("Sticky Session Allocation (US)", func(t *testing.T) {
		req := &providers.ProxyRequest{
			Country:   "US",
			SessionID: "sess_sticky_001",
			Rotation:  providers.RotationSticky,
		}

		alloc1, err := p.GetProxy(ctx, req)
		if err != nil {
			t.Fatalf("GetProxy failed: %v", err)
		}
		if alloc1.Country != "US" {
			t.Errorf("Expected country US, got %s", alloc1.Country)
		}
		if alloc1.ExitIP == "" {
			t.Errorf("Expected non-empty exit IP")
		}

		// Ensure second call with same sticky session returns the same Exit IP
		alloc2, err := p.GetProxy(ctx, req)
		if err != nil {
			t.Fatalf("Second GetProxy failed: %v", err)
		}
		if alloc1.ExitIP != alloc2.ExitIP {
			t.Errorf("Sticky session violation: Expected %s, got %s", alloc1.ExitIP, alloc2.ExitIP)
		}
	})

	t.Run("Rotating Session Allocation (DE)", func(t *testing.T) {
		req := &providers.ProxyRequest{
			Country:   "DE",
			SessionID: "sess_rot_001",
			Rotation:  providers.RotationRotating,
		}

		alloc, err := p.GetProxy(ctx, req)
		if err != nil {
			t.Fatalf("GetProxy failed: %v", err)
		}
		if alloc.Country != "DE" {
			t.Errorf("Expected country DE, got %s", alloc.Country)
		}
	})
}
