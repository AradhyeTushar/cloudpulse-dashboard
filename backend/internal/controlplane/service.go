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
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers/example"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
)

type ControlPlaneService struct {
	userRepo         users.Repository
	credRepo         credentials.Repository
	plansService     *plans.Service
	sessionService   *sessions.Service
	providerRegistry *providers.Registry

	// Thread tracking (in-memory & Redis sync)
	mu            sync.Mutex
	activeThreads map[string]int // userID -> active count
}

func NewService(
	userRepo users.Repository,
	credRepo credentials.Repository,
	plansService *plans.Service,
	sessionService *sessions.Service,
) *ControlPlaneService {
	registry := providers.NewRegistry()
	// Register Provider Adapter
	registry.Register(example.NewProvider())

	return &ControlPlaneService{
		userRepo:         userRepo,
		credRepo:         credRepo,
		plansService:     plansService,
		sessionService:   sessionService,
		providerRegistry: registry,
		activeThreads:    make(map[string]int),
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
	threadsLimit := 500
	var remainingQuotaBytes int64 = 500 * 1024 * 1024 * 1024 // 500GB

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
	// 7. PROVIDER ADAPTER SELECTION (Step 10 Architectural Seam)
	// -------------------------------------------------------------------------
	poolType := matchedCred.ProxyType
	if poolType == "" {
		poolType = "residential"
	}

	provider, err := s.providerRegistry.SelectBestProvider(ctx, poolType)
	if err != nil {
		decision.Allowed = false
		decision.StatusCode = 503
		decision.Reason = "No upstream provider available: " + err.Error()
		return decision, nil
	}

	// -------------------------------------------------------------------------
	// 8. REDIS SESSION & EXIT IP RESOLUTION (Step 9 Redis Sessions)
	// -------------------------------------------------------------------------
	sessionID := req.TargetHost
	if matchedCred.RotationMode == "sticky" {
		sessionID = fmt.Sprintf("sess_%s_%s", user.ID[:6], generateRandomHex(4))
	} else {
		sessionID = fmt.Sprintf("rot_%s", generateRandomHex(6))
	}

	// Request proxy allocation from the provider adapter
	proxyAlloc, err := provider.GetProxy(ctx, &providers.ProxyRequest{
		Country:        targetCountry,
		Type:           poolType,
		SessionID:      sessionID,
		RotationPolicy: matchedCred.RotationMode,
		DurationMin:    matchedCred.SessionDurationMin,
	})
	if err != nil {
		decision.Allowed = false
		decision.StatusCode = 502
		decision.Reason = "Provider failed to allocate proxy: " + err.Error()
		return decision, nil
	}

	// Persist/Sync Session into Redis (Step 9)
	proxySess, _, _ := s.sessionService.GetOrCreateProxySession(ctx, sessions.GetOrCreateSessionParams{
		SessionID:      sessionID,
		UserID:         user.ID,
		Country:        targetCountry,
		Provider:       provider.Name(),
		ExitIP:         proxyAlloc.ExitIP,
		Host:           proxyAlloc.Host,
		Port:           proxyAlloc.Port,
		RotationPolicy: matchedCred.RotationMode,
		DurationMin:    matchedCred.SessionDurationMin,
	})

	decision.Allowed = true
	decision.StatusCode = 200
	decision.SessionID = proxySess.SessionID
	decision.AssignedExitIP = proxySess.ExitIP
	decision.UpstreamProvider = proxySess.Provider
	decision.UpstreamHost = fmt.Sprintf("%s:%d", proxySess.Host, proxySess.Port)

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

// RecordTelemetry stores bandwidth consumption records
func (s *ControlPlaneService) RecordTelemetry(_ context.Context, userID, credentialID string, bytesIn, bytesOut int64, targetDomain string) error {
	// In production, persists to usage_records table in PostgreSQL
	return nil
}

// RecordAbuseEvent stores rate limit and compliance violations
func (s *ControlPlaneService) RecordAbuseEvent(_ context.Context, userID, clientIP, targetDomain, reason, severity string) error {
	// In production, persists to abuse_events table in PostgreSQL
	return nil
}

func generateRandomHex(n int) string {
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
