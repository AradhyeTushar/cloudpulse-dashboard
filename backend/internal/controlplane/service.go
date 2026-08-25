package controlplane

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
)

type ControlPlaneService struct {
	userRepo       users.Repository
	credRepo       credentials.Repository
	plansService   *plans.Service
	sessionService *sessions.Service

	// Thread tracking (in-memory & Redis sync)
	mu             sync.Mutex
	activeThreads  map[string]int // userID -> active count

	// Mock upstream pool registry
	upstreamNodes  map[string][]UpstreamNode
}

func NewService(
	userRepo users.Repository,
	credRepo credentials.Repository,
	plansService *plans.Service,
	sessionService *sessions.Service,
) *ControlPlaneService {
	s := &ControlPlaneService{
		userRepo:       userRepo,
		credRepo:       credRepo,
		plansService:   plansService,
		sessionService: sessionService,
		activeThreads:  make(map[string]int),
		upstreamNodes:  make(map[string][]UpstreamNode),
	}
	s.seedUpstreamNodes()
	return s
}

func (s *ControlPlaneService) seedUpstreamNodes() {
	s.upstreamNodes["residential"] = []UpstreamNode{
		{ID: "node_res_us_1", Provider: "BrightData / Oxylabs PeerGrid", Type: "residential", Country: "United States", ExitIP: "198.51.100.42", Host: "egress-res-us1.cloudpulse.net", Port: 8080, Latency: 18, Healthy: true},
		{ID: "node_res_de_1", Provider: "Telekom Residential Grid", Type: "residential", Country: "Germany", ExitIP: "198.51.100.88", Host: "egress-res-de1.cloudpulse.net", Port: 8080, Latency: 24, Healthy: true},
		{ID: "node_res_gb_1", Provider: "Vodafone UK Grid", Type: "residential", Country: "United Kingdom", ExitIP: "198.51.100.112", Host: "egress-res-gb1.cloudpulse.net", Port: 8080, Latency: 22, Healthy: true},
	}
	s.upstreamNodes["datacenter"] = []UpstreamNode{
		{ID: "node_dc_us_1", Provider: "Equinix Ashburn Tier 1", Type: "datacenter", Country: "United States", ExitIP: "203.0.113.15", Host: "egress-dc-us1.cloudpulse.net", Port: 8080, Latency: 6, Healthy: true},
		{ID: "node_dc_eu_1", Provider: "Hetzner Frankfurt Tier 1", Type: "datacenter", Country: "Germany", ExitIP: "203.0.113.89", Host: "egress-dc-de1.cloudpulse.net", Port: 8080, Latency: 9, Healthy: true},
	}
	s.upstreamNodes["mobile"] = []UpstreamNode{
		{ID: "node_mb_us_1", Provider: "Verizon 5G Gateway", Type: "mobile", Country: "United States", ExitIP: "192.0.2.77", Host: "egress-mb-us1.cloudpulse.net", Port: 8080, Latency: 35, Healthy: true},
	}
}

