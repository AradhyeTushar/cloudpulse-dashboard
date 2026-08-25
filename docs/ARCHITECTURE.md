# CloudPulse System Architecture

```text
                                       ┌─────────────────────────┐
                                       │   React Frontend (UI)   │
                                       │   (Port 5173 / 80)      │
                                       └────────────┬────────────┘
                                                    │
                                           HTTP REST / JSON
                                                    │
                                                    ▼
┌───────────────────────┐              ┌─────────────────────────┐
│     Proxy Clients     │─── HTTP/SOCKS ───▶   Go Proxy Gateway  │
│ (Scrapers, Apps, Bots)│   (Port 8000)│    (3proxy / Custom)    │
└───────────────────────┘              └────────────┬────────────┘
                                                    │ Telemetry & Auth
                                                    ▼
                                       ┌─────────────────────────┐
                                       │      Go Backend API     │
                                       │       (Port 8080)       │
                                       └───────┬─────────┬───────┘
                                               │         │
                        ┌──────────────────────┘         └─────────────────────┐
                        ▼                                                      ▼
             ┌────────────────────┐                                 ┌────────────────────┐
             │ PostgreSQL 16 (DB) │                                 │  Redis 7 (Sessions)│
             │   Durable State    │                                 │   Fast Cache & TTL │
             └────────────────────┘                                 └────────────────────┘
                        ▲                                                      ▲
                        │                                                      │
                        └──────────────────────┬───────────────────────────────┘
                                               │ Scrapes /metrics
                                               ▼
                                  ┌────────────────────────┐
                                  │   Prometheus & Grafana │
                                  │    Telemetry & Alerts  │
                                  └────────────────────────┘
```

## Data Flow & Authentication
1. **User Authentication**: Passwords hashed using **Argon2id** (`t=3, m=64MB, p=4`). Sessions issue standard HS256 JWT tokens or Redis-backed sliding session tokens.
2. **API Credentials**: Customer tokens prefixed with `cp_live_` and stored as cryptographically secure SHA-256 hashes in PostgreSQL.
3. **Proxy Gateway Routing**: The gateway intercepts HTTP `CONNECT` and `GET/POST` requests, checks credentials or IP whitelist, forwards to selected upstream nodes, and reports transferred byte counters directly to Prometheus.
