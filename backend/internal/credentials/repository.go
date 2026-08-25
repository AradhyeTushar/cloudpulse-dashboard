package credentials

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound = errors.New("credential record not found")
)

type Repository interface {
	// Proxy Credentials
	CreateProxyCredential(ctx context.Context, cred *ProxyCredential) error
	GetProxyCredentialByID(ctx context.Context, id string) (*ProxyCredential, error)
	ListProxyCredentials(ctx context.Context, userID string) ([]*ProxyCredential, error)
	UpdateProxyCredential(ctx context.Context, cred *ProxyCredential) error
	DeleteProxyCredential(ctx context.Context, userID, id string) error

	// API Keys
	CreateApiKey(ctx context.Context, key *ApiKey) error
	GetApiKeyByHash(ctx context.Context, secretHash string) (*ApiKey, error)
	ListApiKeys(ctx context.Context, userID string) ([]*ApiKey, error)
	DeleteApiKey(ctx context.Context, userID, id string) error
}

type postgresRepo struct {
	pool *pgxpool.Pool
}

type memoryRepo struct {
	mu          sync.RWMutex
	proxyCreds  map[string]*ProxyCredential
	apiKeys     map[string]*ApiKey
}

func NewRepository(pool *pgxpool.Pool) Repository {
	if pool != nil {
		return &postgresRepo{pool: pool}
	}
	return NewMemoryRepository()
}

func NewMemoryRepository() Repository {
	return &memoryRepo{
		proxyCreds: make(map[string]*ProxyCredential),
		apiKeys:    make(map[string]*ApiKey),
	}
}

// PostgreSQL Implementation
func (r *postgresRepo) CreateProxyCredential(ctx context.Context, c *ProxyCredential) error {
	query := `
		INSERT INTO proxy_credentials 
		(id, user_id, name, proxy_type, protocol, rotation_mode, session_duration_min, target_country, target_country_code, target_state, target_city, username, password_hash, plain_password, ip_whitelist, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`
	_, err := r.pool.Exec(ctx, query,
		c.ID, c.UserID, c.Name, c.ProxyType, c.Protocol, c.RotationMode, c.SessionDurationMin,
		c.TargetCountry, c.TargetCountryCode, c.TargetState, c.TargetCity,
		c.Username, c.PasswordHash, c.PlainPassword, c.IPWhitelist, c.Status, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *postgresRepo) GetProxyCredentialByID(ctx context.Context, id string) (*ProxyCredential, error) {
	query := `SELECT id, user_id, name, proxy_type, protocol, rotation_mode, session_duration_min, target_country, target_country_code, target_state, target_city, username, plain_password, ip_whitelist, status, created_at, updated_at FROM proxy_credentials WHERE id = $1`
	var c ProxyCredential
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.Name, &c.ProxyType, &c.Protocol, &c.RotationMode, &c.SessionDurationMin,
		&c.TargetCountry, &c.TargetCountryCode, &c.TargetState, &c.TargetCity,
		&c.Username, &c.PlainPassword, &c.IPWhitelist, &c.Status, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, ErrNotFound
	}
	c.Host = "pr.cloudpulse.net"
	c.Port = 8000
	if c.Protocol == "socks5" {
		c.Port = 1080
	}
	return &c, nil
}

func (r *postgresRepo) ListProxyCredentials(ctx context.Context, userID string) ([]*ProxyCredential, error) {
	query := `SELECT id, user_id, name, proxy_type, protocol, rotation_mode, session_duration_min, target_country, target_country_code, target_state, target_city, username, plain_password, ip_whitelist, status, created_at, updated_at FROM proxy_credentials WHERE user_id = $1 OR $1 = '' ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*ProxyCredential
	for rows.Next() {
		var c ProxyCredential
		if err := rows.Scan(
			&c.ID, &c.UserID, &c.Name, &c.ProxyType, &c.Protocol, &c.RotationMode, &c.SessionDurationMin,
			&c.TargetCountry, &c.TargetCountryCode, &c.TargetState, &c.TargetCity,
			&c.Username, &c.PlainPassword, &c.IPWhitelist, &c.Status, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		c.Host = "pr.cloudpulse.net"
		c.Port = 8000
		if c.Protocol == "socks5" {
			c.Port = 1080
		}
		result = append(result, &c)
	}
	return result, nil
}

func (r *postgresRepo) UpdateProxyCredential(ctx context.Context, c *ProxyCredential) error {
	query := `
		UPDATE proxy_credentials 
		SET username = $2, password_hash = $3, plain_password = $4, status = $5, updated_at = $6
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, c.ID, c.Username, c.PasswordHash, c.PlainPassword, c.Status, time.Now())
	return err
}

