package controlplane

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
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
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/providers/residential"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/sessions"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ControlPlaneService struct {
	userRepo         users.Repository
	credRepo         credentials.Repository
	plansService     *plans.Service
	sessionService   *sessions.Service
	providerRegistry *providers.Registry
	pool             *pgxpool.Pool

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
	// Register dynamic providers (authorized residential, primary and fallback)
	registry.Register(residential.NewProvider())
	registry.Register(example.NewProvider("provider-a"))
	registry.Register(example.NewProvider("provider-b"))

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

	// Find matching credential (with support for username tagging: cp_1638ac43-session-xyz or cp_1638ac43-country-in)
	var matchedCred *credentials.ProxyCredential
	var extractedSession string
	var extractedCountry string

	// Direct match first
	for _, c := range allCreds {
		if c.Username == req.Username {
			matchedCred = c
			break
		}
	}

	// Tagged match (e.g. cp_1638ac43-session-abc or cp_1638ac43-country-us)
	if matchedCred == nil {
		for _, c := range allCreds {
			if strings.HasPrefix(req.Username, c.Username+"-") || strings.HasPrefix(req.Username, c.Username+"_") {
				matchedCred = c
				remainder := req.Username[len(c.Username)+1:]
				tokens := strings.Split(remainder, "-")
				for i := 0; i < len(tokens); i++ {
					t := strings.ToLower(tokens[i])
					if (t == "session" || t == "sess") && i+1 < len(tokens) {
						extractedSession = tokens[i+1]
						i++
					} else if (t == "country" || t == "zone") && i+1 < len(tokens) {
						extractedCountry = strings.ToUpper(tokens[i+1])
						i++
					}
				}
				break
			}
		}
	}

	if matchedCred == nil {
		decision.Allowed = false
		decision.StatusCode = 401
		decision.Reason = "Invalid proxy username"
		return decision, nil
	}

	// Constant-time password validation
	valid := false
	if matchedCred.PlainPassword != "" {
		if subtle.ConstantTimeCompare([]byte(matchedCred.PlainPassword), []byte(req.Password)) == 1 {
			valid = true
		}
	}
	if !valid && matchedCred.PasswordHash != "" {
		match, err := auth.VerifyPassword(req.Password, matchedCred.PasswordHash)
		if err == nil && match {
			valid = true
		}
	}

	if !valid {
		decision.Allowed = false
		decision.StatusCode = 401
		decision.Reason = "Invalid proxy credentials"
		return decision, nil
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
	if extractedCountry != "" {
		countryMap := map[string]string{
			"US": "United States",
			"USA": "United States",
			"DE": "Germany",
			"IN": "India",
			"GB": "United Kingdom",
			"UK": "United Kingdom",
			"FR": "France",
			"JP": "Japan",
			"SG": "Singapore",
			"CA": "Canada",
			"AU": "Australia",
			"BR": "Brazil",
		}
		if mapped, ok := countryMap[extractedCountry]; ok {
			targetCountry = mapped
		} else {
			targetCountry = extractedCountry
		}
	} else if targetCountry == "" {
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
	// 7 & 8. PROVIDER ALLOCATION & SESSION SYNCHRONIZATION
	// -------------------------------------------------------------------------
	sessionID := req.TargetHost
	rotMode := providers.RotationSticky
	if extractedSession != "" {
		sessionID = fmt.Sprintf("sess_%s_%s", user.ID[:6], extractedSession)
	} else if matchedCred.RotationMode == "rotating" {
		rotMode = providers.RotationRotating
		sessionID = fmt.Sprintf("rot_%s", generateRandomHex(6))
	} else if !strings.HasPrefix(sessionID, "sess_") {
		sessionID = fmt.Sprintf("sess_%s_%s", user.ID[:6], generateRandomHex(4))
	}

	// Request proxy allocation from the provider registry (with primary/fallback routing)
	alloc, provider, err := s.providerRegistry.AllocateProxy(ctx, &providers.ProxyRequest{
		Country:   targetCountry,
		SessionID: sessionID,
		Rotation:  rotMode,
	})
	if err != nil {
		decision.Allowed = false
		decision.StatusCode = 502
		decision.Reason = "Failed to allocate upstream proxy: " + err.Error()
		return decision, nil
	}

	// Register / Sync Customer Session in Redis/DB (decoupled from internal exit IP)
	custSess, _, _ := s.sessionService.GetOrCreateSession(ctx, sessions.GetOrCreateSessionParams{
		SessionID:         sessionID,
		UserID:            user.ID,
		CredentialID:      matchedCred.ID,
		Country:           targetCountry,
		RotationMode:      matchedCred.RotationMode,
		ProviderID:        provider.Name(),
		ProviderSessionID: fmt.Sprintf("psess_%s", generateRandomHex(6)),
		DurationMin:       matchedCred.SessionDurationMin,
	})

	decision.Allowed = true
	decision.StatusCode = 200
	decision.SessionID = custSess.ID
	decision.AssignedExitIP = alloc.ExitIP
	decision.UpstreamProvider = alloc.ProviderName
	decision.UpstreamHost = fmt.Sprintf("%s:%d", alloc.Host, alloc.Port)

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

func (s *ControlPlaneService) SetPool(pool *pgxpool.Pool) {
	s.pool = pool
}

// RecordTelemetry stores bandwidth consumption records
func (s *ControlPlaneService) RecordTelemetry(ctx context.Context, userID, credentialID string, bytesIn, bytesOut int64, targetDomain string) error {
	if s.pool != nil {
		id := "usg_" + uuid.New().String()[:12]
		var credID *string
		if credentialID != "" {
			credID = &credentialID
		}
		query := `
			INSERT INTO proxy_usage (id, user_id, credential_id, bytes_in, bytes_out, requests_count, target_domain, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`
		_, err := s.pool.Exec(ctx, query, id, userID, credID, bytesIn, bytesOut, 1, targetDomain, time.Now())
		return err
	}
	return nil
}

// RecordAbuseEvent stores rate limit and compliance violations
func (s *ControlPlaneService) RecordAbuseEvent(ctx context.Context, userID, clientIP, targetDomain, reason, severity string) error {
	if s.pool != nil {
		id := "abz_" + uuid.New().String()[:12]
		var uID *string
		if userID != "" {
			uID = &userID
		}
		if severity == "" {
			severity = "medium"
		}
		query := `
			INSERT INTO abuse_events (id, user_id, client_ip, target_domain, reason, severity, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`
		_, err := s.pool.Exec(ctx, query, id, uID, clientIP, targetDomain, reason, severity, time.Now())
		return err
	}
	return nil
}

func generateRandomHex(n int) string {
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
