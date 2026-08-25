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
				ID:           "plan_kvm1",
				Name:         "KVM 1 Starter",
				Slug:         "kvm-1",
				PriceMonthly: 5.99,
				VCPU:         1,
				RAMGB:        4,
				StorageGB:    50,
				BandwidthTB:  4.0,
				Features:     []string{"1 Dedicated IPv4", "Weekly Automated Backups", "Full Root Access", "1 Gbps Port"},
				IsActive:     true,
			},
			{
				ID:           "plan_kvm2",
				Name:         "KVM 2 Production",
				Slug:         "kvm-2",
				PriceMonthly: 11.99,
				VCPU:         2,
				RAMGB:        8,
				StorageGB:    100,
				BandwidthTB:  8.0,
				Features:     []string{"1 Dedicated IPv4", "Daily Automated Backups", "Docker Manager", "DDoS Protection", "NVMe Storage"},
				IsActive:     true,
			},
			{
				ID:           "plan_kvm4",
				Name:         "KVM 4 Business Scale",
				Slug:         "kvm-4",
				PriceMonthly: 21.99,
				VCPU:         4,
				RAMGB:        16,
				StorageGB:    200,
				BandwidthTB:  16.0,
				Features:     []string{"2 Dedicated IPv4", "Snapshot Retention (5)", "Malware Scanner", "Priority 24/7 SLA", "NVMe Gen4"},
				IsActive:     true,
			},
			{
				ID:           "plan_kvm8",
				Name:         "KVM 8 Enterprise",
				Slug:         "kvm-8",
				PriceMonthly: 39.99,
				VCPU:         8,
				RAMGB:        32,
				StorageGB:    400,
				BandwidthTB:  32.0,
				Features:     []string{"4 Dedicated IPv4", "Unlimited Snapshots", "Custom Gateway / 3proxy", "Dedicated Account Manager"},
				IsActive:     true,
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
		if p.ID == planID {
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

	sub := &Subscription{
		ID:            "sub_" + time.Now().Format("20060102150405"),
		UserID:        userID,
		PlanID:        planID,
		Plan:          plan,
		Status:        "active",
		AutoRenew:     true,
		NextBillingAt: time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		PaymentMethod: paymentMethod,
	}

	s.subscriptions[sub.ID] = sub
	return sub, nil
}
