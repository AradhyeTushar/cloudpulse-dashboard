package credentials

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

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req CreateCredentialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	res, err := h.service.Create(r.Context(), claims.UserID, &req)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "API Key generated successfully. Save this secret now as it will not be shown again.", res)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	creds, err := h.service.List(r.Context(), claims.UserID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "API credentials retrieved", creds)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "Missing credential ID")
		return
	}

	if err := h.service.Delete(r.Context(), claims.UserID, id); err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, "API Key revoked and deleted", nil)
}
