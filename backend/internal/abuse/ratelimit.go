package abuse

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
)

type clientRecord struct {
	count       int
	windowStart time.Time
}

type RateLimiter struct {
	mu           sync.Mutex
	records      map[string]*clientRecord
	limitPerMin  int
	blockSeconds int
}

func NewRateLimiter(limitPerMin int) *RateLimiter {
	rl := &RateLimiter{
		records:      make(map[string]*clientRecord),
		limitPerMin:  limitPerMin,
		blockSeconds: 60,
	}

	// Periodically cleanup stale rate limiting entries
	go func() {
		for {
			time.Sleep(2 * time.Minute)
			rl.mu.Lock()
			now := time.Now()
			for ip, rec := range rl.records {
				if now.Sub(rec.windowStart) > 5*time.Minute {
					delete(rl.records, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := extractIP(r)

		rl.mu.Lock()
		now := time.Now()
		rec, exists := rl.records[ip]
		if !exists || now.Sub(rec.windowStart) > time.Minute {
			rl.records[ip] = &clientRecord{count: 1, windowStart: now}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		rec.count++
		if rec.count > rl.limitPerMin {
			rl.mu.Unlock()
			response.Error(w, http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests. Please slow down.")
			return
		}

		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}
