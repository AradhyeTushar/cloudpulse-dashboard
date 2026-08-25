package controlplane

import "time"

// ProxyAuthRequest is received when a client attempts to connect through the proxy gateway
type ProxyAuthRequest struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ClientIP      string `json:"client_ip"`
	TargetHost    string `json:"target_host"`
	TargetPort    int    `json:"target_port"`
	TargetCountry string `json:"target_country,omitempty"`
	Protocol      string `json:"protocol"` // http, https, socks5
}

// ProxyAuthDecision is the decision returned by the Control Plane to the Data Plane Gateway
type ProxyAuthDecision struct {
	Allowed            bool      `json:"allowed"`
	StatusCode         int       `json:"status_code"` // 200, 401, 402, 403, 429
	Reason             string    `json:"reason,omitempty"`
	UserID             string    `json:"user_id,omitempty"`
	CredentialID       string    `json:"credential_id,omitempty"`
	PlanSlug           string    `json:"plan_slug,omitempty"`
	SessionID          string    `json:"session_id,omitempty"`
	RotationMode       string    `json:"rotation_mode,omitempty"`
	AssignedExitIP     string    `json:"assigned_exit_ip,omitempty"`
	UpstreamProvider   string    `json:"upstream_provider,omitempty"`
	UpstreamHost       string    `json:"upstream_host,omitempty"`
	RemainingQuotaBytes int64     `json:"remaining_quota_bytes,omitempty"`
	AuthorizedAt       time.Time `json:"authorized_at"`
}

// UpstreamNode represents a verified egress node in the provider abstraction
type UpstreamNode struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	Type     string `json:"type"` // residential, datacenter, mobile
	Country  string `json:"country"`
	ExitIP   string `json:"exit_ip"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Latency  int    `json:"latency_ms"`
	Healthy  bool   `json:"healthy"`
}
