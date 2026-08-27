package plans

type TrafficScope string

const (
	TrafficScopePerProxy    TrafficScope = "per_proxy"
	TrafficScopeDaily       TrafficScope = "daily"
	TrafficScopeTotalPeriod TrafficScope = "total_period"
)

type Plan struct {
	ID                  string       `json:"id"`
	Name                string       `json:"name"`
	Slug                string       `json:"slug"`
	PriceMonthly        float64      `json:"price_monthly"`
	MaxProxies          int          `json:"max_proxies"`
	TrafficLimitMB      int64        `json:"traffic_limit_mb"`
	TrafficLimitDisplay string       `json:"traffic_limit_display"`
	TrafficScope        TrafficScope `json:"traffic_scope"`
	ValidityHours       int          `json:"validity_hours"`
	ValidityDisplay     string       `json:"validity_display"`
	IsFree              bool         `json:"is_free"`
	Features            []string     `json:"features"`
	IsActive            bool         `json:"is_active"`
	VCPU                int          `json:"vcpu,omitempty"`
	RAMGB               int          `json:"ram_gb,omitempty"`
	StorageGB           int          `json:"storage_gb,omitempty"`
	BandwidthTB         float64      `json:"bandwidth_tb,omitempty"`
}

type Subscription struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	PlanID        string  `json:"plan_id"`
	Plan          *Plan   `json:"plan,omitempty"`
	Status        string  `json:"status"` // active, past_due, canceled
	AutoRenew     bool    `json:"auto_renew"`
	NextBillingAt string  `json:"next_billing_at"`
	PaymentMethod string  `json:"payment_method"`
}
