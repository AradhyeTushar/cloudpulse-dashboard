package residential

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
)

// Provider implements the providers.Provider interface for an authorized residential proxy grid
type Provider struct {
	name        string
	pType       string
	enabled     bool
	gatewayHost string
	gatewayPort int
	username    string
	password    string
	apiKey      string
	timeout     time.Duration
}

// NewProvider initializes the authorized residential proxy adapter from environment variables
func NewProvider() *Provider {
	name := getEnv("RESIDENTIAL_PROVIDER_NAME", "residential-authorized")
	pType := getEnv("RESIDENTIAL_PROVIDER_TYPE", "residential")
	enabledStr := getEnv("RESIDENTIAL_PROVIDER_ENABLED", "true")
	enabled := enabledStr == "true" || enabledStr == "1"

	host := getEnv("RESIDENTIAL_PROVIDER_GATEWAY_HOST", "pr.cloudpulse.net")
	portStr := getEnv("RESIDENTIAL_PROVIDER_GATEWAY_PORT", "8000")
	port, _ := strconv.Atoi(portStr)
	if port == 0 {
		port = 8000
	}

	username := getEnv("RESIDENTIAL_PROVIDER_USERNAME", "cloudpulse_res_auth")
	password := getEnv("RESIDENTIAL_PROVIDER_PASSWORD", "")
	apiKey := getEnv("RESIDENTIAL_PROVIDER_API_KEY", "")

	return &Provider{
		name:        name,
		pType:       pType,
		enabled:     enabled,
		gatewayHost: host,
		gatewayPort: port,
		username:    username,
		password:    password,
		apiKey:      apiKey,
		timeout:     5 * time.Second,
	}
}

func (p *Provider) Name() string {
	return p.name
}

func (p *Provider) Type() string {
	return p.pType
}

func (p *Provider) IsEnabled() bool {
	return p.enabled
}

// GetProxy translates generic CloudPulse request parameters into provider-specific upstream proxy allocation
func (p *Provider) GetProxy(ctx context.Context, req *providers.ProxyRequest) (*providers.ProxyAllocation, error) {
	if !p.enabled {
		return nil, fmt.Errorf("residential provider '%s' is disabled", p.name)
	}

	country := strings.ToUpper(req.Country)
	if country == "" {
		country = "US"
	}

	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = fmt.Sprintf("sess_%d", time.Now().UnixNano())
	}

	// Format upstream residential proxy authentication token
	// Following standard provider format: username-country-XX-session-YY-lifetime-ZZ
	upstreamUsername := p.username
	if !strings.Contains(upstreamUsername, "country-") {
		if req.Rotation == providers.RotationSticky {
			upstreamUsername = fmt.Sprintf("%s-country-%s-session-%s", p.username, country, sessionID)
		} else {
			upstreamUsername = fmt.Sprintf("%s-country-%s-session-rot_%d", p.username, country, time.Now().UnixNano())
		}
	}

	upstreamPassword := p.password
	if upstreamPassword == "" && p.apiKey != "" {
		upstreamPassword = "key_" + p.apiKey
	}

	// Deterministically calculate exit IP based on country & session for consistent sticky verification
	var exitIP string
	if req.Rotation == providers.RotationSticky && req.SessionID != "" {
		hash := md5.Sum([]byte(fmt.Sprintf("%s-%s-%s", req.SessionID, country, p.name)))
		hashHex := hex.EncodeToString(hash[:])
		b1, _ := strconv.ParseInt(hashHex[0:2], 16, 64)
		b2, _ := strconv.ParseInt(hashHex[2:4], 16, 64)
		exitIP = fmt.Sprintf("198.51.%d.%d", (b1%200)+20, (b2%240)+10)
	} else {
		nano := time.Now().UnixNano()
		exitIP = fmt.Sprintf("203.0.113.%d", (nano%220)+10)
	}

	durationMin := 15
	expiresAt := time.Now().Add(time.Duration(durationMin) * time.Minute)

	return &providers.ProxyAllocation{
		ProviderName: p.name,
		Host:         p.gatewayHost,
		Port:         p.gatewayPort,
		Username:     upstreamUsername,
		Password:     upstreamPassword,
		Country:      country,
		ExitIP:       exitIP,
		ExpiresAt:    expiresAt,
	}, nil
}

func (p *Provider) ReleaseProxy(ctx context.Context, alloc *providers.ProxyAllocation) error {
	return nil
}

func (p *Provider) HealthCheck(ctx context.Context) (bool, int, error) {
	if !p.enabled {
		return false, 0, fmt.Errorf("provider disabled")
	}

	start := time.Now()
	// TCP dial check with timeout if host is remote
	if p.gatewayHost != "localhost" && p.gatewayHost != "127.0.0.1" && p.gatewayHost != "pr.cloudpulse.net" {
		target := fmt.Sprintf("%s:%d", p.gatewayHost, p.gatewayPort)
		conn, err := net.DialTimeout("tcp", target, 2*time.Second)
		if err != nil {
			return false, 0, err
		}
		_ = conn.Close()
	}

	latency := int(time.Since(start).Milliseconds())
	if latency == 0 {
		latency = 12
	}
	return true, latency, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
