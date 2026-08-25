package example

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

type ExampleProvider struct {
	name        string
	pType       string
	apiKey      string
	gatewayHost string
	gatewayPort int
}

// NewProvider initializes the provider adapter using environment variables
func NewProvider() *ExampleProvider {
	name := getEnv("EXAMPLE_PROVIDER_NAME", "ExampleResidentialGrid")
	pType := getEnv("EXAMPLE_PROVIDER_TYPE", "residential")
	apiKey := getEnv("EXAMPLE_PROVIDER_API_KEY", "ep_key_live_default_demo_98a")
	host := getEnv("EXAMPLE_PROVIDER_GATEWAY_HOST", "egress.example-provider.net")
	portStr := getEnv("EXAMPLE_PROVIDER_GATEWAY_PORT", "8080")
	port, _ := strconv.Atoi(portStr)
	if port == 0 {
		port = 8080
	}

	return &ExampleProvider{
		name:        name,
		pType:       pType,
		apiKey:      apiKey,
		gatewayHost: host,
		gatewayPort: port,
	}
}

func (p *ExampleProvider) Name() string {
	return p.name
}

func (p *ExampleProvider) Type() string {
	return p.pType
}

// GetProxy allocates an upstream proxy based on requested country and session policy
func (p *ExampleProvider) GetProxy(ctx context.Context, req *providers.ProxyRequest) (*providers.ProxyAllocation, error) {
	country := req.Country
	if country == "" {
		country = "US"
	}

	durationMin := req.DurationMin
	if durationMin <= 0 {
		durationMin = 15
	}

	// Deterministically calculate exit IP based on country & session ID (or random for rotating)
	var exitIP string
	if req.RotationPolicy == "sticky" && req.SessionID != "" {
		hash := md5.Sum([]byte(fmt.Sprintf("%s-%s-%s", req.SessionID, country, p.name)))
		hashHex := hex.EncodeToString(hash[:])
		b1, _ := strconv.ParseInt(hashHex[0:2], 16, 64)
		b2, _ := strconv.ParseInt(hashHex[2:4], 16, 64)
		exitIP = fmt.Sprintf("198.51.%d.%d", (b1%200)+20, (b2%240)+10)
	} else {
		nano := time.Now().UnixNano()
		exitIP = fmt.Sprintf("203.0.113.%d", (nano%220)+10)
	}

	// Upstream authentication credentials formatted for the provider
	username := fmt.Sprintf("customer-%s-country-%s-session-%s", p.apiKey[:8], country, req.SessionID)
	password := "auth_" + p.apiKey

	return &providers.ProxyAllocation{
		Provider:  p.name,
		ExitIP:    exitIP,
		Host:      p.gatewayHost,
		Port:      p.gatewayPort,
		Username:  username,
		Password:  password,
		Country:   country,
		LatencyMs: 18,
		ExpiresAt: time.Now().Add(time.Duration(durationMin) * time.Minute),
	}, nil
}

func (p *ExampleProvider) ReleaseProxy(ctx context.Context, allocation *providers.ProxyAllocation) error {
	// In production, notify upstream provider of connection termination
	return nil
}

func (p *ExampleProvider) HealthCheck(ctx context.Context) (bool, int, error) {
	// Provider ping check
	return true, 18, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
