#!/usr/bin/env bash
# ==============================================================================
# CloudPulse Platform: Reset All User Login Data & Proxies
# ==============================================================================
set -e

echo "================================================================="
echo "🔄 Resetting CloudPulse User Login Data & Proxy Credentials..."
echo "================================================================="

# 1. Truncate PostgreSQL tables
echo "[1/3] Truncating database tables in PostgreSQL..."
docker compose exec -T postgres psql -U postgres -d cloudpulse << 'EOF'
TRUNCATE TABLE 
    sessions,
    api_keys,
    proxy_credentials,
    proxy_usage,
    subscriptions,
    audit_logs,
    abuse_events,
    users 
CASCADE;
EOF

# 2. Flush Redis Cache
echo "[2/3] Flushing Redis in-memory cache..."
docker compose exec -T redis redis-cli flushall || true

# 3. Restart Backend to re-seed clean default accounts
echo "[3/3] Restarting Backend API to seed clean default accounts..."
docker compose restart backend

echo "Waiting for Backend API to become ready..."
sleep 3

echo "================================================================="
echo "✅ RESET COMPLETE!"
echo ""
echo "Seeded Clean Accounts:"
echo "1) Customer (Proxy Dashboard):"
echo "   Email:    alex.mercer@cloudinfra.io"
echo "   Password: Password123!"
echo "   Proxy:    cp_1638ac43"
echo ""
echo "2) Super Administrator (Admin Ops):"
echo "   Email:    admin.operator@cloudpulse.io"
echo "   Password: AdminSecurePass123!"
echo "   Proxy:    cp_b5033187"
echo "================================================================="
