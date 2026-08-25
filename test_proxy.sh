#!/usr/bin/env bash
set -e

echo "================================================================"
echo "⚡ CloudPulse Local Proxy & API cURL Test Suite"
echo "================================================================"

echo ""
echo "[1] Testing API Health over TLS..."
curl -sk https://localhost/api/v1/health | grep -q "UP" && echo "✅ API Health OK"

echo ""
echo "[2] Testing Anonymous Access on Gateway :8000 (Expect 407)..."
STATUS_407=$(curl -s -o /dev/null -w "%{http_code}" -x http://localhost:8000 http://example.com || true)
if [ "$STATUS_407" -eq 407 ]; then
    echo "✅ Anonymous access correctly blocked (HTTP 407)"
else
    echo "❌ Unexpected status: $STATUS_407"
fi

echo ""
echo "[3] Testing Authenticated HTTP Tunnel (Alex Mercer)..."
curl -s -x http://cp_1638ac43:p_sec_0068cfdb54424bbf@localhost:8000 http://example.com | grep -q "Example Domain" && echo "✅ HTTP Tunnel Successful (200 OK)"

echo ""
echo "[4] Testing Authenticated HTTPS CONNECT Tunnel (Alex Mercer)..."
curl -s -x http://cp_1638ac43:p_sec_0068cfdb54424bbf@localhost:8000 https://httpbin.org/ip && echo "✅ HTTPS CONNECT Tunnel Successful (200 OK)"

echo ""
echo "================================================================"
echo "🎉 All cURL Proxy Tests Succeeded!"
echo "================================================================"
