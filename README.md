# CloudPulse - Cloud Hosting & VPS Control Panel

A next-generation Cloud Hosting & VPS Management Dashboard built with **React**, **TypeScript**, and **Vite**.

---

## 🚀 Features

- **VPS Server Management Suite**:
  - Live Server Telemetry (CPU, Memory, Disk, Bandwidth Sparklines & Gauges).
  - Web SSH Terminal emulator.
  - Soft & Force Server Reboot actions.
  - Emergency Mode toggle & root password reset.
  - Dedicated IP allocation & reverse PTR records.
- **Docker Manager**:
  - Container catalog & deploy actions (WordPress, Nginx, Redis, PostgreSQL, Node.js).
  - Secret credentials store with masked secrets.
- **Snapshots & Automated Backups**:
  - On-demand snapshots with retention policy.
  - Automated weekly/daily backup schedules.
- **Security & Firewall**:
  - Configurable inbound & outbound port rules (SSH, HTTP, HTTPS, Custom TCP/UDP).
  - Automated malware scanner with quarantine tools.
- **DNS Manager**:
  - Full DNS record management (A, AAAA, CNAME, MX, TXT, SRV).
- **Billing & Invoices Suite**:
  - Subscriptions table with auto-renewal management.
  - Slide-over subscription detail drawer with quick copy ID.
  - Itemized payment history & printable invoice views.
  - Payment method manager (Credit Cards, PayPal, UPI).
- **Account & Security Settings**:
  - Profile information with masked contact data.
  - Two-Factor Authentication (TOTP Authenticator & SMS).
  - Active login sessions & security audit logs.
  - Granular account sharing & permissions.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System with CSS variables
- **Theme**: Light & Dark mode support

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
# Clone repository
git clone <repository-url>
cd cloudpulse-dashboard

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 🔒 Data Privacy
This dashboard uses mock infrastructure datasets. No real personal user data, private keys, or credentials are hardcoded or stored.