func (r *postgresRepo) DeleteProxyCredential(ctx context.Context, userID, id string) error {
	query := `DELETE FROM proxy_credentials WHERE id = $1 AND (user_id = $2 OR $2 = '')`
	_, err := r.pool.Exec(ctx, query, id, userID)
	return err
}

func (r *postgresRepo) CreateApiKey(ctx context.Context, k *ApiKey) error {
	query := `INSERT INTO api_keys (id, user_id, name, prefix, secret_hash, scopes, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.pool.Exec(ctx, query, k.ID, k.UserID, k.Name, k.Prefix, k.SecretHash, k.Scopes, k.ExpiresAt, k.CreatedAt)
	return err
}

func (r *postgresRepo) GetApiKeyByHash(ctx context.Context, secretHash string) (*ApiKey, error) {
	query := `SELECT id, user_id, name, prefix, secret_hash, scopes, last_used_at, expires_at, created_at FROM api_keys WHERE secret_hash = $1`
	var k ApiKey
	err := r.pool.QueryRow(ctx, query, secretHash).Scan(&k.ID, &k.UserID, &k.Name, &k.Prefix, &k.SecretHash, &k.Scopes, &k.LastUsedAt, &k.ExpiresAt, &k.CreatedAt)
	if err != nil {
		return nil, ErrNotFound
	}
	return &k, nil
}

func (r *postgresRepo) ListApiKeys(ctx context.Context, userID string) ([]*ApiKey, error) {
	query := `SELECT id, user_id, name, prefix, scopes, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = $1 OR $1 = '' ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*ApiKey
	for rows.Next() {
		var k ApiKey
		if err := rows.Scan(&k.ID, &k.UserID, &k.Name, &k.Prefix, &k.Scopes, &k.LastUsedAt, &k.ExpiresAt, &k.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, &k)
	}
	return result, nil
}

func (r *postgresRepo) DeleteApiKey(ctx context.Context, userID, id string) error {
	query := `DELETE FROM api_keys WHERE id = $1 AND (user_id = $2 OR $2 = '')`
	_, err := r.pool.Exec(ctx, query, id, userID)
	return err
}

// In-Memory Implementation
func (m *memoryRepo) CreateProxyCredential(_ context.Context, c *ProxyCredential) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.proxyCreds[c.ID] = c
	return nil
}

func (m *memoryRepo) GetProxyCredentialByID(_ context.Context, id string) (*ProxyCredential, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	c, exists := m.proxyCreds[id]
	if !exists {
		return nil, ErrNotFound
	}
	return c, nil
}

func (m *memoryRepo) ListProxyCredentials(_ context.Context, userID string) ([]*ProxyCredential, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var result []*ProxyCredential
	for _, c := range m.proxyCreds {
		if c.UserID == userID || userID == "" {
			result = append(result, c)
		}
	}
	return result, nil
}

func (m *memoryRepo) UpdateProxyCredential(_ context.Context, c *ProxyCredential) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.proxyCreds[c.ID] = c
	return nil
}

func (m *memoryRepo) DeleteProxyCredential(_ context.Context, userID, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	c, exists := m.proxyCreds[id]
	if !exists || (c.UserID != userID && userID != "") {
		return ErrNotFound
	}
	delete(m.proxyCreds, id)
	return nil
}

func (m *memoryRepo) CreateApiKey(_ context.Context, k *ApiKey) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.apiKeys[k.ID] = k
	return nil
}

func (m *memoryRepo) GetApiKeyByHash(_ context.Context, secretHash string) (*ApiKey, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, k := range m.apiKeys {
		if k.SecretHash == secretHash {
			return k, nil
		}
	}
	return nil, ErrNotFound
}

func (m *memoryRepo) ListApiKeys(_ context.Context, userID string) ([]*ApiKey, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var result []*ApiKey
	for _, k := range m.apiKeys {
		if k.UserID == userID || userID == "" {
			result = append(result, k)
		}
	}
	return result, nil
}

func (m *memoryRepo) DeleteApiKey(_ context.Context, userID, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	k, exists := m.apiKeys[id]
	if !exists || (k.UserID != userID && userID != "") {
		return ErrNotFound
	}
	delete(m.apiKeys, id)
	return nil
}
