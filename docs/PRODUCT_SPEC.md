# CloudPulse Product Specification

CloudPulse is a high-performance **Proxy & Cloud Infrastructure Control Plane** designed for enterprise proxy routing, developer web scraping, and multi-region infrastructure management.

---

## 👥 Roles & Portals

### 1. Customer Portal (`/`)
* **Dashboard**: Key metrics (traffic consumed, remaining bandwidth balance, active sticky sessions, success rates), fast connect snippets for Python, Node.js, Go, and cURL.
* **Proxy Access**:
  * Proxy pool selection: Residential, Datacenter, Mobile 5G/4G, Static ISP.
  * Protocol selector: HTTP, HTTPS, SOCKS5.
  * Rotation behavior: Sticky (1–60 mins) or Rotating per-request.
  * Authentication: Username + Hashed Secret or Authorized IP Whitelist.
  * Regional Targeting: Country, State, City level.
* **Locations**: Interactive world map and live node directory across North America, Europe, Asia-Pacific, and Latin America with latency sparklines.
* **Sessions**: Real-time monitor of active sticky sessions, exit IP, duration, bytes in/out, and manual one-click IP rotation.
* **Usage**: Granular telemetry charting bandwidth over time (GB), concurrency streams, and target domain breakdown.
* **Billing**: Pay-as-you-go bandwidth packages ($/GB), auto-recharge triggers, invoice receipts, and saved payment methods.
* **API**: Scoped API credentials (`cp_live_...`), interactive cURL testing console, and webhook triggers.
* **Account**: User profile, Two-Factor Authentication (TOTP), active login devices, and security audit log.

### 2. Admin Portal (`/admin`)
* **Users**: Tenant directory, bandwidth quota overrides, active session counts, suspend/activate user toggles.
* **Plans**: Bandwidth package pricing ($/GB), concurrency caps, dedicated IP pool allocations.
* **Providers**: Upstream suppliers (residential providers, datacenter nodes), gateway routing status, node health checks.
* **Sessions**: Global real-time active connections stream across all tenants with emergency terminate button.
* **Abuse & Security**: IP rate limiting triggers, anomalous scraping patterns, target domain blacklists, fraud scoring.
* **System Health**: Proxy Gateway throughput (MB/s), Redis session latency, PostgreSQL query stats, API latency histograms.
