package usage

import "time"

type MetricSample struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

type VpsUsageMetrics struct {
	VpsID          string         `json:"vps_id"`
	CpuCurrentPct  float64        `json:"cpu_current_pct"`
	CpuHistory     []MetricSample `json:"cpu_history"`
	RamUsedMB      int            `json:"ram_used_mb"`
	RamTotalMB     int            `json:"ram_total_mb"`
	DiskUsedGB     int            `json:"disk_used_gb"`
	DiskTotalGB    int            `json:"disk_total_gb"`
	BandwidthUsedGB float64       `json:"bandwidth_used_gb"`
	BandwidthLimitGB float64      `json:"bandwidth_limit_gb"`
	UpdatedAt      time.Time      `json:"updated_at"`
}
