# 🔐 CloudPulse Local Environment Credentials & Login Guide

The CloudPulse platform is hosted locally on Docker Compose. Use the following credentials to log in to the web dashboard, access the REST API, and route traffic through the authenticated proxy gateway.

---

## 🌐 Local Service Endpoints

| Service | Protocol | Local URL | Description |
| :--- | :--- | :--- | :--- |
| **Web Dashboard** | HTTPS | [https://localhost](https://localhost) | React + TypeScript management UI |
| **Control Plane API** | HTTPS | [https://localhost/api/v1](https://localhost/api/v1) | Backend REST API & Auth |
| **Proxy Gateway** | HTTP / CONNECT | `http://localhost:8000` | Authenticated Residential Proxy Port |
| **Prometheus Metrics** | HTTP (Internal) | `http://localhost:9100/metrics` | Telemetry & Observability |

> [!NOTE]
> When accessing `https://localhost` in the browser, accept the self-signed developer certificate or launch with `--ignore-certificate-errors`.

---

## 👤 Pre-Configured Accounts & Credentials

### 1. Customer Account (Alex Mercer)
* **Email**: `alex.mercer@cloudinfra.io`
* **Password**: `Password123!`
* **Role**: `Customer / User`
* **Proxy Username**: `cp_1638ac43`
* **Proxy Password**: `p_sec_0068cfdb54424bbf`
* **Target Country**: United States (`US`)
* **Rotation**: `Sticky` (15 min session duration)

---

### 2. Administrator / Owner Account (CloudPulse Operator)
* **Email**: `admin.operator@cloudpulse.io`
* **Password**: `AdminSecurePass123!`
* **Role**: `Owner / Admin` (Full platform administrative privileges)
* **Proxy Username**: `cp_b5033187`
* **Proxy Password**: `p_sec_d2a742fbf1e60994`
* **Target Country**: Germany (`DE`)
* **Rotation**: `Rotating`

---

### 3. Validator Account
* **Email**: `validator@enterprise.com`
* **Password**: `DeployPassword123!`
* **Proxy Username**: `cp_76b59065`
* **Proxy Password**: `p_sec_a9cfccf6a8bba986`

---

## 🚀 Quick Start Testing Commands

### 1. Web API Login Test (cURL)
```bash
curl -sk -X POST https://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.mercer@cloudinfra.io","password":"Password123!"}'
```

### 2. Authenticated HTTP Proxy Request (cURL)
```bash
curl -x http://cp_1638ac43:p_sec_0068cfdb54424bbf@localhost:8000 http://example.com
```

### 3. Authenticated HTTPS CONNECT Tunnel (cURL)
```bash
curl -x http://cp_1638ac43:p_sec_0068cfdb54424bbf@localhost:8000 https://httpbin.org/ip
```

### 4. Direct Country & Session Inline Selection
```bash
# Request German (DE) sticky session through Alex's credential
curl -x http://cp_1638ac43-country-DE-session-mycustomsess123:p_sec_0068cfdb54424bbf@localhost:8000 https://httpbin.org/ip
```

---

## 🐍 Automated Verification Script

Run the built-in test suite:
```bash
python3 test_login_and_proxy.py
```
or
```bash
bash test_proxy.sh
```
