package providers

import "time"

type VpsInstance struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Name          string    `json:"name"`
	Hostname      string    `json:"hostname"`
	PlanID        string    `json:"plan_id"`
	PlanName      string    `json:"plan_name"`
	IPAddress     string    `json:"ip_address"`
	IPv6Address   string    `json:"ipv6_address"`
	Status        string    `json:"status"` // running, stopped, rebooting, error
	Datacenter    string    `json:"datacenter"`
	Location      string    `json:"location"`
	OSName        string    `json:"os_name"`
	OSVersion     string    `json:"os_version"`
	KernelVersion string    `json:"kernel_version"`
	VCPU          int       `json:"vcpu"`
	RAMGB         int       `json:"ram_gb"`
	StorageGB     int       `json:"storage_gb"`
	BandwidthTB   float64   `json:"bandwidth_tb"`
	UptimeSeconds int64     `json:"uptime_seconds"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateVpsRequest struct {
	Name       string `json:"name"`
	Hostname   string `json:"hostname"`
	PlanID     string `json:"plan_id"`
	Datacenter string `json:"datacenter"`
	OSImage    string `json:"os_image"`
	SSHKeyID   string `json:"ssh_key_id,omitempty"`
}

type ServerActionRequest struct {
	Action string `json:"action"` // start, stop, reboot, force_reboot
}

type ResetPasswordRequest struct {
	NewPassword string `json:"new_password"`
}

type FirewallRule struct {
	ID        string    `json:"id"`
	VpsID     string    `json:"vps_id"`
	Type      string    `json:"type"` // inbound, outbound
	Protocol  string    `json:"protocol"` // tcp, udp, all
	PortRange string    `json:"port_range"`
	Source    string    `json:"source"`
	Action    string    `json:"action"` // accept, drop
	CreatedAt time.Time `json:"created_at"`
}
