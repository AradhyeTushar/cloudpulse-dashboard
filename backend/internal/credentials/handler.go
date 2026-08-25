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

// =========================================================================
// PROXY CREDENTIALS HANDLERS
// =========================================================================

func (h *Handler) CreateProxyCredential(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req CreateProxyCredentialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	cred, err := h.service.CreateProxyCredential(r.Context(), claims.UserID, &req)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "Proxy credential created successfully", cred)
}

func (h *Handler) ListProxyCredentials(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	creds, err := h.service.ListProxyCredentials(r.Context(), claims.UserID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "Proxy credentials retrieved", creds)
}

func (h *Handler) DeleteProxyCredential(w http.ResponseWriter, r *http.Request) {
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

	if err := h.service.DeleteProxyCredential(r.Context(), claims.UserID, id); err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, "Proxy credential deleted", nil)
}

// =========================================================================
// API KEYS HANDLERS
// =========================================================================

func (h *Handler) CreateApiKey(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	var req CreateApiKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	res, err := h.service.CreateApiKey(r.Context(), claims.UserID, &req)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "API Key generated successfully. Save this secret now as it will not be shown again.", res)
}

func (h *Handler) ListApiKeys(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	keys, err := h.service.ListApiKeys(r.Context(), claims.UserID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "API keys retrieved", keys)
}

func (h *Handler) DeleteApiKey(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil {
		response.Unauthorized(w, "Authentication required")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.BadRequest(w, "Missing key ID")
		return
	}

	if err := h.service.DeleteApiKey(r.Context(), claims.UserID, id); err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, "API Key revoked and deleted", nil)
}
