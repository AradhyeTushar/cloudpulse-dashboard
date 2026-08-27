package users

import (
	"bytes"
	"context"
	crand "crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/smtp"
	"strings"
	"sync"
	"time"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidOTP        = errors.New("invalid or expired verification code")
)

type Service struct {
	repo         Repository
	tokenService *auth.TokenService
	redisClient  *redis.Client
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPass     string
	smtpFrom     string
	resendApiKey string
	emailFrom    string
	pendingOTP   sync.Map
}

func NewService(repo Repository, tokenService *auth.TokenService) *Service {
	return &Service{
		repo:         repo,
		tokenService: tokenService,
	}
}

func (s *Service) SetRedisClient(rClient *redis.Client) {
	s.redisClient = rClient
}

func (s *Service) SetSMTPConfig(host, port, user, pass, from string) {
	s.smtpHost = host
	s.smtpPort = port
	s.smtpUser = user
	s.smtpPass = pass
	s.smtpFrom = from
}

func (s *Service) SetResendConfig(apiKey, from string) {
	s.resendApiKey = strings.TrimSpace(apiKey)
	if from != "" {
		s.emailFrom = strings.TrimSpace(from)
	} else {
		s.emailFrom = "CloudPulse <onboarding@resend.dev>"
	}
}

func (s *Service) GetTokenService() *auth.TokenService {
	return s.tokenService
}

func (s *Service) SendRegistrationOTP(ctx context.Context, req *SendOTPRequest) (string, error) {
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" || req.Password == "" {
		return "", errors.New("name, email, and password are required")
	}

	if len(req.Password) < 8 {
		return "", errors.New("password must be at least 8 characters long")
	}

	if req.ConfirmPassword != "" && req.Password != req.ConfirmPassword {
		return "", errors.New("passwords do not match")
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if account already exists
	if _, err := s.repo.GetByEmail(ctx, cleanEmail); err == nil {
		return "", ErrUserAlreadyExists
	}

	// Generate secure 6-digit numeric OTP
	n, err := crand.Int(crand.Reader, big.NewInt(900000))
	if err != nil {
		return "", fmt.Errorf("failed to generate verification code: %w", err)
	}
	otp := fmt.Sprintf("%06d", n.Int64()+100000)

	// Hash password securely with Argon2id
	hash, err := auth.HashPassword(req.Password, nil)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	pending := &RegistrationPending{
		Name:         strings.TrimSpace(req.Name),
		Email:        cleanEmail,
		PasswordHash: hash,
		OTP:          otp,
		CreatedAt:    time.Now().Unix(),
	}

	// Store in Redis with 10-minute expiry
	if s.redisClient != nil {
		data, err := json.Marshal(pending)
		if err == nil {
			_ = s.redisClient.Set(ctx, "otp:reg:"+cleanEmail, data, 10*time.Minute).Err()
		}
	}
	// Also store in memory fallback
	s.pendingOTP.Store(cleanEmail, pending)

	// Dispatch email
	go s.dispatchOTPEmail(cleanEmail, pending.Name, otp)

	log.Printf("[REGISTRATION OTP] Verification code for %s (%s) is: %s", pending.Name, cleanEmail, otp)
	return otp, nil
}

func (s *Service) dispatchOTPEmail(to, name, otp string) {
	// 1. Try Resend HTTP API first if key provided
	if s.resendApiKey != "" {
		if err := s.dispatchViaResend(to, name, otp); err == nil {
			return
		}
	}

	// 2. Try standard SMTP if configured
	if s.smtpHost != "" && s.smtpUser != "" {
		auth := smtp.PlainAuth("", s.smtpUser, s.smtpPass, s.smtpHost)
		subject := "Your CloudPulse Verification Code: " + otp
		from := s.smtpFrom
		if from == "" {
			from = s.smtpUser
		}

		body := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n"+
			`<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px;">
    <h2 style="color: #6366f1; margin-top: 0;">CloudPulse Verification</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello %s,</p>
    <p style="color: #cbd5e1; font-size: 15px;">Thank you for creating an account with CloudPulse. Use the following 6-digit one-time verification code to complete your registration:</p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);">%s</span>
    </div>
    <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this code, please disregard this message.</p>
  </div>
</body>
</html>`, from, to, subject, name, otp)

		addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
		if err := smtp.SendMail(addr, auth, from, []string{to}, []byte(body)); err != nil {
			log.Printf("[EMAIL OTP ERROR] Failed to send email via SMTP (%s): %v", addr, err)
		} else {
			log.Printf("[EMAIL OTP SUCCESS] Delivered verification email to %s via SMTP", to)
			return
		}
	}

	log.Printf("[EMAIL OTP] Fallback Code for %s (%s) is: %s", name, to, otp)
}

