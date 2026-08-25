package limits

import (
	"context"
	"fmt"
	"sync"

	"github.com/redis/go-redis/v9"
)

var acquireSlotScript = redis.NewScript(`
	local key = KEYS[1]
	local limit = tonumber(ARGV[1])
	local current = tonumber(redis.call('get', key) or '0')
	if current < limit then
		redis.call('incr', key)
		redis.call('expire', key, 120) -- safety TTL for abnormal disconnects
		return 1
	else
		return 0
	end
`)

var releaseSlotScript = redis.NewScript(`
	local key = KEYS[1]
	local current = tonumber(redis.call('get', key) or '0')
	if current > 0 then
		redis.call('decr', key)
	end
	return 1
`)

type ConcurrencyTracker struct {
	redisClient *redis.Client
	mu          sync.Mutex
	inMemSlots  map[string]int
}

func NewConcurrencyTracker(rClient *redis.Client) *ConcurrencyTracker {
	return &ConcurrencyTracker{
		redisClient: rClient,
		inMemSlots:  make(map[string]int),
	}
}

func (ct *ConcurrencyTracker) Acquire(ctx context.Context, userID string, limit int) bool {
	if userID == "" {
		return true
	}
	if limit <= 0 {
		limit = 500
	}

	if ct.redisClient != nil {
		key := fmt.Sprintf("concurrency:%s", userID)
		res, err := acquireSlotScript.Run(ctx, ct.redisClient, []string{key}, limit).Int()
		if err == nil {
			return res == 1
		}
	}

	// Thread-safe in-memory fallback
	ct.mu.Lock()
	defer ct.mu.Unlock()
	current := ct.inMemSlots[userID]
	if current >= limit {
		return false
	}
	ct.inMemSlots[userID]++
	return true
}

func (ct *ConcurrencyTracker) Release(ctx context.Context, userID string) {
	if userID == "" {
		return
	}

	if ct.redisClient != nil {
		key := fmt.Sprintf("concurrency:%s", userID)
		_ = releaseSlotScript.Run(ctx, ct.redisClient, []string{key}).Err()
	}

	ct.mu.Lock()
	if count := ct.inMemSlots[userID]; count > 0 {
		ct.inMemSlots[userID]--
	}
	ct.mu.Unlock()
}