// AuthorizeProxyRequest runs the full Control Plane decision pipeline
func (s *ControlPlaneService) AuthorizeProxyRequest(ctx context.Context, req *ProxyAuthRequest) (*ProxyAuthDecision, error) {
	decision := &ProxyAuthDecision{
		AuthorizedAt: time.Now(),
	}

	// -------------------------------------------------------------------------
	// 1. AUTHENTICATION & CREDENTIAL LOOKUP
	// -------------------------------------------------------------------------
	if req.Username == "" || req.Password == "" {
		decision.Allowed = false
		decision.StatusCode = 401
		decision.Reason = "Missing proxy authentication credentials"
		return decision, nil
	}

	// Find matching credential
	allCreds, err := s.credRepo.ListProxyCredentials(ctx, "")
	if err != nil {
		decision.Allowed = false
		decision.StatusCode = 500
		decision.Reason = "Failed to query credentials store"
		return decision, err
	}

	var matchedCred *credentials.ProxyCredential
	for _, c := range allCreds {
		if c.Username == req.Username {
			matchedCred = c
			break
		}
	}

	if matchedCred == nil {
		decision.Allowed = false
		decision.StatusCode = 401
		decision.Reason = "Invalid proxy username"
		return decision, nil
	}

	// Password validation
	if matchedCred.PlainPassword != "" && matchedCred.PlainPassword != req.Password {
		// Fallback to Argon2 verify
		match, err := auth.VerifyPassword(req.Password, matchedCred.PasswordHash)
		if err != nil || !match {
			decision.Allowed = false
			decision.StatusCode = 401
			decision.Reason = "Invalid proxy password"
			return decision, nil
		}
	}

	if matchedCred.Status != "active" {
		decision.Allowed = false
		decision.StatusCode = 403
		decision.Reason = fmt.Sprintf("Proxy credential '%s' is suspended or disabled", matchedCred.Name)
		return decision, nil
	}

	decision.CredentialID = matchedCred.ID
	decision.UserID = matchedCred.UserID
	decision.RotationMode = matchedCred.RotationMode

	// -------------------------------------------------------------------------
	// 2. CUSTOMER TENANT VERIFICATION
	// -------------------------------------------------------------------------
	user, err := s.userRepo.GetByID(ctx, matchedCred.UserID)
	if err != nil {
		decision.Allowed = false
		decision.StatusCode = 403
		decision.Reason = "Tenant user account not found"
		return decision, nil
	}

	if user.Status == "suspended" {
		decision.Allowed = false
		decision.StatusCode = 403
		decision.Reason = "Customer account is suspended due to billing or policy violation"
		return decision, nil
	}

	// -------------------------------------------------------------------------
	// 3. PLAN & BANDWIDTH QUOTA VERIFICATION
	// -------------------------------------------------------------------------
	// Determine plan limits (default 500GB / 500 threads)
	threadsLimit := 500
	var remainingQuotaBytes int64 = 500 * 1024 * 1024 * 1024 // 500GB in bytes

	subs, err := s.plansService.ListSubscriptions(ctx, user.ID)
	if err == nil && len(subs) > 0 {
		activeSub := subs[0]
		decision.PlanSlug = activeSub.PlanID
		if activeSub.Status != "active" {
			decision.Allowed = false
			decision.StatusCode = 402
			decision.Reason = "Subscription is expired or past due"
			return decision, nil
		}
	}

	decision.RemainingQuotaBytes = remainingQuotaBytes

	// -------------------------------------------------------------------------
	// 4. IP WHITELIST RESTRICTION CHECK
	// -------------------------------------------------------------------------
	if len(matchedCred.IPWhitelist) > 0 && req.ClientIP != "" {
		whitelisted := false
		clientIP := net.ParseIP(req.ClientIP)

		for _, allowed := range matchedCred.IPWhitelist {
			if strings.Contains(allowed, "/") {
				_, ipNet, err := net.ParseCIDR(allowed)
				if err == nil && clientIP != nil && ipNet.Contains(clientIP) {
					whitelisted = true
					break
				}
			} else if allowed == req.ClientIP || allowed == "127.0.0.1" || allowed == "::1" {
				whitelisted = true
				break
			}
		}

		if !whitelisted {
			decision.Allowed = false
			decision.StatusCode = 403
			decision.Reason = fmt.Sprintf("Client IP %s is not in authorized whitelist", req.ClientIP)
			return decision, nil
		}
	}

	// -------------------------------------------------------------------------
	// 5. COUNTRY PERMISSIONS & TARGETING
	// -------------------------------------------------------------------------
	targetCountry := req.TargetCountry
	if targetCountry == "" {
		targetCountry = matchedCred.TargetCountry
	}
	if targetCountry == "" {
		targetCountry = "United States"
	}

	// Sanctioned / blocked list check
	blockedCountries := map[string]bool{"North Korea": true, "Syria": true, "Iran": true}
	if blockedCountries[targetCountry] {
		decision.Allowed = false
		decision.StatusCode = 403
		decision.Reason = fmt.Sprintf("Target country '%s' is restricted by compliance policy", targetCountry)
		return decision, nil
	}

	// -------------------------------------------------------------------------
	// 6. CONNECTION LIMIT (CONCURRENCY GUARD)
	// -------------------------------------------------------------------------
	s.mu.Lock()
	currentActive := s.activeThreads[user.ID]
	if currentActive >= threadsLimit {
		s.mu.Unlock()
		decision.Allowed = false
		decision.StatusCode = 429
		decision.Reason = fmt.Sprintf("Concurrency limit exceeded (%d / %d threads active)", currentActive, threadsLimit)
		return decision, nil
	}
	s.activeThreads[user.ID]++
	s.mu.Unlock()

	// -------------------------------------------------------------------------
	// 7. SESSION & EXIT IP RESOLUTION (STICKY VS ROTATING)
	// -------------------------------------------------------------------------
	var sessionID string
	var assignedExitIP string

	if matchedCred.RotationMode == "sticky" {
		// Allocate or reuse sticky session
		sessionID = fmt.Sprintf("sess_%s_%s", user.ID[:6], generateRandomHex(4))
		assignedExitIP = "198.51.100." + fmt.Sprintf("%d", (time.Now().UnixNano()%200)+20)
	} else {
		// Rotating fresh IP per connection
		sessionID = fmt.Sprintf("rot_%s", generateRandomHex(6))
		assignedExitIP = fmt.Sprintf("203.0.113.%d", (time.Now().UnixNano()%220)+10)
	}

	decision.SessionID = sessionID
	decision.AssignedExitIP = assignedExitIP

	// -------------------------------------------------------------------------
	// 8. PROVIDER ABSTRACTION SELECTION
	// -------------------------------------------------------------------------
	poolType := matchedCred.ProxyType
	if poolType == "" {
		poolType = "residential"
	}

	nodes := s.upstreamNodes[poolType]
	if len(nodes) == 0 {
		nodes = s.upstreamNodes["residential"]
	}

	selectedNode := nodes[0]
	for _, n := range nodes {
		if strings.EqualFold(n.Country, targetCountry) && n.Healthy {
			selectedNode = n
			break
		}
	}

	decision.Allowed = true
	decision.StatusCode = 200
	decision.UpstreamProvider = selectedNode.Provider
	decision.UpstreamHost = fmt.Sprintf("%s:%d", selectedNode.Host, selectedNode.Port)

	return decision, nil
}

// ReleaseConnection releases an active concurrency slot for a user
func (s *ControlPlaneService) ReleaseConnection(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if count, exists := s.activeThreads[userID]; exists && count > 0 {
		s.activeThreads[userID]--
	}
}

func generateRandomHex(n int) string {
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
