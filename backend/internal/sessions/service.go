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
	sessions      map[string]*Session
	userSessions  map[string]*WebLoginSession
}

func NewService(rClient *redis.Client) *Service {
	return &Service{
		redisClient:  rClient,
		sessions:     make(map[string]*Session),
		userSessions: make(map[string]*WebLoginSession),
	}
}

// =========================================================================
// SESSIONS (Customer Session Identity, decoupled from exit IP)
// =========================================================================

type GetOrCreateSessionParams struct {
	SessionID         string
	UserID            string
	CredentialID      string
	Country           string
	RotationMode      string // sticky, rotating
	ProviderID        string
	ProviderSessionID string
	DurationMin       int
}

// GetOrCreateSession retrieves an active session or registers a new one
func (s *Service) GetOrCreateSession(ctx context.Context, params GetOrCreateSessionParams) (*Session, bool, error) {
	if params.SessionID == "" {
		params.SessionID = "sess_" + uuid.New().String()[:10]
	}
	if params.DurationMin <= 0 {
		params.DurationMin = 15
	}
	if params.RotationMode == "" {
		params.RotationMode = "sticky"
	}
	if params.ProviderSessionID == "" {
		params.ProviderSessionID = "psess_" + uuid.New().String()[:8]
	}

	redisKey := fmt.Sprintf("session:%s", params.SessionID)

	// 1. Check Redis for existing active session (Fast Path)
	if s.redisClient != nil && params.RotationMode == "sticky" {
		val, err := s.redisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			var existing Session
			if err := json.Unmarshal([]byte(val), &existing); err == nil {
				if existing.UserID == params.UserID || params.UserID == "" {
					existing.LastUsedAt = time.Now()
					return &existing, false, nil
				}
			}
		}
	}

	// Check In-Memory Store
	if params.RotationMode == "sticky" {
		s.mu.RLock()
		if existing, exists := s.sessions[params.SessionID]; exists {
			if existing.ExpiresAt.After(time.Now()) && (existing.UserID == params.UserID || params.UserID == "") {
				existing.LastUsedAt = time.Now()
				s.mu.RUnlock()
				return existing, false, nil
			}
		}
		s.mu.RUnlock()
	}

	// 2. Create new customer session entity
	now := time.Now()
	expiresAt := now.Add(time.Duration(params.DurationMin) * time.Minute)

	session := &Session{
		ID:                params.SessionID,
		UserID:            params.UserID,
		CredentialID:      params.CredentialID,
		Country:           params.Country,
		RotationMode:      params.RotationMode,
		ProviderID:        params.ProviderID,
		ProviderSessionID: params.ProviderSessionID,
		Status:            "active",
		ExpiresAt:         expiresAt,
		CreatedAt:         now,
		LastUsedAt:        now,
	}

	ttl := time.Duration(params.DurationMin) * time.Minute
	if params.RotationMode == "rotating" {
		ttl = 30 * time.Second
	}

	if s.redisClient != nil {
		data, err := json.Marshal(session)
		if err == nil {
			_ = s.redisClient.Set(ctx, redisKey, data, ttl).Err()
			userKey := fmt.Sprintf("user_sessions:%s:%s", params.UserID, params.SessionID)
			_ = s.redisClient.Set(ctx, userKey, params.SessionID, ttl).Err()
		}
	}

	s.mu.Lock()
	s.sessions[session.ID] = session
	s.mu.Unlock()

	return session, true, nil
}

func (s *Service) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	redisKey := fmt.Sprintf("session:%s", sessionID)

	if s.redisClient != nil {
		val, err := s.redisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			var sess Session
			if err := json.Unmarshal([]byte(val), &sess); err == nil {
				return &sess, nil
			}
		}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	if sess, exists := s.sessions[sessionID]; exists {
		if sess.ExpiresAt.After(time.Now()) {
			return sess, nil
		}
	}
	return nil, ErrSessionNotFound
}

func (s *Service) RevokeSession(ctx context.Context, sessionID string) error {
	redisKey := fmt.Sprintf("session:%s", sessionID)
	if s.redisClient != nil {
		_ = s.redisClient.Del(ctx, redisKey).Err()
	}

	s.mu.Lock()
	delete(s.sessions, sessionID)
	s.mu.Unlock()

	return nil
}

func (s *Service) ListUserSessions(ctx context.Context, userID string) ([]*Session, error) {
	var list []*Session

	if s.redisClient != nil {
		pattern := fmt.Sprintf("user_sessions:%s:*", userID)
		keys, err := s.redisClient.Keys(ctx, pattern).Result()
		if err == nil {
			for _, k := range keys {
				sessID, err := s.redisClient.Get(ctx, k).Result()
				if err == nil && sessID != "" {
					if sess, err := s.GetSession(ctx, sessID); err == nil {
						list = append(list, sess)
					}
				}
			}
		}
	}

	if len(list) == 0 {
		s.mu.RLock()
		now := time.Now()
		for _, sess := range s.sessions {
			if (sess.UserID == userID || userID == "") && sess.ExpiresAt.After(now) {
				list = append(list, sess)
			}
		}
		s.mu.RUnlock()
	}

	return list, nil
}

// =========================================================================
// WEB LOGIN SESSIONS (Dashboard UI)
// =========================================================================

func (s *Service) CreateWebLoginSession(ctx context.Context, userID, device, browser, location, ip string) (*WebLoginSession, error) {
	session := &WebLoginSession{
		ID:           "wlogin_" + uuid.New().String()[:12],
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
