package accounting

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type AggregatedUsage struct {
	UserID       string `json:"user_id"`
	CredentialID string `json:"credential_id"`
	BytesIn      int64  `json:"bytes_in"`
	BytesOut     int64  `json:"bytes_out"`
	Requests     int64  `json:"requests"`
	TargetDomain string `json:"target_domain"`
}

type UsageAccumulator struct {
	mu          sync.Mutex
	pending     map[string]*AggregatedUsage
	flushTicker *time.Ticker
	flushChan   chan struct{}
	apiURL      string
	httpClient  *http.Client
}

func NewUsageAccumulator(apiURL string, flushInterval time.Duration) *UsageAccumulator {
	acc := &UsageAccumulator{
		pending:     make(map[string]*AggregatedUsage),
		flushTicker: time.NewTicker(flushInterval),
		flushChan:   make(chan struct{}, 1),
		apiURL:      apiURL,
		httpClient:  &http.Client{Timeout: 5 * time.Second},
	}
	go acc.flushLoop()
	return acc
}

func (acc *UsageAccumulator) Record(userID, credID string, bytesIn, bytesOut int64, domain string) {
	if userID == "" || userID == "anonymous" {
		return
	}

	acc.mu.Lock()
	defer acc.mu.Unlock()

	key := fmt.Sprintf("%s:%s:%s", userID, credID, domain)
	if existing, exists := acc.pending[key]; exists {
		existing.BytesIn += bytesIn
		existing.BytesOut += bytesOut
		existing.Requests++
	} else {
		acc.pending[key] = &AggregatedUsage{
			UserID:       userID,
			CredentialID: credID,
			BytesIn:      bytesIn,
			BytesOut:     bytesOut,
			Requests:     1,
			TargetDomain: domain,
		}
	}
}

func (acc *UsageAccumulator) flushLoop() {
	for {
		select {
		case <-acc.flushTicker.C:
			acc.flushBatch()
		case <-acc.flushChan:
			acc.flushBatch()
			return
		}
	}
}

func (acc *UsageAccumulator) flushBatch() {
	acc.mu.Lock()
	if len(acc.pending) == 0 {
		acc.mu.Unlock()
		return
	}

	var batch []*AggregatedUsage
	for _, v := range acc.pending {
		batch = append(batch, v)
	}
	acc.pending = make(map[string]*AggregatedUsage)
	acc.mu.Unlock()

	// Asynchronous non-blocking flush to Control Plane
	go func(records []*AggregatedUsage) {
		payload := map[string]interface{}{"batch": records}
		body, err := json.Marshal(payload)
		if err != nil {
			return
		}

		req, err := http.NewRequest("POST", acc.apiURL+"/api/v1/internal/proxy/telemetry/batch", bytes.NewReader(body))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := acc.httpClient.Do(req)
		if err == nil {
			_ = resp.Body.Close()
		}
	}(batch)
}

func (acc *UsageAccumulator) Stop() {
	acc.flushTicker.Stop()
	acc.flushChan <- struct{}{}
}
