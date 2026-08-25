package limits

import (
	"sync"
	"time"
)

type RateLimiter struct {
	mu      sync.Mutex
	limits  map[string][]time.Time
	maxReqs int
	window  time.Duration
}

func NewRateLimiter(maxReqs int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		limits:  make(map[string][]time.Time),
		maxReqs: maxReqs,
		window:  window,
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	var valid []time.Time
	for _, t := range rl.limits[key] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.maxReqs {
		rl.limits[key] = valid
		return false
	}

	rl.limits[key] = append(valid, now)
	return true
}
