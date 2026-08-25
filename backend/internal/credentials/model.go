package credentials

import "time"

type ProxyCredential struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"user_id"`
	Name               string    `json:"name"`
	ProxyType          string    `json:"proxy_type"` // residential, datacenter, mobile, isp
	Protocol           string    `json:"protocol"`   // http, https, socks5
	RotationMode       string    `json:"rotation_mode"` // rotating, sticky
	SessionDurationMin int       `json:"session_duration_min"`
	TargetCountry      string    `json:"target_country"`
	TargetCountryCode  string    `json:"target_country_code"`
	TargetState        string    `json:"target_state,omitempty"`
	TargetCity         string    `json:"target_city,omitempty"`
	Username           string    `json:"username"`
	PasswordHash       string    `json:"-"`
	PlainPassword      string    `json:"password"` // returned upon creation/listing for developer convenience
	Host               string    `json:"host"`
	Port               int       `json:"port"`
	IPWhitelist        []string  `json:"ip_whitelist"`
	Status             string    `json:"status"` // active, disabled
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type CreateProxyCredentialRequest struct {
	Name               string   `json:"name"`
	ProxyType          string   `json:"proxy_type"` // residential, datacenter, mobile, isp
	Protocol           string   `json:"protocol"`   // http, https, socks5
	RotationMode       string   `json:"rotation_mode"` // rotating, sticky
	SessionDurationMin int      `json:"session_duration_min,omitempty"`
	TargetCountry      string   `json:"target_country,omitempty"`
	TargetCountryCode  string   `json:"target_country_code,omitempty"`
	TargetState        string   `json:"target_state,omitempty"`
	TargetCity         string   `json:"target_city,omitempty"`
	IPWhitelist        []string `json:"ip_whitelist,omitempty"`
}

type ApiKey struct {
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

type CreateApiKeyRequest struct {
	Name      string   `json:"name"`
	Scopes    []string `json:"scopes"`
	ExpiresIn int      `json:"expires_in_days,omitempty"`
}

type CreateApiKeyResponse struct {
	ApiKey          *ApiKey `json:"api_key"`
	PlainTextSecret string  `json:"plain_text_secret"`
}
