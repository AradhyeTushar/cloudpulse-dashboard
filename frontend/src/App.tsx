import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Customer Portal Pages
import { DashboardPage } from './pages/customer/DashboardPage';
import { ProxyAccessPage } from './pages/customer/ProxyAccessPage';
import { LocationsPage } from './pages/customer/LocationsPage';
import { SessionsPage } from './pages/customer/SessionsPage';
import { UsagePage } from './pages/customer/UsagePage';
import { ApiPage } from './pages/customer/ApiPage';
import { AccountPage } from './pages/customer/AccountPage';
import { BillingLayoutPage } from './pages/billing/BillingLayoutPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Portal Pages
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminProvidersPage } from './pages/admin/AdminProvidersPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminAbusePage } from './pages/admin/AdminAbusePage';
import { AdminHealthPage } from './pages/admin/AdminHealthPage';

// VPS Management Legacy/Sub-routes
import { VpsListPage } from './pages/VpsListPage';
import { VpsOverviewPage } from './pages/vps/VpsOverviewPage';
import { VpsDockerAppsPage } from './pages/vps/VpsDockerAppsPage';
import { VpsDockerCredentialsPage } from './pages/vps/VpsDockerCredentialsPage';
import { VpsMainSettingsPage } from './pages/vps/VpsMainSettingsPage';
import { VpsIpAddressPage } from './pages/vps/VpsIpAddressPage';
import { VpsEmergencyModePage } from './pages/vps/VpsEmergencyModePage';
import { VpsSshKeysPage } from './pages/vps/VpsSshKeysPage';
import { VpsOperatingSystemPage } from './pages/vps/VpsOperatingSystemPage';
import { VpsLicensesPage } from './pages/vps/VpsLicensesPage';
import { VpsSnapshotsBackupsPage } from './pages/vps/VpsSnapshotsBackupsPage';
import { VpsServerUsagePage } from './pages/vps/VpsServerUsagePage';
import { VpsLatestActionsPage } from './pages/vps/VpsLatestActionsPage';
import { VpsSecurityPage } from './pages/vps/VpsSecurityPage';
import { VpsMalwareScannerPage } from './pages/vps/VpsMalwareScannerPage';
import { VpsDnsManagerPage } from './pages/vps/VpsDnsManagerPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              {/* =========================================================
                  CUSTOMER PORTAL ROUTES
                 ========================================================= */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/proxy-access" element={<ProxyAccessPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/billing" element={<BillingLayoutPage />} />
              <Route path="/api" element={<ApiPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* =========================================================
                  ADMIN PORTAL ROUTES
                 ========================================================= */}
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/plans" element={<AdminPlansPage />} />
              <Route path="/admin/providers" element={<AdminProvidersPage />} />
              <Route path="/admin/sessions" element={<AdminSessionsPage />} />
              <Route path="/admin/abuse" element={<AdminAbusePage />} />
              <Route path="/admin/health" element={<AdminHealthPage />} />

              {/* =========================================================
                  VPS FLEET MANAGEMENT
                 ========================================================= */}
              <Route path="/vps" element={<VpsListPage />} />
              <Route path="/vps/:id" element={<VpsOverviewPage />} />
              <Route path="/vps/:id/docker" element={<Navigate to="applications" replace />} />
              <Route path="/vps/:id/docker/applications" element={<VpsDockerAppsPage />} />
              <Route path="/vps/:id/docker/credentials" element={<VpsDockerCredentialsPage />} />
              <Route path="/vps/:id/settings" element={<Navigate to="main" replace />} />
              <Route path="/vps/:id/settings/main" element={<VpsMainSettingsPage />} />
              <Route path="/vps/:id/settings/ip-address" element={<VpsIpAddressPage />} />
              <Route path="/vps/:id/settings/emergency-mode" element={<VpsEmergencyModePage />} />
              <Route path="/vps/:id/settings/ssh-keys" element={<VpsSshKeysPage />} />
              <Route path="/vps/:id/os-panel" element={<Navigate to="operating-system" replace />} />
              <Route path="/vps/:id/os-panel/operating-system" element={<VpsOperatingSystemPage />} />
              <Route path="/vps/:id/os-panel/licenses" element={<VpsLicensesPage />} />
              <Route path="/vps/:id/backups" element={<Navigate to="snapshots" replace />} />
              <Route path="/vps/:id/backups/snapshots" element={<VpsSnapshotsBackupsPage />} />
              <Route path="/vps/:id/backups/usage" element={<VpsServerUsagePage />} />
              <Route path="/vps/:id/backups/actions" element={<VpsLatestActionsPage />} />
              <Route path="/vps/:id/security" element={<Navigate to="firewall" replace />} />
              <Route path="/vps/:id/security/firewall" element={<VpsSecurityPage />} />
              <Route path="/vps/:id/security/malware" element={<VpsMalwareScannerPage />} />
              <Route path="/vps/:id/dns-manager" element={<VpsDnsManagerPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
