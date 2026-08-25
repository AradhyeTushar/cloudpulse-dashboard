package users

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	res, err := h.service.Register(r.Context(), &req)
	if err != nil {
		if errorsIs(err, ErrUserAlreadyExists) {
			response.Error(w, http.StatusConflict, "USER_EXISTS", err.Error())
			return
		}
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "User registered successfully", res)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	res, err := h.service.Login(r.Context(), &req)
	if err != nil {
		response.Unauthorized(w, err.Error())
		return
	}

	response.Success(w, "Authentication successful", res)
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	user, err := h.service.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		response.NotFound(w, "User profile not found")
		return
	}

	response.Success(w, "Profile retrieved", user)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	user, err := h.service.UpdateProfile(r.Context(), claims.UserID, &req)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "Profile updated successfully", user)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	if err := h.service.ChangePassword(r.Context(), claims.UserID, &req); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, "Password updated successfully", nil)
}

// BetterAuthSignIn handles POST /api/auth/sign-in/email conforming to Better Auth protocol
func (h *Handler) BetterAuthSignIn(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": map[string]string{"message": "Invalid JSON payload"},
		})
		return
	}

	res, err := h.service.Login(r.Context(), &req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": map[string]string{"message": err.Error()},
		})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "better-auth.session_token",
		Value:    res.Token,
		Path:     "/",
		Expires:  res.ExpiresAt,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"token": res.Token,
		"user": map[string]any{
			"id":            res.User.ID,
			"name":          res.User.Name,
			"email":         res.User.Email,
			"emailVerified": true,
			"role":          res.User.Role,
			"createdAt":     res.User.CreatedAt,
			"updatedAt":     res.User.UpdatedAt,
		},
		"session": map[string]any{
			"id":        "sess_" + res.User.ID,
			"userId":    res.User.ID,
			"token":     res.Token,
			"expiresAt": res.ExpiresAt,
		},
	})
}

// BetterAuthSignUp handles POST /api/auth/sign-up/email conforming to Better Auth protocol
func (h *Handler) BetterAuthSignUp(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": map[string]string{"message": "Invalid JSON payload"},
		})
		return
	}

	res, err := h.service.Register(r.Context(), &req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		status := http.StatusBadRequest
		if errorsIs(err, ErrUserAlreadyExists) {
			status = http.StatusConflict
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": map[string]string{"message": err.Error()},
		})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "better-auth.session_token",
		Value:    res.Token,
		Path:     "/",
		Expires:  res.ExpiresAt,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"token": res.Token,
		"user": map[string]any{
			"id":            res.User.ID,
			"name":          res.User.Name,
			"email":         res.User.Email,
			"emailVerified": true,
			"role":          res.User.Role,
			"createdAt":     res.User.CreatedAt,
			"updatedAt":     res.User.UpdatedAt,
		},
		"session": map[string]any{
			"id":        "sess_" + res.User.ID,
			"userId":    res.User.ID,
			"token":     res.Token,
			"expiresAt": res.ExpiresAt,
		},
	})
}

// BetterAuthSignOut handles POST /api/auth/sign-out
func (h *Handler) BetterAuthSignOut(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "better-auth.session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: false,
	})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true})
}

// BetterAuthGetSession handles GET /api/auth/get-session and GET /api/auth/session
func (h *Handler) BetterAuthGetSession(w http.ResponseWriter, r *http.Request) {
	token := ""
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token = strings.TrimPrefix(authHeader, "Bearer ")
	} else if cookie, err := r.Cookie("better-auth.session_token"); err == nil {
		token = cookie.Value
	}

	if token == "" {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(nil)
		return
	}

	tokenService := h.service.GetTokenService()
	if tokenService == nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(nil)
		return
	}
	claims, err := tokenService.ValidateToken(token)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(nil)
		return
	}

	user, err := h.service.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"user": map[string]any{
			"id":            user.ID,
			"name":          user.Name,
			"email":         user.Email,
			"emailVerified": true,
			"role":          user.Role,
			"createdAt":     user.CreatedAt,
			"updatedAt":     user.UpdatedAt,
		},
		"session": map[string]any{
			"id":        "sess_" + user.ID,
			"userId":    user.ID,
			"token":     token,
			"expiresAt": claims.ExpiresAt.Time,
		},
	})
}

func errorsIs(err, target error) bool {
	return err == target || (err != nil && target != nil && err.Error() == target.Error())
}
