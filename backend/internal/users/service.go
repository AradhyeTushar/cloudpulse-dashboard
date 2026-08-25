package users

import (
	"context"
	"errors"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/google/uuid"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type Service struct {
	repo         Repository
	tokenService *auth.TokenService
}

func NewService(repo Repository, tokenService *auth.TokenService) *Service {
	return &Service{
		repo:         repo,
		tokenService: tokenService,
	}
}

func (s *Service) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return nil, errors.New("name, email, and password are required")
	}

	if _, err := s.repo.GetByEmail(ctx, req.Email); err == nil {
		return nil, ErrUserAlreadyExists
	}

	hash, err := auth.HashPassword(req.Password, nil)
	if err != nil {
		return nil, err
	}

	user := &User{
		ID:            "usr_" + uuid.New().String()[:12],
		Name:          req.Name,
		Email:         req.Email,
		PasswordHash:  hash,
		Role:          "owner",
		WorkspaceName: req.Name + "'s Workspace",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, expiresAt, err := s.tokenService.GenerateToken(user.ID, user.Email, user.Role, user.WorkspaceName)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *Service) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	match, err := auth.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !match {
		return nil, ErrInvalidCredentials
	}

	token, expiresAt, err := s.tokenService.GenerateToken(user.ID, user.Email, user.Role, user.WorkspaceName)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *Service) GetProfile(ctx context.Context, userID string) (*User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, req *UpdateProfileRequest) (*User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.WorkspaceName != "" {
		user.WorkspaceName = req.WorkspaceName
	}
	user.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) ChangePassword(ctx context.Context, userID string, req *ChangePasswordRequest) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	match, err := auth.VerifyPassword(req.CurrentPassword, user.PasswordHash)
	if err != nil || !match {
		return errors.New("current password does not match")
	}

	newHash, err := auth.HashPassword(req.NewPassword, nil)
	if err != nil {
		return err
	}

	user.PasswordHash = newHash
	user.UpdatedAt = time.Now()
	return s.repo.Update(ctx, user)
}
