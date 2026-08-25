package providers

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	instances, err := h.service.ListUserVps(r.Context(), claims.UserID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "VPS instances retrieved", instances)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	vps, err := h.service.GetVpsByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, "VPS details retrieved", vps)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req CreateVpsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	vps, err := h.service.CreateVps(r.Context(), claims.UserID, &req)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "VPS instance provisioning initiated", vps)
}

func (h *Handler) Action(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	var req ServerActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	if err := h.service.ExecuteAction(r.Context(), id, req.Action); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, "Server action executed", map[string]string{"action": req.Action, "status": "processing"})
}

func (h *Handler) GetFirewall(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	rules, err := h.service.GetFirewallRules(r.Context(), id)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.Success(w, "Firewall rules retrieved", rules)
}
