-- CloudPulse PostgreSQL Initial Schema Migration (000001_init_schema.up.sql)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user', -- user, admin, owner
    workspace_name VARCHAR(255) DEFAULT 'Default Workspace',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_credentials (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(16) NOT NULL,
    secret_hash VARCHAR(64) NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    bandwidth_gb INT NOT NULL DEFAULT 50,
    threads_limit INT NOT NULL DEFAULT 500,
    dedicated_pools BOOLEAN DEFAULT FALSE,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS proxy_endpoints (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proxy_type VARCHAR(32) NOT NULL, -- residential, datacenter, mobile, isp
    protocol VARCHAR(16) NOT NULL DEFAULT 'http', -- http, https, socks5
    rotation_mode VARCHAR(32) NOT NULL DEFAULT 'rotating', -- sticky, rotating
    session_duration_min INT DEFAULT 10,
    country_code VARCHAR(8) DEFAULT 'all',
    state_code VARCHAR(32),
    city_name VARCHAR(64),
    username VARCHAR(64) NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sticky_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint_id VARCHAR(64) REFERENCES proxy_endpoints(id) ON DELETE SET NULL,
    assigned_ip VARCHAR(45) NOT NULL,
    country_code VARCHAR(8) NOT NULL,
    datacenter VARCHAR(64),
    duration_seconds INT DEFAULT 0,
    bytes_in BIGINT DEFAULT 0,
    bytes_out BIGINT DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bytes_in BIGINT DEFAULT 0,
    bytes_out BIGINT DEFAULT 0,
    requests_count INT DEFAULT 0,
    target_domain VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abuse_rules (
    id VARCHAR(64) PRIMARY KEY,
    target_type VARCHAR(32) NOT NULL, -- ip, user, domain
    target_value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    action VARCHAR(32) NOT NULL DEFAULT 'block', -- block, rate_limit, flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
