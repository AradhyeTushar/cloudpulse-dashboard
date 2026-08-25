package admin

import (
	"context"
	"errors"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/plans"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
)

type SystemOverview struct {
	TotalTenants     int       `json:"total_tenants"`
	TotalVps         int       `json:"total_vps"`
	ActiveVps        int       `json:"active_vps"`
	TotalBandwidthTB float64   `json:"total_bandwidth_tb"`
	SystemHealth     string    `json:"system_health"`
	GeneratedAt      time.Time `json:"generated_at"`
}

type AdminUserView struct {
	ID                  string    `json:"id"`
	Name                string    `json:"name"`
	Email               string    `json:"email"`
	Role                string    `json:"role"`
	Status              string    `json:"status"` // active, suspended
	Plan                string    `json:"plan"`
	BandwidthUsedGB     int       `json:"bandwidth_used_gb"`
	BandwidthLimitGB    int       `json:"bandwidth_limit_gb"`
	ActiveSessionsCount int       `json:"active_sessions_count"`
	CreatedAt           time.Time `json:"created_at"`
}

type Service struct {
	userRepo     users.Repository
	credRepo     credentials.Repository
	plansService *plans.Service
}

func NewService(userRepo users.Repository, credRepo credentials.Repository, plansService *plans.Service) *Service {
	return &Service{
		userRepo:     userRepo,
		credRepo:     credRepo,
		plansService: plansService,
	}
}

func (s *Service) GetOverview(_ context.Context) (*SystemOverview, error) {
	return &SystemOverview{
		TotalTenants:     142,
		TotalVps:         389,
		ActiveVps:        374,
		TotalBandwidthTB: 1248.6,
		SystemHealth:     "healthy",
		GeneratedAt:      time.Now(),
	}, nil
}

func (s *Service) ListUsers(ctx context.Context) ([]*AdminUserView, error) {
	allUsers, err := s.userRepo.List(ctx, 100, 0)
	if err != nil {
		return nil, err
	}

	var results []*AdminUserView
	for _, u := range allUsers {
		planSlug := "pro-500gb"
		bandwidthLimit := 500
		subs, _ := s.plansService.ListSubscriptions(ctx, u.ID)
		if len(subs) > 0 {
			planSlug = subs[0].PlanID
		}

		creds, _ := s.credRepo.ListProxyCredentials(ctx, u.ID)

		results = append(results, &AdminUserView{
			ID:                  u.ID,
			Name:                u.Name,
			Email:               u.Email,
			Role:                u.Role,
			Status:              u.Status,
			Plan:                planSlug,
			BandwidthUsedGB:     42,
			BandwidthLimitGB:    bandwidthLimit,
			ActiveSessionsCount: len(creds),
			CreatedAt:           u.CreatedAt,
		})
	}
	return results, nil
}

func (s *Service) ToggleUserStatus(ctx context.Context, userID string) (*users.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user.Status == "active" {
		user.Status = "suspended"
	} else {
		user.Status = "active"
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *Service) AssignUserPlan(ctx context.Context, userID, planSlug string) error {
	if planSlug == "" {
		return errors.New("missing plan slug")
	}

	_, err := s.plansService.CreateSubscription(ctx, userID, planSlug, "Admin Override")
	return err
}
