package credentials

import "time"

type ApiCredential struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	Name       string     `json:"name"`
	Prefix     string     `json:"prefix"` // e.g. cp_live_98a7
	SecretHash string     `json:"-"`
	Scopes     []string   `json:"scopes"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateCredentialRequest struct {
	Name      string   `json:"name"`
	Scopes    []string `json:"scopes"`
	ExpiresIn int      `json:"expires_in_days,omitempty"` // days
}

type CreateCredentialResponse struct {
	Credential *ApiCredential `json:"credential"`
	PlainText  string         `json:"plain_text_secret"` // Displayed ONCE to user upon creation
}
