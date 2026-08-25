package plans

import (
	"encoding/json"
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

func (h *Handler) ListPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := h.service.ListPlans(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.Success(w, "Plans retrieved", plans)
}

func (h *Handler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	userID := "usr_customer_alex"
	if claims, ok := r.Context().Value("claims").(*auth.Claims); ok && claims != nil && claims.UserID != "" {
		userID = claims.UserID
	}

	subs, err := h.service.ListSubscriptions(r.Context(), userID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.Success(w, "Subscriptions retrieved", subs)
}

type CreateSubRequest struct {
	PlanID        string `json:"plan_id"`
	PaymentMethod string `json:"payment_method"`
}

func (h *Handler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	userID := "usr_customer_alex"
	if claims, ok := r.Context().Value("claims").(*auth.Claims); ok && claims != nil && claims.UserID != "" {
		userID = claims.UserID
	}

	var req CreateSubRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid JSON payload")
		return
	}

	sub, err := h.service.CreateSubscription(r.Context(), userID, req.PlanID, req.PaymentMethod)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, "Subscription created", sub)
}
