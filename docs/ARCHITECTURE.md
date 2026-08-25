# CloudPulse Architecture & Control Plane Design

CloudPulse separates the system strictly into the **Control Plane** (Management, Billing, Policy Enforcement, Quota & Session Decision Engine) and the **Data Plane** (High-throughput Proxy Tunneling & Egress Forwarding).

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
  │  (11 Foundational     │                       │  (Live Sticky/Rotating│
  │   Application Tables) │                       │   Sessions & Limits)  │
  └───────────────────────┘                       └───────────────────────┘
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │     Provider Abstraction     │
                      │  (Residential, DC, Mobile)   │
                      └──────────────────────────────┘

─────────────────────────────────────────────────────────────────────────────

                                 DATA PLANE

                      ┌──────────────────────────────┐
                      │  Customer Proxy Connection   │
                      │  (HTTP / HTTPS / SOCKS5)     │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │     Proxy Gateway (8000)     │
                      │      (3proxy / Go Engine)    │
                      └──────────────┬───────────────┘
                                     │
                    Handshake & Policy Check (200 OK)
                                     ▼
                      ┌──────────────────────────────┐
                      │     Redis / Session Policy   │
                      │   (Exit IP, Concurrency Cap) │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │     Provider Abstraction     │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ Authorized Egress Provider   │
                      │   (BrightData/Oxylabs/DC)    │
                      └──────────────────────────────┘
```

---

## 🔐 Control Plane Policy Decision Pipeline

Before any proxy data stream is established by the Data Plane Gateway, the request traverses the 8-step Control Plane decision engine:

1. **Customer**: Lookup tenant account.
2. **Authentication**: Verify Basic Auth `username:password` or `cp_live_` token.
3. **Plan**: Verify active subscription status and ensure remaining bandwidth quota > 0.
4. **Credential**: Verify proxy credential is `active` and enforce client IP whitelist (CIDR).
5. **Country Permissions**: Check compliance policy and target country routing privileges.
6. **Connection Limit**: Atomically check active concurrent TCP streams against `threads_limit`.
7. **Session Resolution**: Allocate or resume persistent sticky session or rotating exit IP.
8. **Provider Abstraction**: Route to the lowest-latency, healthy upstream egress supplier.