func (s *Service) dispatchViaResend(to, name, otp string) error {
	from := s.emailFrom
	if from == "" {
		from = "CloudPulse <onboarding@resend.dev>"
	}

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px;">
    <h2 style="color: #6366f1; margin-top: 0; font-size: 24px;">CloudPulse Verification</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello %s,</p>
    <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Thank you for registering with CloudPulse. Enter the 6-digit verification code below to verify your email and activate your account:</p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 14px 28px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">%s</span>
    </div>
    <p style="color: #64748b; font-size: 13px;">This security code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
  </div>
</body>
</html>`, name, otp)

	sendEmail := func(targetTo string, subjPrefix string) (int, string, error) {
		payload := map[string]any{
			"from":    from,
			"to":      []string{targetTo},
			"subject": fmt.Sprintf("%sYour CloudPulse Verification Code: %s", subjPrefix, otp),
			"html":    htmlBody,
		}

		bodyBytes, err := json.Marshal(payload)
		if err != nil {
			return 0, "", err
		}

		httpReq, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(bodyBytes))
		if err != nil {
			return 0, "", err
		}
		httpReq.Header.Set("Authorization", "Bearer "+s.resendApiKey)
		httpReq.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(httpReq)
		if err != nil {
			log.Printf("[RESEND ERROR] Failed to send via Resend API: %v", err)
			return 0, "", err
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		return resp.StatusCode, string(respBody), nil
	}

	statusCode, respBody, err := sendEmail(to, "")
	if err == nil && statusCode >= 200 && statusCode < 300 {
		log.Printf("[RESEND SUCCESS] Verification email sent to %s via Resend! ID response: %s", to, respBody)
		return nil
	}

	log.Printf("[RESEND NOTICE] Resend returned status %d: %s", statusCode, respBody)

	// If Resend free tier restriction blocked the recipient because domain is unverified:
	// Automatically route to the verified account owner email (aradhyetushar@gmail.com) so the user receives it!
	if strings.Contains(respBody, "You can only send testing emails to your own email address") {
		ownerEmail := "aradhyetushar@gmail.com"
		if startIdx := strings.Index(respBody, "("); startIdx != -1 {
			if endIdx := strings.Index(respBody[startIdx:], ")"); endIdx != -1 {
				extracted := strings.TrimSpace(respBody[startIdx+1 : startIdx+endIdx])
				if strings.Contains(extracted, "@") {
					ownerEmail = extracted
				}
			}
		}

		log.Printf("[RESEND ROUTING] Sending OTP email to verified Resend account email: %s", ownerEmail)
		sc, rb, oErr := sendEmail(ownerEmail, fmt.Sprintf("[For %s] ", to))
		if oErr == nil && sc >= 200 && sc < 300 {
			log.Printf("[RESEND SUCCESS] Successfully delivered OTP email to %s (intended for %s)! ID: %s", ownerEmail, to, rb)
			return nil
		}
	}

	return fmt.Errorf("resend status %d: %s", statusCode, respBody)
}

func (s *Service) VerifyRegistrationOTP(ctx context.Context, email, otp string) (*AuthResponse, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	cleanOTP := strings.TrimSpace(otp)

	if cleanEmail == "" || cleanOTP == "" {
		return nil, errors.New("email and verification code are required")
	}

	var pending *RegistrationPending

	// Try fetching from Redis first
	if s.redisClient != nil {
		data, err := s.redisClient.Get(ctx, "otp:reg:"+cleanEmail).Bytes()
		if err == nil {
			var p RegistrationPending
			if json.Unmarshal(data, &p) == nil {
				pending = &p
			}
		}
	}

	// Try in-memory fallback if not in Redis
	if pending == nil {
		if val, ok := s.pendingOTP.Load(cleanEmail); ok {
			pending = val.(*RegistrationPending)
		}
	}

	if pending == nil {
		return nil, ErrInvalidOTP
	}

	if pending.OTP != cleanOTP {
		return nil, errors.New("incorrect verification code")
	}

	// Create verified user in PostgreSQL
	user := &User{
		ID:            "usr_" + uuid.New().String()[:12],
		Name:          pending.Name,
		Email:         pending.Email,
		PasswordHash:  pending.PasswordHash,
		Role:          "user",
		WorkspaceName: pending.Name + "'s Workspace",
		Status:        "active",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		if errorsIs(err, ErrUserAlreadyExists) {
			return nil, ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("failed to create user account: %w", err)
	}

	// Delete used OTP
	if s.redisClient != nil {
		_ = s.redisClient.Del(ctx, "otp:reg:"+cleanEmail).Err()
	}
	s.pendingOTP.Delete(cleanEmail)

	token, expiresAt, err := s.tokenService.GenerateToken(user.ID, user.Email, user.Role, user.WorkspaceName)
	if err != nil {
		return nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	return &AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *Service) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return nil, errors.New("name, email, and password are required")
	}

	if _, err := s.repo.GetByEmail(ctx, req.Email); err == nil {
		return nil, ErrUserAlreadyExists
	}

	hash, err := auth.HashPassword(req.Password, nil)
	if err != nil {
		return nil, err
	}

	user := &User{
		ID:            "usr_" + uuid.New().String()[:12],
		Name:          req.Name,
		Email:         req.Email,
		PasswordHash:  hash,
		Role:          "owner",
		WorkspaceName: req.Name + "'s Workspace",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, expiresAt, err := s.tokenService.GenerateToken(user.ID, user.Email, user.Role, user.WorkspaceName)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *Service) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	match, err := auth.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !match {
		return nil, ErrInvalidCredentials
	}

	token, expiresAt, err := s.tokenService.GenerateToken(user.ID, user.Email, user.Role, user.WorkspaceName)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *Service) GetProfile(ctx context.Context, userID string) (*User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, req *UpdateProfileRequest) (*User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.WorkspaceName != "" {
		user.WorkspaceName = req.WorkspaceName
	}
	user.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) ChangePassword(ctx context.Context, userID string, req *ChangePasswordRequest) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	match, err := auth.VerifyPassword(req.CurrentPassword, user.PasswordHash)
	if err != nil || !match {
		return errors.New("current password does not match")
	}

	newHash, err := auth.HashPassword(req.NewPassword, nil)
	if err != nil {
		return err
	}

	user.PasswordHash = newHash
	user.UpdatedAt = time.Now()
	return s.repo.Update(ctx, user)
}
