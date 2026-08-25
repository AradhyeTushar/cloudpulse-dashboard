package credentials

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCredentialNotFound = errors.New("API credential not found")
)

type Service struct {
	mu          sync.RWMutex
	credentials map[string]*ApiCredential
}

func NewService() *Service {
	return &Service{
		credentials: make(map[string]*ApiCredential),
	}
}

// GenerateSecret creates a cryptographically secure random secret token
func GenerateSecret() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("cp_live_%s", hex.EncodeToString(bytes)), nil
}

func HashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

func (s *Service) Create(ctx context.Context, userID string, req *CreateCredentialRequest) (*CreateCredentialResponse, error) {
	if req.Name == "" {
		return nil, errors.New("credential name is required")
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

	cred := &ApiCredential{
		ID:         "cred_" + uuid.New().String()[:12],
		UserID:     userID,
		Name:       req.Name,
		Prefix:     prefix,
		SecretHash: secretHash,
		Scopes:     req.Scopes,
		ExpiresAt:  expiresAt,
		CreatedAt:  time.Now(),
	}

	s.mu.Lock()
	s.credentials[cred.ID] = cred
	s.mu.Unlock()

	return &CreateCredentialResponse{
		Credential: cred,
		PlainText:  secret,
	}, nil
}

func (s *Service) List(ctx context.Context, userID string) ([]*ApiCredential, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*ApiCredential
	for _, cred := range s.credentials {
		if cred.UserID == userID {
			result = append(result, cred)
		}
	}
	return result, nil
}

func (s *Service) Delete(ctx context.Context, userID, credentialID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	cred, exists := s.credentials[credentialID]
	if !exists || cred.UserID != userID {
		return ErrCredentialNotFound
	}

	delete(s.credentials, credentialID)
	return nil
}

func (s *Service) ValidateSecret(ctx context.Context, plainTextSecret string) (*ApiCredential, error) {
	secretHash := HashSecret(plainTextSecret)

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, cred := range s.credentials {
		if cred.SecretHash == secretHash {
			if cred.ExpiresAt != nil && time.Now().After(*cred.ExpiresAt) {
				return nil, errors.New("API credential has expired")
			}
			now := time.Now()
			cred.LastUsedAt = &now
			return cred, nil
		}
	}

	return nil, ErrCredentialNotFound
}
