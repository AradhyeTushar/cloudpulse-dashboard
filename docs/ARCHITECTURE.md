# CloudPulse Architecture & Control Plane Design

CloudPulse separates the system strictly into the **Control Plane** (Management, Billing, Policy Enforcement, Quota & Session Decision Engine) and the **Data Plane** (High-throughput Proxy Tunneling & Egress Forwarding).

The platform is designed exclusively for **authorized enterprise proxy access, data collection, and compliance-first HTTP client traffic**, backed by active abuse-prevention and Acceptable Use Policy (AUP) enforcement.

---

## 🏛️ Two-Tier Architecture

```text
                                CONTROL PLANE

                      ┌──────────────────────────────┐
                      │   React + TypeScript Frontend│
                      │     (Customer & Admin UI)    │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Go API Control Plane      │
                      │         (Port 8080)          │
                      └──────────────┬───────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
  ┌───────────────────────┐                       ┌───────────────────────┐
  │     PostgreSQL 16     │                       │        Redis 7        │
  │  (12 Standardized     │                       │  (Live Sticky/Rotating│
  │   Application Tables) │                       │   Sessions & Limits)  │
  └───────────────────────┘                       └───────────────────────┘
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │   Dynamic Provider Registry  │
                      │   (provider-a / provider-b)  │
                      └──────────────────────────────┘

─────────────────────────────────────────────────────────────────────────────

                                 DATA PLANE

                      ┌──────────────────────────────┐
                      │  Customer Client Application │
                      │  (Applications / HTTP Client)│
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │     Proxy Gateway (8000)     │
                      │  (Fast-Path Policy & Cache)  │
                      └──────────────┬───────────────┘
                                     │
                     Session Fast-Path / Handshake Check
                                     ▼
                      ┌──────────────────────────────┐
                      │     Redis / Session Policy   │
                      │   (Exit IP, Concurrency Cap) │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │   Dynamic Provider Registry  │
                      │   (Primary ➔ Fallback Grid)  │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │  Authorized Egress Provider  │
                      │     (Residential / DC Grid)  │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │        Target Website        │
                      │        (The Internet)        │
                      └──────────────────────────────┘
```

---

## 🔐 Control Plane Policy Decision Pipeline

Before any proxy data stream is established, the request traverses the 8-step Control Plane decision engine:

1. **Customer**: Lookup tenant account and verify `active` account status.
2. **Authentication**: Verify Basic Auth `username:password` or API token against Argon2id hash.
3. **Plan**: Verify active subscription status and remaining bandwidth quota.
4. **Credential**: Verify proxy credential status and client IP CIDR whitelist.
5. **Country Permissions**: Check target country routing privileges against compliance & sanction lists.
6. **Connection Limit**: Atomically enforce concurrent stream limits (`threads_limit`).
7. **Session Resolution**: Allocate or resume persistent sticky session (`Session`) in Redis.
8. **Provider Routing**: Allocate internal `ProxyAllocation` from dynamic primary or fallback upstream supplier.
