package upstream

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/gateway/internal/policy"
)

type ControlPlaneClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewControlPlaneClient(baseURL string, timeout time.Duration) *ControlPlaneClient {
	return &ControlPlaneClient{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: timeout},
	}
}

type AuthRequest struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ClientIP      string `json:"client_ip"`
	TargetHost    string `json:"target_host"`
	TargetPort    int    `json:"target_port"`
	TargetCountry string `json:"target_country,omitempty"`
	Protocol      string `json:"protocol"`
}

func (c *ControlPlaneClient) Authorize(ctx context.Context, req *AuthRequest) (*policy.Decision, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/v1/internal/proxy/authorize", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Success  bool            `json:"success"`
		Decision policy.Decision `json:"decision"`
		Data     policy.Decision `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Decision.StatusCode != 0 {
		return &result.Decision, nil
	}
	return &result.Data, nil
}

func (c *ControlPlaneClient) ReportAbuse(userID, clientIP, domain, reason, severity string) {
	go func() {
		payload := map[string]interface{}{
			"user_id":       userID,
			"client_ip":     clientIP,
			"target_domain": domain,
			"reason":        reason,
			"severity":      severity,
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", c.baseURL+"/api/v1/internal/proxy/abuse-event", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := c.httpClient.Do(req)
		if err == nil {
			_ = resp.Body.Close()
		}
	}()
}
