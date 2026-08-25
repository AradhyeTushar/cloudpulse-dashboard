package controlplane

import (
	"encoding/json"
	"net/http"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
)

type Handler struct {
	service *ControlPlaneService
}

func NewHandler(service *ControlPlaneService) *Handler {
	return &Handler{service: service}
}

// Authorize handles incoming proxy connection authorization requests from the gateway
func (h *Handler) Authorize(w http.ResponseWriter, r *http.Request) {
	var req ProxyAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON proxy authorization request")
		return
	}

	decision, err := h.service.AuthorizeProxyRequest(r.Context(), &req)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	if !decision.Allowed {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(decision.StatusCode)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  false,
			"decision": decision,
		})
		return
	}

	response.Success(w, "Proxy connection authorized", decision)
}

// Release handles concurrency slot release when a proxy connection terminates
func (h *Handler) Release(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "Invalid payload")
		return
	}

	h.service.ReleaseConnection(payload.UserID)
	response.Success(w, "Connection released", nil)
}
