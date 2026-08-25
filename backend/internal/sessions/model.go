package sessions

import "time"

// ProxySession represents a live sticky or rotating proxy session in Redis
type ProxySession struct {
	SessionID      string    `json:"session_id"`
	UserID         string    `json:"user_id"`
	Country        string    `json:"country"`
	Provider       string    `json:"provider"`
	ExitIP         string    `json:"exit_ip"`
	Host           string    `json:"host"`
	Port           int       `json:"port"`
	RotationPolicy string    `json:"rotation_policy"` // sticky, rotating
	DurationMin    int       `json:"duration_min"`
	CreatedAt      time.Time `json:"created_at"`
	ExpiresAt      time.Time `json:"expires_at"`
}

// Session represents a customer web login session
type Session struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Device       string    `json:"device"`
	Browser      string    `json:"browser"`
	Location     string    `json:"location"`
	IPAddress    string    `json:"ip_address"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
	IsCurrent    bool      `json:"is_current"`
}
