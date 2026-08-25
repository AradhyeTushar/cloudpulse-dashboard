import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Proxy Suite Pages
import { ProxyDashboardPage } from './pages/proxy/ProxyDashboardPage';
import { ProxyCredentialsPage } from './pages/proxy/ProxyCredentialsPage';
import { ProxySessionsPage } from './pages/proxy/ProxySessionsPage';
import { ProxyLocationsPage } from './pages/proxy/ProxyLocationsPage';
import { ProxyUsagePage } from './pages/proxy/ProxyUsagePage';

// Billing Page
import { BillingLayoutPage } from './pages/billing/BillingLayoutPage';

// Account Suite Pages
import { ProfilePage } from './pages/account/ProfilePage';
import { ApiKeysPage } from './pages/account/ApiKeysPage';
import { SecurityPage } from './pages/account/SecurityPage';

// Admin Portal Pages
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminProvidersPage } from './pages/admin/AdminProvidersPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminAbusePage } from './pages/admin/AdminAbusePage';
import { AdminHealthPage } from './pages/admin/AdminHealthPage';

// Legacy/Compatibility Pages
import { SettingsPage } from './pages/SettingsPage';
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
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated Dashboard Shell */}
              <Route element={<DashboardLayout />}>
                {/* =========================================================
                    MAIN DASHBOARD & PROXY SUITE
                   ========================================================= */}
                <Route path="/" element={<ProxyDashboardPage />} />
                <Route path="/proxy" element={<Navigate to="/proxy/overview" replace />} />
                <Route path="/proxy/overview" element={<ProxyDashboardPage />} />
                <Route path="/proxy/credentials" element={<ProxyCredentialsPage />} />
                <Route path="/proxy/sessions" element={<ProxySessionsPage />} />
                <Route path="/proxy/locations" element={<ProxyLocationsPage />} />
                <Route path="/proxy/usage" element={<ProxyUsagePage />} />

                {/* Backwards compatibility aliases */}
                <Route path="/proxy-access" element={<Navigate to="/proxy/credentials" replace />} />
                <Route path="/locations" element={<Navigate to="/proxy/locations" replace />} />
                <Route path="/sessions" element={<Navigate to="/proxy/sessions" replace />} />
                <Route path="/usage" element={<Navigate to="/proxy/usage" replace />} />
                <Route path="/api" element={<Navigate to="/account/api-keys" replace />} />

                {/* =========================================================
                    BILLING
                   ========================================================= */}
                <Route path="/billing" element={<BillingLayoutPage />} />

                {/* =========================================================
                    ACCOUNT SUITE
                   ========================================================= */}
                <Route path="/account" element={<Navigate to="/account/profile" replace />} />
                <Route path="/account/profile" element={<ProfilePage />} />
                <Route path="/account/api-keys" element={<ApiKeysPage />} />
                <Route path="/account/security" element={<SecurityPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* =========================================================
                    ADMIN PORTAL
                   ========================================================= */}
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/plans" element={<AdminPlansPage />} />
                <Route path="/admin/providers" element={<AdminProvidersPage />} />
                <Route path="/admin/sessions" element={<AdminSessionsPage />} />
                <Route path="/admin/abuse" element={<AdminAbusePage />} />
                <Route path="/admin/health" element={<AdminHealthPage />} />

                {/* =========================================================
                    VPS FLEET MANAGEMENT (Direct Access)
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
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
