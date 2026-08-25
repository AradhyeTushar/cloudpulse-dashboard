package plans

type Plan struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Slug         string   `json:"slug"`
	PriceMonthly float64  `json:"price_monthly"`
	VCPU         int      `json:"vcpu"`
	RAMGB        int      `json:"ram_gb"`
	StorageGB    int      `json:"storage_gb"`
	BandwidthTB  float64  `json:"bandwidth_tb"`
	Features     []string `json:"features"`
	IsActive     bool     `json:"is_active"`
}

type Subscription struct {
	ID             string  `json:"id"`
	UserID         string  `json:"user_id"`
	PlanID         string  `json:"plan_id"`
	Plan           *Plan   `json:"plan,omitempty"`
	Status         string  `json:"status"` // active, past_due, canceled
	AutoRenew      bool    `json:"auto_renew"`
	NextBillingAt  string  `json:"next_billing_at"`
	PaymentMethod  string  `json:"payment_method"`
}
