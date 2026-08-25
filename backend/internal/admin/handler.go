package admin

import (
	"encoding/json"
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

func (h *Handler) GetOverview(w http.ResponseWriter, r *http.Request) {
	overview, err := h.service.GetOverview(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.Success(w, "Admin overview telemetry retrieved", overview)
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	users, err := h.service.ListUsers(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.Success(w, "Admin tenant users retrieved", users)
}

func (h *Handler) ToggleUserStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "Missing user ID")
		return
	}

	user, err := h.service.ToggleUserStatus(r.Context(), id)
	if err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, "User status updated", user)
}

func (h *Handler) AssignUserPlan(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "Missing user ID")
		return
	}

	var payload struct {
		PlanSlug string `json:"plan_slug"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "Invalid plan assignment payload")
		return
	}

	if err := h.service.AssignUserPlan(r.Context(), id, payload.PlanSlug); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, "Plan successfully assigned to user", nil)
}
