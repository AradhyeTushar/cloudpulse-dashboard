package limits

import (
	"context"
	"sync"
	"testing"
)

func TestConcurrencyTrackerRace(t *testing.T) {
	tracker := NewConcurrencyTracker(nil)
	ctx := context.Background()

	userID := "usr_concurrent_race_test"
	limit := 5
	var acquiredCount int64
	var wg sync.WaitGroup

	// Launch 20 concurrent goroutines competing for 5 slots
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if tracker.Acquire(ctx, userID, limit) {
				tracker.mu.Lock()
				acquiredCount++
				tracker.mu.Unlock()
			}
		}()
	}
	wg.Wait()

	if acquiredCount != 5 {
		t.Errorf("Expected exactly 5 concurrent acquisitions, got %d", acquiredCount)
	}

	// Release all 5 slots
	for i := 0; i < 5; i++ {
		tracker.Release(ctx, userID)
	}

	// Verify tracker is back to 0
	if tracker.inMemSlots[userID] != 0 {
		t.Errorf("Expected in-memory slots to be 0 after releases, got %d", tracker.inMemSlots[userID])
	}
}
