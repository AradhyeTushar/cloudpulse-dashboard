# CloudPulse Architecture & Control Plane Design

CloudPulse separates the system strictly into the **Control Plane** (Management, Billing, Policy Enforcement, Quota & Session Decision Engine) and the **Data Plane** (High-throughput Proxy Tunneling & Egress Forwarding).

The platform is designed exclusively for **authorized enterprise proxy access, data collection, and compliance-first HTTP client traffic**, backed by active abuse-prevention and Acceptable Use Policy (AUP) enforcement.

---

## 🏛️ Production Network & Security Topology

```text
                                  PUBLIC INTERNET
                                         │
                        ┌────────────────┴────────────────┐
                        │     TLS Termination / NGINX     │
                        │         (Ports 80 & 443)        │
                        └────────┬───────────────┬────────┘
                                 │               │
                     HTTPS / API │               │ Secure Proxy (:8000)
                                 ▼               ▼
                        ┌────────────────┐  ┌────────────────────────┐
                        │ React Frontend │  │  Proxy Gateway (:8000) │
                        │  & Go API      │  │  (Fast-Path Policy     │
                        │  (:8080)       │  │   & CONNECT Engine)    │
                        └────────┬───────┘  └───────────┬────────────┘
                                 │                      │
─────────────────────────────────┼──────────────────────┼───────────────────────
                                 │ PRIVATE DOCKER BRIDGE│
                                 ▼                      ▼
                        ┌────────────────────────────────────────────┐
                        │             INTERNAL INFRASTRUCTURE       │
                        │                                            │
                        │  • PostgreSQL 16 (12 Standardized Tables)  │
                        │  • Redis 7 (Atomic Concurrency & Sessions) │
                        │  • Prometheus (:9090) & Grafana (:3000)    │
                        └──────────────────────┬─────────────────────┘
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
                                │    (Mock / Residential Grid) │
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

---

## ⚡ Near-Real-Time Event Invalidation

* **Security Propagation**: When an admin suspends a user, resets credentials, or disables an account, the Control Plane publishes an invalidation event on the Redis Pub/Sub channel `policy:invalidate`.
* **Eviction**: All distributed Gateway edge nodes listen to `policy:invalidate` and evict corresponding cache entries, providing near-real-time policy-cache invalidation.
* **Fail-Closed Guarantee**: Under dependency outages (e.g. Control Plane unreachable for an unknown client), the Gateway strictly rejects connections and never functions as an open proxy.
