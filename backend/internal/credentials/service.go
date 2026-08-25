package credentials

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	repo        Repository
	redisClient *redis.Client
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetRedisClient(rClient *redis.Client) {
	s.redisClient = rClient
}

// Generate random secret token
func GenerateSecret() (string, error) {
	bytes := make([]byte, 20)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("cp_live_%s", hex.EncodeToString(bytes)), nil
}

func GenerateRandomPassword() string {
	bytes := make([]byte, 8)
	_, _ = rand.Read(bytes)
	return "p_sec_" + hex.EncodeToString(bytes)
}

func HashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// =========================================================================
// PROXY CREDENTIALS (proxy_credentials table)
// =========================================================================

func (s *Service) CreateProxyCredential(ctx context.Context, userID string, req *CreateProxyCredentialRequest) (*ProxyCredential, error) {
	if req.Name == "" {
		return nil, errors.New("proxy endpoint name is required")
	}

	proxyType := req.ProxyType
	if proxyType == "" {
		proxyType = "residential"
	}
	protocol := req.Protocol
	if protocol == "" {
		protocol = "http"
	}
	rotationMode := req.RotationMode
	if rotationMode == "" {
		rotationMode = "rotating"
	}
	targetCountry := req.TargetCountry
	if targetCountry == "" {
		targetCountry = "United States"
	}
	targetCountryCode := req.TargetCountryCode
	if targetCountryCode == "" {
		targetCountryCode = "US"
	}

	rawPassword := GenerateRandomPassword()
	passHash, _ := auth.HashPassword(rawPassword, nil)

	randomUserSuffix := uuid.New().String()[:8]
	generatedUsername := fmt.Sprintf("cp_%s", randomUserSuffix)

	host := "pr.cloudpulse.net"
	port := 8000
	if proxyType == "datacenter" {
		host = "dc.cloudpulse.net"
	}
	if protocol == "socks5" {
		port = 1080
	}

	cred := &ProxyCredential{
		ID:                 "pcred_" + uuid.New().String()[:10],
		UserID:             userID,
		Name:               req.Name,
		ProxyType:          proxyType,
		Protocol:           protocol,
		RotationMode:       rotationMode,
		SessionDurationMin: req.SessionDurationMin,
		TargetCountry:      targetCountry,
		TargetCountryCode:  targetCountryCode,
		TargetState:        req.TargetState,
		TargetCity:         req.TargetCity,
		Username:           generatedUsername,
		PasswordHash:       passHash,
		PlainPassword:      rawPassword,
		Host:               host,
		Port:               port,
		IPWhitelist:        req.IPWhitelist,
		Status:             "active",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.CreateProxyCredential(ctx, cred); err != nil {
		return nil, err
	}

	return cred, nil
}

func (s *Service) ListProxyCredentials(ctx context.Context, userID string) ([]*ProxyCredential, error) {
	return s.repo.ListProxyCredentials(ctx, userID)
}

func (s *Service) ResetProxyCredential(ctx context.Context, userID, id string) (*ProxyCredential, error) {
	cred, err := s.repo.GetProxyCredentialByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if userID != "" && cred.UserID != userID {
		return nil, errors.New("unauthorized to reset this credential")
	}

	rawPassword := GenerateRandomPassword()
	passHash, _ := auth.HashPassword(rawPassword, nil)
	randomUserSuffix := uuid.New().String()[:8]
	generatedUsername := fmt.Sprintf("cp_%s", randomUserSuffix)

	cred.Username = generatedUsername
	cred.PasswordHash = passHash
	cred.PlainPassword = rawPassword
	cred.UpdatedAt = time.Now()

	if err := s.repo.UpdateProxyCredential(ctx, cred); err != nil {
		return nil, err
	}

	if s.redisClient != nil {
		_ = s.redisClient.Publish(ctx, "policy:invalidate", cred.UserID).Err()
	}

	return cred, nil
}

func (s *Service) DeleteProxyCredential(ctx context.Context, userID, id string) error {
	err := s.repo.DeleteProxyCredential(ctx, userID, id)
	if err == nil && s.redisClient != nil {
		_ = s.redisClient.Publish(ctx, "policy:invalidate", userID).Err()
	}
	return err
}

// =========================================================================
// API KEYS (api_keys table)
// =========================================================================

func (s *Service) CreateApiKey(ctx context.Context, userID string, req *CreateApiKeyRequest) (*CreateApiKeyResponse, error) {
	if req.Name == "" {
		return nil, errors.New("API key name is required")
	}

	secret, err := GenerateSecret()
	if err != nil {
		return nil, err
	}

	secretHash := HashSecret(secret)
	prefix := secret[:12] + "..."

	var expiresAt *time.Time
	if req.ExpiresIn > 0 {
		exp := time.Now().AddDate(0, 0, req.ExpiresIn)
		expiresAt = &exp
	}

	key := &ApiKey{
		ID:         "key_" + uuid.New().String()[:10],
		UserID:     userID,
		Name:       req.Name,
		Prefix:     prefix,
		SecretHash: secretHash,
		Scopes:     req.Scopes,
		ExpiresAt:  expiresAt,
		CreatedAt:  time.Now(),
	}

	if err := s.repo.CreateApiKey(ctx, key); err != nil {
		return nil, err
	}

	return &CreateApiKeyResponse{
		ApiKey:          key,
		PlainTextSecret: secret,
	}, nil
}

func (s *Service) ListApiKeys(ctx context.Context, userID string) ([]*ApiKey, error) {
	return s.repo.ListApiKeys(ctx, userID)
}

func (s *Service) DeleteApiKey(ctx context.Context, userID, id string) error {
	return s.repo.DeleteApiKey(ctx, userID, id)
}

func (s *Service) ValidateSecret(ctx context.Context, plainTextSecret string) (*ApiKey, error) {
	secretHash := HashSecret(plainTextSecret)
	return s.repo.GetApiKeyByHash(ctx, secretHash)
}
