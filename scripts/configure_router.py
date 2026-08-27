#!/usr/bin/env python3
"""
Airtel Broadband Router Automation & Port Forwarding Manager
Automatically logs into 192.168.0.1 and manages port forwarding rules.
"""

import sys
import json
import urllib.request
import urllib.error
import ssl

ROUTER_BASE_URL = "https://192.168.0.1"

# Ignore self-signed SSL cert on local router
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def login(username="admin", password="admin"):
    url = f"{ROUTER_BASE_URL}/api/usersession/"
    payload = json.dumps({"login": username, "password": password, "logout": False}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="PUT")
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            session_token = data.get("sessionToken")
            cookie = resp.headers.get("Set-Cookie")
            print(f"✅ Logged in successfully! Session: {session_token}")
            return session_token
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return None

def get_active_wan(session_token):
    url = f"{ROUTER_BASE_URL}/api/wans/"
    req = urllib.request.Request(url, headers={"Cookie": f"session={session_token}"})
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        wans = json.loads(resp.read().decode("utf-8"))
        for wan in wans:
            if wan.get("enable") and "INTERNET" in wan.get("service", ""):
                return wan.get("id", 4)
    return 4

def list_port_forwardings(session_token, wan_id=4):
    url = f"{ROUTER_BASE_URL}/api/wans/{wan_id}/portforwardings/"
    req = urllib.request.Request(url, headers={"Cookie": f"session={session_token}"})
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

def add_port_forwarding(session_token, app_name, wan_port, lan_port, internal_ip="192.168.0.233", protocol="TCP", wan_id=4):
    url = f"{ROUTER_BASE_URL}/api/wans/{wan_id}/portforwardings/"
    payload = json.dumps({
        "appName": app_name,
        "wanPort": int(wan_port),
        "lanPort": int(lan_port),
        "internalClient": internal_ip,
        "enable": True,
        "protocol": protocol.upper()
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "Cookie": f"session={session_token}"}, method="POST")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  [+] Forwarded {app_name}: WAN {wan_port} ➔ {internal_ip}:{lan_port} ({protocol})")
            return data
    except Exception as e:
        print(f"  [-] Failed to forward {app_name}: {e}")
        return None

def main():
    print("==================================================")
    print("⚡ Airtel Router Port Forwarding Manager")
    print("==================================================")
    session = login("admin", "admin")
    if not session:
        sys.exit(1)
    
    wan_id = get_active_wan(session)
    print(f"Active Internet WAN Interface: #{wan_id}")
    
    rules = list_port_forwardings(session, wan_id)
    print(f"\nCurrent Active Rules ({len(rules)}):")
    for r in rules:
        print(f"  - ID {r.get('id')}: {r.get('appName')} | WAN:{r.get('wanPort')} ➔ {r.get('internalClient')}:{r.get('lanPort')} ({r.get('protocol')}) [Enabled: {r.get('enable')}]")
    print("==================================================")

if __name__ == "__main__":
    main()
