package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func Authenticator(tokenService *auth.TokenService, credService *credentials.Service) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Unauthorized(w, "Missing Authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				response.Unauthorized(w, "Invalid Authorization header format. Expected 'Bearer <token>'")
				return
			}

			tokenStr := parts[1]

			// Case 1: Check if it's an API Key (starts with cp_live_)
			if strings.HasPrefix(tokenStr, "cp_live_") && credService != nil {
				cred, err := credService.ValidateSecret(r.Context(), tokenStr)
				if err != nil {
					response.Unauthorized(w, "Invalid or expired API Key")
					return
				}

				claims := &auth.Claims{
					UserID: cred.UserID,
					Role:   "api_client",
				}
				ctx := context.WithValue(r.Context(), "claims", claims)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Case 2: JWT Access Token
			claims, err := tokenService.ValidateToken(tokenStr)
			if err != nil {
				response.Unauthorized(w, "Invalid or expired session token")
				return
			}

			ctx := context.WithValue(r.Context(), "claims", claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
