# 🛡️ CloudPulse Security, Firewall & Invalidation Architecture

## 1. Network Boundary & Firewall Rules

In production, only the minimum necessary public boundary ports are exposed:

| Service | Public Port | Transport | Protection Mechanism |
| :--- | :--- | :--- | :--- |
| **Web Dashboard & API** | None (or 80/443) | HTTPS | **Cloudflare Tunnel (`cloudflared`)** / NGINX TLS Reverse Proxy |
| **Proxy Gateway** | `8000` | HTTP / CONNECT | CloudPulse Auth Gate, Atomic Redis Limits, Local Policy Cache |
| **PostgreSQL** | **Closed (Internal)** | TCP :5432 | Internal Docker Bridge (`cloudpulse-internal`) |
| **Redis** | **Closed (Internal)** | TCP :6379 | Internal Docker Bridge (`cloudpulse-internal`) |
| **Control Plane API** | **Closed (Internal)** | HTTP :8080 | Internal Docker Bridge (`cloudpulse-internal`) |
| **Prometheus / Grafana** | **Closed (Internal)** | HTTP :9090/:3000 | Private Admin Access Only |

---

## 2. Cloudflare Tunnel Ingress Architecture

```text
INTERNET
   │
   ▼
CLOUDFLARE EDGE
   │
   ▼ (Outbound Encrypted Tunnel)
[ cloudflared Connector ]
   │
   ▼ (cloudpulse-internal network)
[ NGINX TLS Reverse Proxy ]
   ├── /api/ ──► [ Go API :8080 ]
   └── / ──────► [ React SPA Frontend ]
```

### Proxy Transport Distinction
* **Web Application & REST API**: Tunneled securely via Cloudflare Tunnel (`app.yourdomain.com`, `api.yourdomain.com`).
* **High-Throughput Proxy Gateway**: Directly bound to `proxy.yourdomain.com:8000` using standard HTTP CONNECT proxy transport. Standard Cloudflare HTTP CDN caching/tunneling is bypassed for proxy traffic to guarantee ultra-low latency, persistent TCP streams, and avoid proxy packet drop.

---

## 3. Secret Isolation & Zero-Leakage Policy

* **Upstream Provider Secrets**: Injected via environment variables into `backend` and never stored in the database, customer API responses, Redis session cache, Prometheus labels, or log outputs.
* **Timing Attack Prevention**: Constant-time secret comparison (`crypto/subtle.ConstantTimeCompare`) on all authentication tokens.
* **Non-Root Containers**: Backend and Gateway containers run under unprivileged user `nobody:nogroup` (`65534:65534`).
* **Real-time Invalidation**: Redis Pub/Sub policy invalidation evicts suspended users or modified credentials across all gateway instances within milliseconds.
