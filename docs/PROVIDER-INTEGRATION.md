# 🌐 CloudPulse Authorized Residential Provider Integration

## 1. Ethical & Legal Authorization Requirement
CloudPulse exclusively routes traffic through **explicitly authorized residential proxy provider accounts and compliant network infrastructure**.
* **Strict Policy**: Obtaining residential IPs from compromised devices, unauthorized connections, botnets, or malware is strictly forbidden.
* **Architecture Isolation**: The customer connects strictly to CloudPulse proxy endpoints (`proxy.yourdomain.com:8000`). Upstream provider details, gateway credentials, and internal provider tokens are completely decoupled and isolated from customer visibility.

---

## 2. Provider Abstraction Architecture

```text
Customer Request
      ↓
[ CloudPulse Gateway :8000 ]
      │ (Local Cache / Redis Check)
      ▼
[ Control Plane Engine :8080 ]
      │ (Policy, Auth, Plan Limits, Country)
      ▼
[ Provider Registry ]
      │
      ├── Primary: Authorized Residential Provider
      └── Fallback: Secondary Provider Grid
            │
            ▼
   [ Upstream Residential Exit Node ]
            │
            ▼
   [ Destination Target ]
```

---

## 3. Provider Interface Specification

All upstream proxy suppliers implement the Go `Provider` interface:

```go
type Provider interface {
    Name() string
    Type() string // residential, datacenter, mobile
    GetProxy(ctx context.Context, req *ProxyRequest) (*ProxyAllocation, error)
    ReleaseProxy(ctx context.Context, alloc *ProxyAllocation) error
    HealthCheck(ctx context.Context) (bool, int, error)
}
```

### Internal Data Models
* `ProxyRequest`: Specifies generic customer parameters (`Country`, `SessionID`, `RotationMode`).
* `ProxyAllocation`: Strictly internal runtime attributes (`Host`, `Port`, `Username`, `Password`, `ExitIP`, `ExpiresAt`). Marked with `json:"-"` to guarantee that upstream provider credentials can **never be serialized into any customer API response**.

---

## 4. Configuration & Secrets

Provider credentials are injected exclusively via environment variables:

```bash
# Authorized Residential Provider Configuration
RESIDENTIAL_PROVIDER_ENABLED=true
RESIDENTIAL_PROVIDER_NAME=residential-authorized
RESIDENTIAL_PROVIDER_TYPE=residential
RESIDENTIAL_PROVIDER_GATEWAY_HOST=pr.cloudpulse.net
RESIDENTIAL_PROVIDER_GATEWAY_PORT=8000
RESIDENTIAL_PROVIDER_USERNAME=cloudpulse_res_auth
RESIDENTIAL_PROVIDER_PASSWORD=secure_pass_phrase
RESIDENTIAL_PROVIDER_API_KEY=res_api_key_live_xyz
```

---

## 5. Session Modes & Exit Behavior

1. **Sticky Sessions (`rotation_mode: sticky`)**:
   * Same customer session ID generates deterministic upstream parameters preserving the provider-assigned exit IP for the duration of the TTL.
2. **Rotating Sessions (`rotation_mode: rotating`)**:
   * Each request receives a dynamic provider token (`sess_rot_<timestamp>`) assigning a fresh exit IP from the residential pool.
3. **Fail-Closed Guarantee**:
   * If all upstream providers are unavailable, the gateway immediately fails closed (returning HTTP 502/503), preventing open proxy vulnerabilities or unexpected direct origin egress.
