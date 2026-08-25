# CloudPulse API Documentation

All API endpoints are prefixed with `/api/v1`.

## Authentication

Pass your JWT bearer token or API key in the `Authorization` header:

```http
Authorization: Bearer <token_or_cp_live_api_key>
```

---

## Key Endpoints

### Authentication
* `POST /api/v1/auth/register` - Create user account (Argon2id password hashing)
* `POST /api/v1/auth/login` - Authenticate & receive JWT token

### Customer Portal
* `GET /api/v1/user/profile` - User profile & workspace settings
* `GET /api/v1/plans` - Active subscription tiers & $/GB pricing
* `GET /api/v1/credentials` - List API keys (masked prefix)
* `POST /api/v1/credentials` - Create API key (shows secret once)
* `DELETE /api/v1/credentials/{id}` - Revoke API key
* `GET /api/v1/sessions` - Active sticky sessions
* `DELETE /api/v1/sessions/{id}` - Terminate session
* `GET /api/v1/vps` - Managed node fleet & instances
* `GET /api/v1/vps/{id}/usage` - Real-time telemetry data points
* `GET /api/v1/audit/logs` - User security audit trail

### Admin Portal
* `GET /api/v1/admin/overview` - Fleet-wide overview, total tenants, active connections, health
