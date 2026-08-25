package sessions

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	redisClient *redis.Client
	mu          sync.RWMutex
	memoryStore map[string]*Session
}

func NewService(rClient *redis.Client) *Service {
	return &Service{
		redisClient: rClient,
		memoryStore: make(map[string]*Session),
	}
}

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

	if s.redisClient != nil {
		key := fmt.Sprintf("session:%s:%s", userID, session.ID)
		data, err := json.Marshal(session)
		if err == nil {
			s.redisClient.Set(ctx, key, data, 7*24*time.Hour)
		}
	}

	s.mu.Lock()
	s.memoryStore[session.ID] = session
	s.mu.Unlock()

	return session, nil
}

func (s *Service) ListUserSessions(ctx context.Context, userID string, currentSessionID string) ([]*Session, error) {
	var sessions []*Session

	if s.redisClient != nil {
		pattern := fmt.Sprintf("session:%s:*", userID)
		keys, err := s.redisClient.Keys(ctx, pattern).Result()
		if err == nil && len(keys) > 0 {
			for _, k := range keys {
				val, err := s.redisClient.Get(ctx, k).Result()
				if err == nil {
					var sess Session
					if json.Unmarshal([]byte(val), &sess) == nil {
						sess.IsCurrent = sess.ID == currentSessionID
						sessions = append(sessions, &sess)
					}
				}
			}
		}
	}

	if len(sessions) == 0 {
		s.mu.RLock()
		for _, sess := range s.memoryStore {
			if sess.UserID == userID {
				sessCopy := *sess
				sessCopy.IsCurrent = sess.ID == currentSessionID
				sessions = append(sessions, &sessCopy)
			}
		}
		s.mu.RUnlock()
	}

	return sessions, nil
}

func (s *Service) RevokeSession(ctx context.Context, userID, sessionID string) error {
	if s.redisClient != nil {
		key := fmt.Sprintf("session:%s:%s", userID, sessionID)
		s.redisClient.Del(ctx, key)
	}

	s.mu.Lock()
	delete(s.memoryStore, sessionID)
	s.mu.Unlock()

	return nil
}
