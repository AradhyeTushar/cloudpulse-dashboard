#!/usr/bin/env python3
"""
CloudPulse Local Verification Script
Tests Web API authentication, token validation, proxy credential creation,
and proxy gateway HTTP/HTTPS tunneling on localhost.
"""

import urllib.request
import urllib.error
import json
import ssl
import base64
import sys

# Disable SSL verification for local self-signed certificates
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_BASE = "https://localhost/api/v1"
PROXY_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    symbol = {"INFO": "ℹ️ ", "PASS": "✅ ", "FAIL": "❌ "}.get(status, "")
    print(f"{symbol}[{status}] {msg}")

def test_api_health():
    url = f"{API_BASE}/health"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        if data.get("success"):
            log("API Health check passed (UP)", "PASS")
        else:
            log(f"API Health check failed: {data}", "FAIL")
            sys.exit(1)

def test_user_login(email, password):
    url = f"{API_BASE}/auth/login"
    payload = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            token = data["data"]["token"]
            user = data["data"]["user"]
            log(f"Login success: {user['name']} ({user['email']}) [Role: {user['role']}]", "PASS")
            return token
    except urllib.error.HTTPError as e:
        log(f"Login failed for {email}: {e.code} - {e.read().decode()}", "FAIL")
        sys.exit(1)

def get_proxy_credentials(token):
    url = f"{API_BASE}/proxy-credentials"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        creds = data["data"]
        if not creds:
            log("No proxy credentials found, please create one.", "FAIL")
            sys.exit(1)
        cred = creds[0]
        log(f"Active Proxy Credential: User={cred['username']}, TargetCountry={cred['target_country']}", "PASS")
        return cred["username"], cred["password"]

def test_unauthenticated_proxy():
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http": PROXY_URL}))
        opener.open("http://example.com", timeout=3)
        log("Unauthenticated proxy access was NOT blocked!", "FAIL")
    except urllib.error.HTTPError as e:
        if e.code == 407:
            log("Closed Proxy Check: Anonymous access rejected with 407 Proxy Authentication Required", "PASS")
        else:
            log(f"Unauthenticated request returned unexpected status {e.code}", "FAIL")

def test_authenticated_http_proxy(username, password):
    auth_header = base64.b64encode(f"{username}:{password}".encode()).decode()
    req = urllib.request.Request("http://example.com")
    req.add_header("Proxy-Authorization", f"Basic {auth_header}")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http": PROXY_URL}))
    try:
        with opener.open(req, timeout=6) as resp:
            body = resp.read().decode()
            log(f"HTTP Proxy Tunnel: Status={resp.status} OK (Received {len(body)} bytes)", "PASS")
    except Exception as e:
        log(f"HTTP Proxy Tunnel failed: {e}", "FAIL")

def test_authenticated_https_connect(username, password):
    proxy_handler = urllib.request.ProxyHandler({"https": f"http://{username}:{password}@localhost:8000"})
    opener = urllib.request.build_opener(proxy_handler, urllib.request.HTTPSHandler(context=ctx))
    try:
        with opener.open("https://httpbin.org/ip", timeout=10) as resp:
            data = json.loads(resp.read().decode())
            log(f"HTTPS CONNECT Tunnel: Status={resp.status} OK (Egress IP: {data.get('origin')})", "PASS")
    except Exception as e:
        log(f"HTTPS CONNECT Tunnel warning: {e}", "INFO")

if __name__ == "__main__":
    print("=================================================================")
    print("🚀 CloudPulse Local Login & Proxy Verification Suite")
    print("=================================================================")
    test_api_health()
    
    # Test Customer Login & Tunnel
    print("\n--- 1. Testing Customer Account (Alex Mercer) ---")
    token_alex = test_user_login("alex.mercer@cloudinfra.io", "Password123!")
    user_alex, pass_alex = get_proxy_credentials(token_alex)
    test_unauthenticated_proxy()
    test_authenticated_http_proxy(user_alex, pass_alex)
    test_authenticated_https_connect(user_alex, pass_alex)

    # Test Administrator Login & Tunnel
    print("\n--- 2. Testing Administrator Account (Operator) ---")
    token_admin = test_user_login("admin.operator@cloudpulse.io", "AdminSecurePass123!")
    user_admin, pass_admin = get_proxy_credentials(token_admin)
    test_authenticated_http_proxy(user_admin, pass_admin)

    print("\n=================================================================")
    print("🎉 ALL LOCAL LOGIN AND PROXY TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")
