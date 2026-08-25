-- CloudPulse Unified Database Schema Migration (000001_init_schema.up.sql)

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user', -- owner, admin, user
    workspace_name VARCHAR(255) DEFAULT 'Default Workspace',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, suspended, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. api_keys
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(24) NOT NULL,
    secret_hash VARCHAR(64) NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. proxy_credentials
CREATE TABLE IF NOT EXISTS proxy_credentials (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    proxy_type VARCHAR(32) NOT NULL DEFAULT 'residential', -- residential, datacenter, mobile, isp
    protocol VARCHAR(16) NOT NULL DEFAULT 'http', -- http, https, socks5
    rotation_mode VARCHAR(32) NOT NULL DEFAULT 'rotating', -- rotating, sticky
    session_duration_min INT DEFAULT 10,
    target_country VARCHAR(64) DEFAULT 'United States',
    target_country_code VARCHAR(8) DEFAULT 'US',
    target_state VARCHAR(64),
    target_city VARCHAR(64),
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plain_password VARCHAR(255),
    ip_whitelist TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. plans
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    price_per_gb NUMERIC(6,3) NOT NULL,
    bandwidth_gb INT NOT NULL DEFAULT 100,
    threads_limit INT NOT NULL DEFAULT 500,
    dedicated_pools BOOLEAN DEFAULT FALSE,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, past_due, canceled
    auto_renew BOOLEAN DEFAULT TRUE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(64) DEFAULT 'Credit Card',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. provider_accounts
CREATE TABLE IF NOT EXISTS provider_accounts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(64) NOT NULL, -- residential, datacenter, mobile
    api_key TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    cost_per_gb NUMERIC(6,3) NOT NULL DEFAULT 2.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. provider_endpoints
CREATE TABLE IF NOT EXISTS provider_endpoints (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    protocol VARCHAR(16) NOT NULL DEFAULT 'http',
    region VARCHAR(128) NOT NULL,
    country VARCHAR(64) NOT NULL,
    latency_ms INT NOT NULL DEFAULT 20,
    healthy BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. sessions (Customer session identity, decoupled from provider exit IP allocation)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(64) REFERENCES proxy_credentials(id) ON DELETE CASCADE,
    country VARCHAR(64) NOT NULL DEFAULT 'United States',
    rotation_mode VARCHAR(32) NOT NULL DEFAULT 'sticky', -- sticky, rotating
    provider_id VARCHAR(64) REFERENCES provider_accounts(id) ON DELETE SET NULL,
    provider_session_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, expired, revoked
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. proxy_usage
CREATE TABLE IF NOT EXISTS proxy_usage (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(64) REFERENCES proxy_credentials(id) ON DELETE SET NULL,
    session_id VARCHAR(64) REFERENCES sessions(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bytes_in BIGINT DEFAULT 0,
    bytes_out BIGINT DEFAULT 0,
    requests_count INT DEFAULT 0,
    target_domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. abuse_events
CREATE TABLE IF NOT EXISTS abuse_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    target_domain VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    action_taken VARCHAR(32) NOT NULL DEFAULT 'Blocked',
    severity VARCHAR(16) NOT NULL DEFAULT 'high',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. locations (Optional managed location directory)
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    country VARCHAR(64) NOT NULL,
    country_code VARCHAR(8) UNIQUE NOT NULL,
    flag VARCHAR(16) NOT NULL,
    region VARCHAR(64) NOT NULL,
    total_ips BIGINT NOT NULL DEFAULT 0,
    available_ips BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 25,
    status VARCHAR(32) NOT NULL DEFAULT 'optimal',
    active_nodes INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
