# 🚀 CloudPulse Production Deployment Guide

## 1. Production Architecture Overview

In production, CloudPulse deploys as an isolated Docker network stack:
* **Cloudflare Tunnel (`cloudflared`)**: Establishes outbound TLS tunnel connecting Cloudflare Edge to the internal NGINX container for Web/API traffic (`app.yourdomain.com`, `api.yourdomain.com`).
* **Proxy Gateway (`cloudpulse-gateway:8000`)**: Directly bound to public port `8000` for high-throughput authenticated HTTP CONNECT proxy traffic.
* **Internal Services**: PostgreSQL (`:5432`), Redis (`:6379`), Backend (`:8080`), Prometheus (`:9090`), and Grafana (`:3000`) have zero public port exposures.

---

## 2. Configuration & Secrets

Copy the configuration template:
```bash
cp .env.example .env
```

Populate the required secrets:
* `JWT_SECRET`: 32+ byte cryptographically random string.
* `DATABASE_URL`: Production PostgreSQL connection string.
* `REDIS_URL`: Production Redis instance URL.
* `RESIDENTIAL_PROVIDER_*`: Authorized upstream residential proxy provider credentials.
* `CLOUDFLARE_TUNNEL_TOKEN`: Named Cloudflare Tunnel token.

---

## 3. Starting the Production Stack

```bash
docker compose up -d --build
```

### Published Ports & Boundaries
| Service | Internal Port | Host Port | Ingress Method |
| :--- | :--- | :--- | :--- |
| `proxy-tls` | `80`, `443` | `80`, `443` | Direct HTTPS / Cloudflare Tunnel |
| `gateway` | `8000` | `8000` | Direct TCP Proxy Gateway |
| `cloudflared` | N/A | N/A | Outbound Cloudflare Connector |
| `backend` | `8080` | Internal Only | Docker Bridge Network |
| `postgres` | `5432` | Internal Only | Docker Bridge Network |
| `redis` | `6379` | Internal Only | Docker Bridge Network |
| `prometheus` | `9090` | Internal Only | Docker Bridge Network |
| `grafana` | `3000` | Internal Only | Docker Bridge Network |

---

## 4. Cloudflare DNS Configuration

1. **Dashboard & API Hostnames**:
   * Create CNAME record: `app.yourdomain.com` ➔ `<tunnel-id>.cfargotunnel.com`
   * Create CNAME record: `api.yourdomain.com` ➔ `<tunnel-id>.cfargotunnel.com`
2. **Proxy Gateway Hostname**:
   * Create A/AAAA record: `proxy.yourdomain.com` ➔ `<VPS_PUBLIC_IP>` (Port 8000)
   * Set proxy status to **DNS Only (Grey Cloud)** for `proxy.yourdomain.com` to allow direct TCP / HTTP CONNECT tunneling without CDN buffering.
