package plans

import (
	"context"
	"errors"
	"sync"
	"time"
)

var (
	ErrPlanNotFound = errors.New("plan not found")
)

type Service struct {
	mu            sync.RWMutex
	plans         []*Plan
	subscriptions map[string]*Subscription
}

func NewService() *Service {
	s := &Service{
		plans: []*Plan{
			{
				ID:                  "plan_free",
				Name:                "Free",
				Slug:                "free",
				PriceMonthly:        0.00,
				MaxProxies:          50,
				TrafficLimitMB:      50,
				TrafficLimitDisplay: "50 MB per proxy",
				TrafficScope:        TrafficScopePerProxy,
				ValidityHours:       12,
				ValidityDisplay:     "12 hours",
				IsFree:              true,
				Features:            []string{"Up to 50 Free Proxies", "50 MB Traffic per proxy", "12 Hours Validity", "HTTP/HTTPS/SOCKS5"},
				IsActive:            true,
			},
			{
				ID:                  "plan_starter",
				Name:                "Starter",
				Slug:                "starter",
				PriceMonthly:        1.99,
				MaxProxies:          1,
				TrafficLimitMB:      500,
				TrafficLimitDisplay: "500 MB/day",
				TrafficScope:        TrafficScopeDaily,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"1 Dedicated Proxy Slot", "500 MB Daily Traffic Reset", "28 Days Validity", "Sticky & Rotating"},
				IsActive:            true,
			},
			{
				ID:                  "plan_basic",
				Name:                "Basic",
				Slug:                "basic",
				PriceMonthly:        4.99,
				MaxProxies:          2,
				TrafficLimitMB:      5 * 1024,
				TrafficLimitDisplay: "5 GB",
				TrafficScope:        TrafficScopeTotalPeriod,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"2 Active Proxy Slots", "5 GB Included Traffic", "28 Days Validity", "Geo Targeting"},
				IsActive:            true,
			},
			{
				ID:                  "plan_pro",
				Name:                "Pro",
				Slug:                "pro",
				PriceMonthly:        9.99,
				MaxProxies:          5,
				TrafficLimitMB:      15 * 1024,
				TrafficLimitDisplay: "15 GB",
				TrafficScope:        TrafficScopeTotalPeriod,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"5 Active Proxy Slots", "15 GB Included Traffic", "28 Days Validity", "High Concurrency"},
				IsActive:            true,
			},
			{
				ID:                  "plan_pro_plus",
				Name:                "Pro Plus",
				Slug:                "pro-plus",
				PriceMonthly:        14.99,
				MaxProxies:          5,
				TrafficLimitMB:      30 * 1024,
				TrafficLimitDisplay: "30 GB",
				TrafficScope:        TrafficScopeTotalPeriod,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"5 Active Proxy Slots", "30 GB Included Traffic", "28 Days Validity", "Residential & Mobile Pools"},
				IsActive:            true,
			},
			{
				ID:                  "plan_business",
				Name:                "Business",
				Slug:                "business",
				PriceMonthly:        19.99,
				MaxProxies:          10,
				TrafficLimitMB:      30 * 1024,
				TrafficLimitDisplay: "30 GB",
				TrafficScope:        TrafficScopeTotalPeriod,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"10 Active Proxy Slots", "30 GB Included Traffic", "28 Days Validity", "99.9% Uptime SLA"},
				IsActive:            true,
			},
			{
				ID:                  "plan_business_plus",
				Name:                "Business Plus",
				Slug:                "business-plus",
				PriceMonthly:        29.99,
				MaxProxies:          10,
				TrafficLimitMB:      50 * 1024,
				TrafficLimitDisplay: "50 GB",
				TrafficScope:        TrafficScopeTotalPeriod,
				ValidityHours:       28 * 24,
				ValidityDisplay:     "28 days",
				IsFree:              false,
				Features:            []string{"10 Active Proxy Slots", "50 GB Included Traffic", "28 Days Validity", "24/7 Dedicated Support"},
				IsActive:            true,
			},
		},
		subscriptions: make(map[string]*Subscription),
	}

	return s
}

func (s *Service) ListPlans(_ context.Context) ([]*Plan, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.plans, nil
}

func (s *Service) GetPlanByID(_ context.Context, planID string) (*Plan, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.plans {
		if p.ID == planID || p.Slug == planID || p.Name == planID {
			return p, nil
		}
	}
	return nil, ErrPlanNotFound
}

func (s *Service) ListSubscriptions(_ context.Context, userID string) ([]*Subscription, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var userSubs []*Subscription
	for _, sub := range s.subscriptions {
		if sub.UserID == userID {
			userSubs = append(userSubs, sub)
		}
	}
	return userSubs, nil
}

func (s *Service) CreateSubscription(_ context.Context, userID, planID, paymentMethod string) (*Subscription, error) {
	plan, err := s.GetPlanByID(context.Background(), planID)
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	validityDays := 28
	if plan.IsFree {
		validityDays = 365
	}

	sub := &Subscription{
		ID:            "sub_" + time.Now().Format("20060102150405"),
		UserID:        userID,
		PlanID:        plan.ID,
		Plan:          plan,
		Status:        "active",
		AutoRenew:     !plan.IsFree,
		NextBillingAt: time.Now().AddDate(0, 0, validityDays).Format("2006-01-02"),
		PaymentMethod: paymentMethod,
	}

	s.subscriptions[sub.ID] = sub
	return sub, nil
}
