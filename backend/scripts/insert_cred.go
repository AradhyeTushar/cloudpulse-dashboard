package main

import (
	"context"
	"fmt"
	"os"

	"github.com/AradhyeTushar/cloudpulse-dashboard/backend/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	hash, err := auth.HashPassword("p_sec_nweye7jm", nil)
	if err != nil {
		fmt.Println("Hash error:", err)
		os.Exit(1)
	}

	ctx := context.Background()
	connStr := "postgres://postgres:postgrespassword@localhost:5432/cloudpulse?sslmode=disable"
	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		fmt.Println("Conn error:", err)
		os.Exit(1)
	}
	defer pool.Close()

	_, err = pool.Exec(ctx, `
		INSERT INTO proxy_credentials (id, user_id, name, proxy_type, protocol, rotation_mode, session_duration_min, target_country, target_country_code, username, password_hash, plain_password, status)
		VALUES ('pcred_5lctq8', 'usr_4771fdba-286', 'Custom Proxy Endpoint', 'residential', 'http', 'rotating', 10, 'United States', 'US', 'cp_5lctq8', $1, 'p_sec_nweye7jm', 'active')
		ON CONFLICT (username) DO UPDATE SET password_hash = $1, plain_password = 'p_sec_nweye7jm', status = 'active'
	`, hash)
	if err != nil {
		fmt.Println("Exec error:", err)
		os.Exit(1)
	}
	fmt.Println("✅ Inserted cp_5lctq8 successfully into PostgreSQL!")
}
