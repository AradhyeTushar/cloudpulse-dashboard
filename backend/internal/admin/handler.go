package admin

import (
	"net/http"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetOverview(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok || claims == nil || (claims.Role != "admin" && claims.Role != "owner") {
		response.Forbidden(w, "Administrative access required")
		return
	}

	overview, err := h.service.GetOverview(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.Success(w, "System overview retrieved", overview)
}
