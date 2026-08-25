package users

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("a user with this email already exists")
)

type Repository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
	List(ctx context.Context, limit, offset int) ([]*User, error)
}

type postgresRepo struct {
	pool *pgxpool.Pool
}

type memoryRepo struct {
	mu    sync.RWMutex
	users map[string]*User
}

func NewRepository(pool *pgxpool.Pool) Repository {
	if pool != nil {
		return &postgresRepo{pool: pool}
	}
	return NewMemoryRepository()
}

func NewMemoryRepository() Repository {
	return &memoryRepo{
		users: make(map[string]*User),
	}
}

// PostgreSQL Implementation
func (r *postgresRepo) Create(ctx context.Context, u *User) error {
	query := `
		INSERT INTO users (id, name, email, password_hash, role, workspace_name, two_factor_enabled, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.pool.Exec(ctx, query, u.ID, u.Name, u.Email, u.PasswordHash, u.Role, u.WorkspaceName, u.TwoFactorEnabled, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*User, error) {
	query := `SELECT id, name, email, password_hash, role, workspace_name, two_factor_enabled, created_at, updated_at FROM users WHERE id = $1`
	var u User
	err := r.pool.QueryRow(ctx, query, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.WorkspaceName, &u.TwoFactorEnabled, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return &u, nil
}

func (r *postgresRepo) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, name, email, password_hash, role, workspace_name, two_factor_enabled, created_at, updated_at FROM users WHERE email = $1`
	var u User
	err := r.pool.QueryRow(ctx, query, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.WorkspaceName, &u.TwoFactorEnabled, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return &u, nil
}

func (r *postgresRepo) Update(ctx context.Context, u *User) error {
	query := `
		UPDATE users 
		SET name = $2, password_hash = $3, role = $4, workspace_name = $5, two_factor_enabled = $6, updated_at = $7
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, u.ID, u.Name, u.PasswordHash, u.Role, u.WorkspaceName, u.TwoFactorEnabled, time.Now())
	return err
}

func (r *postgresRepo) List(ctx context.Context, limit, offset int) ([]*User, error) {
	query := `SELECT id, name, email, role, workspace_name, two_factor_enabled, created_at, updated_at FROM users LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.WorkspaceName, &u.TwoFactorEnabled, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, &u)
	}
	return result, nil
}

// In-Memory Implementation for fallback/testing
func (r *memoryRepo) Create(_ context.Context, u *User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, existing := range r.users {
		if existing.Email == u.Email {
			return ErrUserAlreadyExists
		}
	}
	r.users[u.ID] = u
	return nil
}

func (r *memoryRepo) GetByID(_ context.Context, id string) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	u, exists := r.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (r *memoryRepo) GetByEmail(_ context.Context, email string) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, ErrUserNotFound
}

func (r *memoryRepo) Update(_ context.Context, u *User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[u.ID]; !exists {
		return ErrUserNotFound
	}
	r.users[u.ID] = u
	return nil
}

func (r *memoryRepo) List(_ context.Context, limit, offset int) ([]*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*User
	count := 0
	for _, u := range r.users {
		if count >= offset && len(result) < limit {
			result = append(result, u)
		}
		count++
	}
	return result, nil
}
