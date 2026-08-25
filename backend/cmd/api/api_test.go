package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/credentials"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/users"
	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/pkg/middleware"
	"github.com/go-chi/chi/v5"
)

func TestFullAuthenticationAndProxyCredentialFlow(t *testing.T) {
	// 1. Setup in-memory router with identical handler wiring
	tokenService := auth.NewTokenService("test_secret_key_32_bytes_super_secure!", time.Hour)
	userRepo := users.NewMemoryRepository()
	userService := users.NewService(userRepo, tokenService)
	userHandler := users.NewHandler(userService)

	credRepo := credentials.NewMemoryRepository()
	credService := credentials.NewService(credRepo)
	credHandler := credentials.NewHandler(credService)

	r := chi.NewRouter()
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", userHandler.Register)
		r.Post("/auth/login", userHandler.Login)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(tokenService, credService))
			r.Post("/proxy-credentials", credHandler.CreateProxyCredential)
			r.Get("/proxy-credentials", credHandler.ListProxyCredentials)
		})
	})

	server := httptest.NewServer(r)
	defer server.Close()

	// STEP 1: POST /api/v1/auth/register
	regPayload := map[string]string{
		"name":     "Dev Tester",
		"email":    "dev.tester@cloudpulse.io",
		"password": "Password123!",
	}
	regBytes, _ := json.Marshal(regPayload)
	regResp, err := http.Post(server.URL+"/api/v1/auth/register", "application/json", bytes.NewReader(regBytes))
	if err != nil {
		t.Fatalf("Register request failed: %v", err)
	}
	if regResp.StatusCode != http.StatusCreated {
		t.Fatalf("Expected status 201 Created on register, got %d", regResp.StatusCode)
	}

	// STEP 2: POST /api/v1/auth/login
	loginPayload := map[string]string{
		"email":    "dev.tester@cloudpulse.io",
		"password": "Password123!",
	}
	loginBytes, _ := json.Marshal(loginPayload)
	loginResp, err := http.Post(server.URL+"/api/v1/auth/login", "application/json", bytes.NewReader(loginBytes))
	if err != nil {
		t.Fatalf("Login request failed: %v", err)
	}
	if loginResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 OK on login, got %d", loginResp.StatusCode)
	}

	var loginResult struct {
		Success bool `json:"success"`
		Data    struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	_ = json.NewDecoder(loginResp.Body).Decode(&loginResult)
	token := loginResult.Data.Token
	if token == "" {
		t.Fatalf("Expected non-empty JWT token from login")
	}

	// STEP 3: POST /api/v1/proxy-credentials (with Bearer token)
	proxyPayload := map[string]interface{}{
		"name":                 "US Production Scraper",
		"proxy_type":           "residential",
		"protocol":             "http",
		"rotation_mode":        "sticky",
		"session_duration_min": 15,
		"target_country":       "United States",
		"target_country_code":  "US",
	}
	proxyBytes, _ := json.Marshal(proxyPayload)
	req, _ := http.NewRequest("POST", server.URL+"/api/v1/proxy-credentials", bytes.NewReader(proxyBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	proxyResp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Create proxy credentials request failed: %v", err)
	}
	if proxyResp.StatusCode != http.StatusCreated {
		t.Fatalf("Expected status 201 Created on proxy-credentials, got %d", proxyResp.StatusCode)
	}

	var proxyResult struct {
		Success bool `json:"success"`
		Data    struct {
			ID       string `json:"id"`
			Username string `json:"username"`
			Password string `json:"password"`
			Host     string `json:"host"`
			Port     int    `json:"port"`
		} `json:"data"`
	}
	_ = json.NewDecoder(proxyResp.Body).Decode(&proxyResult)
	if proxyResult.Data.Username == "" || proxyResult.Data.Password == "" {
		t.Fatalf("Expected generated username & password for proxy credential, got %+v", proxyResult.Data)
	}

	// STEP 4: GET /api/v1/proxy-credentials
	listReq, _ := http.NewRequest("GET", server.URL+"/api/v1/proxy-credentials", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listResp, err := client.Do(listReq)
	if err != nil {
		t.Fatalf("List proxy credentials request failed: %v", err)
	}
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 OK on listing proxy-credentials, got %d", listResp.StatusCode)
	}

	var listResult struct {
		Success bool                       `json:"success"`
		Data    []credentials.ProxyCredential `json:"data"`
	}
	_ = json.NewDecoder(listResp.Body).Decode(&listResult)
	if len(listResult.Data) != 1 {
		t.Fatalf("Expected 1 proxy credential row in list, got %d", len(listResult.Data))
	}
	if listResult.Data[0].Username != proxyResult.Data.Username {
		t.Fatalf("Expected username %s, got %s", proxyResult.Data.Username, listResult.Data[0].Username)
	}
}
