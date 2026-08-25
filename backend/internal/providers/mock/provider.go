package mock

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strconv"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

// MockProvider is a pure test double for integration testing the gateway flow
// without contacting any real residential network or generating fake internet traffic.
type MockProvider struct {
	name    string
	pType   string
	healthy bool
	latency int
}

func NewMockProvider(name string) *MockProvider {
	if name == "" {
		name = "mock-residential-grid"
	}
	return &MockProvider{
		name:    name,
		pType:   "residential",
		healthy: true,
		latency: 15,
	}
}

func (m *MockProvider) Name() string {
	return m.name
}

func (m *MockProvider) Type() string {
	return m.pType
}

func (m *MockProvider) SetHealthy(healthy bool) {
	m.healthy = healthy
}

func (m *MockProvider) GetProxy(ctx context.Context, req *providers.ProxyRequest) (*providers.ProxyAllocation, error) {
	if !m.healthy {
		return nil, fmt.Errorf("mock provider %s is currently unavailable", m.name)
	}

	country := req.Country
	if country == "" {
		country = "US"
	}

	// Deterministically calculate exit IP for testing assertions
	var exitIP string
	if req.Rotation == providers.RotationSticky && req.SessionID != "" {
		hash := md5.Sum([]byte(fmt.Sprintf("%s-%s-%s", req.SessionID, country, m.name)))
		hashHex := hex.EncodeToString(hash[:])
		b1, _ := strconv.ParseInt(hashHex[0:2], 16, 64)
		b2, _ := strconv.ParseInt(hashHex[2:4], 16, 64)
		exitIP = fmt.Sprintf("198.51.%d.%d", (b1%200)+20, (b2%240)+10)
	} else {
		exitIP = fmt.Sprintf("203.0.113.%d", (time.Now().UnixNano()%220)+10)
	}

	return &providers.ProxyAllocation{
		ProviderName: m.name,
		Host:         "127.0.0.1",
		Port:         8080,
		Username:     "mock_user_" + country,
		Password:     "mock_pass_secret",
		Country:      country,
		ExitIP:       exitIP,
		ExpiresAt:    time.Now().Add(15 * time.Minute),
	}, nil
}

func (m *MockProvider) ReleaseProxy(ctx context.Context, alloc *providers.ProxyAllocation) error {
	return nil
}

func (m *MockProvider) HealthCheck(ctx context.Context) (bool, int, error) {
	if !m.healthy {
		return false, 0, fmt.Errorf("mock provider unhealthy")
	}
	return true, m.latency, nil
}
