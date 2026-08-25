package policy

import (
	"strings"
	"sync"
	"time"
)

type Decision struct {
	Allowed             bool      `json:"allowed"`
	StatusCode          int       `json:"status_code"`
	Reason              string    `json:"reason"`
	UserID              string    `json:"user_id"`
	CredentialID        string    `json:"credential_id"`
	SessionID           string    `json:"session_id"`
	AssignedExitIP      string    `json:"assigned_exit_ip"`
	UpstreamProvider    string    `json:"upstream_provider"`
	UpstreamHost        string    `json:"upstream_host"`
	RemainingQuotaBytes int64     `json:"remaining_quota_bytes"`
	ThreadsLimit        int       `json:"threads_limit"`
	ExpiresAt           time.Time `json:"expires_at"`
}

type Cache struct {
	mu      sync.RWMutex
	entries map[string]*entry
	ttl     time.Duration
}

type entry struct {
	decision  *Decision
	expiresAt time.Time
}

func NewCache(ttl time.Duration) *Cache {
	return &Cache{
		entries: make(map[string]*entry),
		ttl:     ttl,
	}
}

func (c *Cache) Get(key string) (*Decision, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.entries[key]
	if !exists || time.Now().After(item.expiresAt) {
		return nil, false
	}
	return item.decision, true
}

func (c *Cache) Set(key string, decision *Decision) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &entry{
		decision:  decision,
		expiresAt: time.Now().Add(c.ttl),
	}
}

func (c *Cache) Invalidate(target string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if target == "" || target == "*" {
		c.entries = make(map[string]*entry)
		return
	}

	for k, v := range c.entries {
		if v.decision != nil && (v.decision.UserID == target || v.decision.CredentialID == target || strings.Contains(k, target)) {
			delete(c.entries, k)
		}
	}
}
