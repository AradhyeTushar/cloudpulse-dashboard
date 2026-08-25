package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid or expired authentication token")
)

type Claims struct {
	UserID        string `json:"user_id"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	WorkspaceName string `json:"workspace_name"`
	jwt.RegisteredClaims
}

type TokenService struct {
	secretKey []byte
	duration  time.Duration
}

func NewTokenService(secretKey string, duration time.Duration) *TokenService {
	return &TokenService{
		secretKey: []byte(secretKey),
		duration:  duration,
	}
}

func (s *TokenService) GenerateToken(userID, email, role, workspaceName string) (string, time.Time, error) {
	expirationTime := time.Now().Add(s.duration)
	claims := &Claims{
		UserID:        userID,
		Email:         email,
		Role:          role,
		WorkspaceName: workspaceName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "cloudpulse-auth",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.secretKey)
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

func (s *TokenService) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return s.secretKey, nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
