package sessions

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	ErrSessionNotFound = errors.New("proxy session not found or expired")
)

type Service struct {
	redisClient   *redis.Client
	mu            sync.RWMutex
	proxySessions map[string]*ProxySession
	userSessions  map[string]*Session
}

func NewService(rClient *redis.Client) *Service {
	return &Service{
		redisClient:   rClient,
		proxySessions: make(map[string]*ProxySession),
		userSessions:  make(map[string]*Session),
	}
}

// =========================================================================
// PROXY SESSIONS (Redis Session Store: session:<sessionID>)
// =========================================================================

type GetOrCreateSessionParams struct {
	SessionID      string
	UserID         string
	Country        string
	Provider       string
	ExitIP         string
	Host           string
	Port           int
	RotationPolicy string // sticky, rotating
	DurationMin    int
}

// GetOrCreateProxySession fetches an existing active sticky session or creates a new one in Redis
func (s *Service) GetOrCreateProxySession(ctx context.Context, params GetOrCreateSessionParams) (*ProxySession, bool, error) {
	if params.SessionID == "" {
		params.SessionID = "sess_" + uuid.New().String()[:10]
	}
	if params.DurationMin <= 0 {
		params.DurationMin = 15
	}
	if params.RotationPolicy == "" {
		params.RotationPolicy = "sticky"
	}

	redisKey := fmt.Sprintf("session:%s", params.SessionID)

	// 1. Check Redis if exists (Sticky check)
	if s.redisClient != nil && params.RotationPolicy == "sticky" {
		val, err := s.redisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			var existing ProxySession
			if err := json.Unmarshal([]byte(val), &existing); err == nil {
				// Verify user ownership
				if existing.UserID == params.UserID || params.UserID == "" {
					return &existing, false, nil // Existing session resumed!
				}
			}
		}
	}

	// Check In-Memory fallback if sticky
	if params.RotationPolicy == "sticky" {
		s.mu.RLock()
		if existing, exists := s.proxySessions[params.SessionID]; exists {
			if existing.ExpiresAt.After(time.Now()) && (existing.UserID == params.UserID || params.UserID == "") {
				s.mu.RUnlock()
				return existing, false, nil // Existing session resumed!
			}
		}
		s.mu.RUnlock()
	}

	// 2. Create new session
	now := time.Now()
	expiresAt := now.Add(time.Duration(params.DurationMin) * time.Minute)

	session := &ProxySession{
		SessionID:      params.SessionID,
		UserID:         params.UserID,
		Country:        params.Country,
		Provider:       params.Provider,
		ExitIP:         params.ExitIP,
		Host:           params.Host,
		Port:           params.Port,
		RotationPolicy: params.RotationPolicy,
		DurationMin:    params.DurationMin,
		CreatedAt:      now,
		ExpiresAt:      expiresAt,
	}

	// Store in Redis with TTL
	ttl := time.Duration(params.DurationMin) * time.Minute
	if params.RotationPolicy == "rotating" {
		ttl = 30 * time.Second // Short TTL for rotating sessions
	}

	if s.redisClient != nil {
		data, err := json.Marshal(session)
		if err == nil {
			_ = s.redisClient.Set(ctx, redisKey, data, ttl).Err()
			// Index user session for listing
			userKey := fmt.Sprintf("user_sessions:%s:%s", params.UserID, params.SessionID)
			_ = s.redisClient.Set(ctx, userKey, params.SessionID, ttl).Err()
		}
	}

	// Store in memory
	s.mu.Lock()
	s.proxySessions[session.SessionID] = session
	s.mu.Unlock()

	return session, true, nil // New session created!
}

func (s *Service) GetProxySession(ctx context.Context, sessionID string) (*ProxySession, error) {
	redisKey := fmt.Sprintf("session:%s", sessionID)

	if s.redisClient != nil {
		val, err := s.redisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			var sess ProxySession
			if err := json.Unmarshal([]byte(val), &sess); err == nil {
				return &sess, nil
			}
		}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	if sess, exists := s.proxySessions[sessionID]; exists {
		if sess.ExpiresAt.After(time.Now()) {
			return sess, nil
		}
	}
	return nil, ErrSessionNotFound
}

func (s *Service) RotateProxySession(ctx context.Context, sessionID, newExitIP string) (*ProxySession, error) {
	sess, err := s.GetProxySession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	sess.ExitIP = newExitIP
	now := time.Now()
	sess.ExpiresAt = now.Add(time.Duration(sess.DurationMin) * time.Minute)

	redisKey := fmt.Sprintf("session:%s", sessionID)
	ttl := time.Duration(sess.DurationMin) * time.Minute

	if s.redisClient != nil {
		data, _ := json.Marshal(sess)
		_ = s.redisClient.Set(ctx, redisKey, data, ttl).Err()
	}

	s.mu.Lock()
	s.proxySessions[sessionID] = sess
	s.mu.Unlock()

	return sess, nil
}

func (s *Service) RevokeProxySession(ctx context.Context, sessionID string) error {
	redisKey := fmt.Sprintf("session:%s", sessionID)
	if s.redisClient != nil {
		_ = s.redisClient.Del(ctx, redisKey).Err()
	}

	s.mu.Lock()
	delete(s.proxySessions, sessionID)
	s.mu.Unlock()

	return nil
}

func (s *Service) ListUserProxySessions(ctx context.Context, userID string) ([]*ProxySession, error) {
	var list []*ProxySession

	if s.redisClient != nil {
		pattern := fmt.Sprintf("user_sessions:%s:*", userID)
		keys, err := s.redisClient.Keys(ctx, pattern).Result()
		if err == nil {
			for _, k := range keys {
				sessID, err := s.redisClient.Get(ctx, k).Result()
				if err == nil && sessID != "" {
					if sess, err := s.GetProxySession(ctx, sessID); err == nil {
						list = append(list, sess)
					}
				}
			}
		}
	}

	if len(list) == 0 {
		s.mu.RLock()
		now := time.Now()
		for _, sess := range s.proxySessions {
			if (sess.UserID == userID || userID == "") && sess.ExpiresAt.After(now) {
				list = append(list, sess)
			}
		}
		s.mu.RUnlock()
	}

	return list, nil
}

// =========================================================================
// USER WEB SESSIONS (For User Profile View)
// =========================================================================

func (s *Service) CreateSession(ctx context.Context, userID, device, browser, location, ip string) (*Session, error) {
	session := &Session{
		ID:           "sess_" + uuid.New().String()[:12],
		UserID:       userID,
		Device:       device,
		Browser:      browser,
		Location:     location,
		IPAddress:    ip,
		LastActiveAt: time.Now(),
		CreatedAt:    time.Now(),
		IsCurrent:    true,
	}

	s.mu.Lock()
	s.userSessions[session.ID] = session
	s.mu.Unlock()

	return session, nil
}

func (s *Service) ListUserSessions(ctx context.Context, userID string, currentSessionID string) ([]*Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var sessions []*Session
	for _, sess := range s.userSessions {
		if sess.UserID == userID {
			sessCopy := *sess
			sessCopy.IsCurrent = sess.ID == currentSessionID
			sessions = append(sessions, &sessCopy)
		}
	}
	return sessions, nil
}

func (s *Service) RevokeSession(ctx context.Context, userID, sessionID string) error {
	s.mu.Lock()
	delete(s.userSessions, sessionID)
	s.mu.Unlock()
	return nil
}
