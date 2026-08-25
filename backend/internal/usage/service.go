package usage

import (
	"context"
	"math/rand"
	"sync"
	"time"
)

type Service struct {
	mu      sync.RWMutex
	metrics map[string]*VpsUsageMetrics
}

func NewService() *Service {
	return &Service{
		metrics: make(map[string]*VpsUsageMetrics),
	}
}

func (s *Service) GetVpsMetrics(_ context.Context, vpsID string) (*VpsUsageMetrics, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	m, exists := s.metrics[vpsID]
	if !exists {
		// Generate real-looking initial telemetry samples
		var history []MetricSample
		now := time.Now()
		for i := 12; i >= 0; i-- {
			t := now.Add(-time.Duration(i*5) * time.Minute)
			val := 15.0 + rand.Float64()*35.0
			history = append(history, MetricSample{
				Timestamp: t.Format("15:04"),
				Value:     float64(int(val*10)) / 10.0,
			})
		}

		m = &VpsUsageMetrics{
			VpsID:            vpsID,
			CpuCurrentPct:    24.5,
			CpuHistory:       history,
			RamUsedMB:        3440,
			RamTotalMB:       8192,
			DiskUsedGB:       38,
			DiskTotalGB:      100,
			BandwidthUsedGB:  241.8,
			BandwidthLimitGB: 8000.0,
			UpdatedAt:        time.Now(),
		}
		s.metrics[vpsID] = m
	}

	return m, nil
}
