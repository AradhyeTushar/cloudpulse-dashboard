# CloudPulse Deployment Guide

## 🐳 Quick Start with Docker Compose

To start the full CloudPulse ecosystem locally in one command:

```bash
docker compose up -d
```

### Stack Components & Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3000` | Customer & Admin Web Dashboard |
| **Backend API** | `http://localhost:8080` | Go REST API & Control Plane |
| **Proxy Gateway** | `localhost:8000` | HTTP/HTTPS/SOCKS5 Proxy Endpoint |
| **PostgreSQL** | `localhost:5432` | Primary Durable Database |
| **Redis** | `localhost:6379` | Session State & Rate Limiter |
| **Prometheus** | `http://localhost:9090` | Metrics Collector |
| **Grafana** | `http://localhost:3001` | Telemetry & Observability Dashboards |

---

## 🛠️ Local Development (Without Docker)

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### 2. Backend
```bash
cd backend
go run ./cmd/api
# Running on http://localhost:8080
```

### 3. Gateway
```bash
cd gateway
go run ./cmd/gateway
# Running on http://localhost:8000
```
