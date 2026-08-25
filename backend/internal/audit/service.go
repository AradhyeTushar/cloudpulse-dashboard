package audit

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	mu   sync.RWMutex
	logs []*AuditLog
}

func NewService() *Service {
	s := &Service{}
	// Seed some initial security logs
	s.logs = []*AuditLog{
		{
			ID:           "aud_1",
			UserID:       "usr_98a72c1e",
			Action:       "user.login",
			ResourceType: "user",
			ResourceID:   "usr_98a72c1e",
			IPAddress:    "72.229.28.185",
			UserAgent:    "Chrome 128.0 (macOS)",
			Details:      map[string]interface{}{"status": "success", "auth_method": "password+totp"},
			CreatedAt:    time.Now().Add(-10 * time.Minute),
		},
		{
			ID:           "aud_2",
			UserID:       "usr_98a72c1e",
			Action:       "vps.reboot",
			ResourceType: "vps",
			ResourceID:   "vps_98a72c1e89",
			IPAddress:    "72.229.28.185",
			UserAgent:    "Chrome 128.0 (macOS)",
			Details:      map[string]interface{}{"type": "soft_reboot"},
			CreatedAt:    time.Now().Add(-2 * time.Hour),
		},
	}
	return s
}

func (s *Service) Record(_ context.Context, log *AuditLog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if log.ID == "" {
		log.ID = "aud_" + uuid.New().String()[:10]
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}

	s.logs = append([]*AuditLog{log}, s.logs...)
}

func (s *Service) ListUserLogs(_ context.Context, userID string, limit int) ([]*AuditLog, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*AuditLog
	for _, l := range s.logs {
		if l.UserID == userID || userID == "" {
			result = append(result, l)
			if limit > 0 && len(result) >= limit {
				break
			}
		}
	}
	return result, nil
}
