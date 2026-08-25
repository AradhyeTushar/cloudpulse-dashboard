package sessions

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/policy"
	"github.com/redis/go-redis/v9"
)

type SessionManager struct {
	redisClient *redis.Client
	mu          sync.RWMutex
	inMemSess   map[string]*policy.Decision
}

func NewSessionManager(rClient *redis.Client) *SessionManager {
	return &SessionManager{
		redisClient: rClient,
		inMemSess:   make(map[string]*policy.Decision),
	}
}

func (sm *SessionManager) GetSession(ctx context.Context, sessionID string) (*policy.Decision, bool) {
	if sessionID == "" {
		return nil, false
	}

	if sm.redisClient != nil {
		key := fmt.Sprintf("session:%s", sessionID)
		val, err := sm.redisClient.Get(ctx, key).Result()
		if err == nil && val != "" {
			var dec policy.Decision
			if err := json.Unmarshal([]byte(val), &dec); err == nil && dec.Allowed {
				return &dec, true
			}
		}
	}

	sm.mu.RLock()
	defer sm.mu.RUnlock()
	if dec, exists := sm.inMemSess[sessionID]; exists {
		if time.Now().Before(dec.ExpiresAt) && dec.Allowed {
			return dec, true
		}
	}
	return nil, false
}

func (sm *SessionManager) SaveSession(ctx context.Context, sessionID string, dec *policy.Decision, ttl time.Duration) {
	if sessionID == "" || dec == nil {
		return
	}

	dec.ExpiresAt = time.Now().Add(ttl)

	if sm.redisClient != nil {
		key := fmt.Sprintf("session:%s", sessionID)
		data, err := json.Marshal(dec)
		if err == nil {
			_ = sm.redisClient.Set(ctx, key, data, ttl).Err()
		}
	}

	sm.mu.Lock()
	sm.inMemSess[sessionID] = dec
	sm.mu.Unlock()
}

func (sm *SessionManager) Invalidate(target string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if target == "" || target == "*" {
		sm.inMemSess = make(map[string]*policy.Decision)
		return
	}

	for id, dec := range sm.inMemSess {
		if dec.UserID == target || dec.CredentialID == target || id == target {
			delete(sm.inMemSess, id)
		}
	}
}
