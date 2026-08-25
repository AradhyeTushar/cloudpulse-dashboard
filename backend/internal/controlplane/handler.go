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

// ReportBatchTelemetry accepts aggregated bandwidth usage batches from gateway flush workers
func (h *Handler) ReportBatchTelemetry(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Batch []struct {
			UserID       string `json:"user_id"`
			CredentialID string `json:"credential_id"`
			BytesIn      int64  `json:"bytes_in"`
			BytesOut     int64  `json:"bytes_out"`
			Requests     int64  `json:"requests"`
			TargetDomain string `json:"target_domain"`
		} `json:"batch"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "Invalid telemetry batch payload")
		return
	}

	for _, item := range payload.Batch {
		_ = h.service.RecordTelemetry(r.Context(), item.UserID, item.CredentialID, item.BytesIn, item.BytesOut, item.TargetDomain)
	}
	response.Success(w, "Batch telemetry flushed successfully", nil)
}

// ReportTelemetry accepts bandwidth consumption telemetry from gateway (single-item fallback)
func (h *Handler) ReportTelemetry(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID       string `json:"user_id"`
		CredentialID string `json:"credential_id"`
		BytesIn      int64  `json:"bytes_in"`
		BytesOut     int64  `json:"bytes_out"`
		TargetDomain string `json:"target_domain"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "Invalid telemetry payload")
		return
	}

	_ = h.service.RecordTelemetry(r.Context(), payload.UserID, payload.CredentialID, payload.BytesIn, payload.BytesOut, payload.TargetDomain)
	response.Success(w, "Telemetry recorded", nil)
}

// ReportAbuse accepts security/rate limit violations from gateway
func (h *Handler) ReportAbuse(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		UserID       string `json:"user_id"`
		ClientIP     string `json:"client_ip"`
		TargetDomain string `json:"target_domain"`
		Reason       string `json:"reason"`
		Severity     string `json:"severity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "Invalid abuse payload")
		return
	}

	_ = h.service.RecordAbuseEvent(r.Context(), payload.UserID, payload.ClientIP, payload.TargetDomain, payload.Reason, payload.Severity)
	response.Success(w, "Abuse event logged", nil)
}
