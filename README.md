# CloudPulse - High-Performance Proxy & Cloud Infrastructure Control Plane

A next-generation Proxy & Cloud Infrastructure Management Platform built with **Go**, **React 19**, **PostgreSQL**, **Redis**, and **Prometheus**.

---

## 🏗️ Architecture & Modules

```text
cloudpulse-dashboard/
├── 📁 frontend/        # React 19 + TypeScript + Vite customer & admin dashboard
├── 📁 backend/         # Go 1.23 API Control Plane (Argon2id, JWT, Redis, Postgres)
├── 📁 gateway/         # High-throughput proxy gateway (3proxy + Go accounting tunnel)
├── 📁 migrations/      # PostgreSQL DDL migrations (Users, Proxies, Sessions, Usage, Plans)
├── 📁 monitoring/      # Prometheus scrape configs & Grafana dashboards
├── 📁 docs/            # Architecture, API specification, and deployment guides
├── docker-compose.yml  # Multi-container local & production stack
└── Makefile            # Developer targets
```

---

## 🚀 Key Features

### 👤 Customer Portal
- **Dashboard**: Live bandwidth gauges, proxy status, quick code integration snippets (Python, Node.js, Go, cURL).
- **Proxy Access**: Residential, Datacenter, Mobile & ISP proxy configuration with sticky (1–60 min) or rotating modes.
- **Locations**: Global node map with live ping across North America, Europe, Asia-Pacific, and Latin America.
- **Sessions**: Real-time monitor of active sticky sessions with instant one-click IP rotation.
- **Usage**: Hourly/daily bandwidth telemetry (GB), requests per second, and domain traffic breakdown.
- **Billing**: Pay-as-you-go bandwidth packages ($/GB), auto-recharge triggers, and invoices.
- **API**: Personal access tokens (`cp_live_...`) and interactive API documentation.
- **Account**: Security preferences, Two-Factor Authentication (TOTP), and audit logs.

### 🛡️ Admin Portal
- **Users**: Fleet-wide tenant management and quota overrides.
- **Plans**: Bandwidth pricing and concurrency tiers.
- **Providers**: Upstream suppliers and proxy node health status.
- **Sessions**: Global live connection stream and emergency killswitch.
- **Abuse**: Automated rate limiter events, anomalous scraper detection, and domain blacklists.
- **System Health**: Gateway throughput (MB/s), Redis session latency, and database query statistics.

---

## ⚡ Quick Start

### One-Command Launch (Docker Compose)
```bash
docker compose up -d
```

Access services:
* **Frontend UI**: [http://localhost:3000](http://localhost:3000) (or dev server on `5173`)
* **Backend API**: [http://localhost:8080](http://localhost:8080)
* **Proxy Gateway**: `localhost:8000` (HTTP) / `localhost:1080` (SOCKS5)
* **Prometheus**: [http://localhost:9090](http://localhost:9090)
* **Grafana**: [http://localhost:3001](http://localhost:3001)

### Manual Local Development
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && go run ./cmd/api

# Proxy Gateway
cd gateway && go run ./cmd/gateway
```
