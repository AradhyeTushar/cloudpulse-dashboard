package sessions

import (
	"net/http"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	sessions, err := h.service.ListUserSessions(r.Context(), claims.UserID, "")
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "Active sessions retrieved", sessions)
}

func (h *Handler) Revoke(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "Missing session ID")
		return
	}

	if err := h.service.RevokeSession(r.Context(), claims.UserID, id); err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "Session revoked", nil)
}
