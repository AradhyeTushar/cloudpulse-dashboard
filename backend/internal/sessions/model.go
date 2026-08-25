package sessions

import "time"

// Session represents the customer-facing proxy session identity (decoupled from exit IP)
type Session struct {
	ID                string    `json:"id"`
	UserID            string    `json:"user_id"`
	CredentialID      string    `json:"credential_id"`
	Country           string    `json:"country"`
	RotationMode      string    `json:"rotation_mode"` // sticky, rotating
	ProviderID        string    `json:"provider_id"`
	ProviderSessionID string    `json:"provider_session_id"`
	Status            string    `json:"status"` // active, expired, revoked
	ExpiresAt         time.Time `json:"expires_at"`
	CreatedAt         time.Time `json:"created_at"`
	LastUsedAt        time.Time `json:"last_used_at"`
}

// WebLoginSession represents a user browser session for the dashboard
type WebLoginSession struct {
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
