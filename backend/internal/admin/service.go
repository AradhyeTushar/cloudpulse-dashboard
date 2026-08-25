package admin

import (
	"context"
	"time"
)

type SystemOverview struct {
	TotalTenants    int       `json:"total_tenants"`
	TotalVps        int       `json:"total_vps"`
	ActiveVps       int       `json:"active_vps"`
	TotalBandwidthTB float64  `json:"total_bandwidth_tb"`
	SystemHealth    string    `json:"system_health"`
	GeneratedAt     time.Time `json:"generated_at"`
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) GetOverview(_ context.Context) (*SystemOverview, error) {
	return &SystemOverview{
		TotalTenants:     142,
		TotalVps:         389,
		ActiveVps:        374,
		TotalBandwidthTB: 1248.6,
		SystemHealth:     "healthy",
		GeneratedAt:      time.Now(),
	}, nil
}
