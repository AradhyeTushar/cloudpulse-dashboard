import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { HomePage } from './pages/HomePage';
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
import { SettingsPage } from './pages/SettingsPage';
import { BillingLayoutPage } from './pages/billing/BillingLayoutPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              {/* Home */}
              <Route path="/" element={<HomePage />} />

              {/* VPS List */}
              <Route path="/vps" element={<VpsListPage />} />

              {/* VPS Management Routes */}
              <Route path="/vps/:id" element={<VpsOverviewPage />} />
              
              {/* Docker Manager Sub-Routes */}
              <Route path="/vps/:id/docker" element={<Navigate to="applications" replace />} />
              <Route path="/vps/:id/docker/applications" element={<VpsDockerAppsPage />} />
              <Route path="/vps/:id/docker/credentials" element={<VpsDockerCredentialsPage />} />

              {/* Settings Sub-Routes */}
              <Route path="/vps/:id/settings" element={<Navigate to="main" replace />} />
              <Route path="/vps/:id/settings/main" element={<VpsMainSettingsPage />} />
              <Route path="/vps/:id/settings/ip-address" element={<VpsIpAddressPage />} />
              <Route path="/vps/:id/settings/emergency-mode" element={<VpsEmergencyModePage />} />
              <Route path="/vps/:id/settings/ssh-keys" element={<VpsSshKeysPage />} />

              {/* OS & Panel Sub-Routes */}
              <Route path="/vps/:id/os-panel" element={<Navigate to="operating-system" replace />} />
              <Route path="/vps/:id/os-panel/operating-system" element={<VpsOperatingSystemPage />} />
              <Route path="/vps/:id/os-panel/licenses" element={<VpsLicensesPage />} />

              {/* Backups & Monitoring Sub-Routes */}
              <Route path="/vps/:id/backups" element={<Navigate to="snapshots" replace />} />
              <Route path="/vps/:id/backups/snapshots" element={<VpsSnapshotsBackupsPage />} />
              <Route path="/vps/:id/backups/usage" element={<VpsServerUsagePage />} />
              <Route path="/vps/:id/backups/actions" element={<VpsLatestActionsPage />} />

              {/* Security Sub-Routes */}
              <Route path="/vps/:id/security" element={<Navigate to="firewall" replace />} />
              <Route path="/vps/:id/security/firewall" element={<VpsSecurityPage />} />
              <Route path="/vps/:id/security/malware" element={<VpsMalwareScannerPage />} />

              {/* DNS Manager */}
              <Route path="/vps/:id/dns-manager" element={<VpsDnsManagerPage />} />

              {/* Billing Suite */}
              <Route path="/billing" element={<BillingLayoutPage />} />

              {/* Global Settings */}
              <Route path="/settings" element={<SettingsPage />} />

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
