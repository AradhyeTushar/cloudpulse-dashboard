import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  Key,
  Receipt,
  CreditCard,
  Layers,
  Settings as SettingsIcon,
  Bell,
  Home,
} from 'lucide-react';
import { AccountInfoSection } from '../components/profile/AccountInfoSection';
import { TwoFactorSection } from '../components/profile/TwoFactorSection';
import { AccountActivitySection } from '../components/profile/AccountActivitySection';
import { NotificationSettingsSection } from '../components/profile/NotificationSettingsSection';
import { SubscriptionsView } from '../components/billing/SubscriptionsView';
import { PaymentHistoryView } from '../components/billing/PaymentHistoryView';
import { PaymentMethodsView } from '../components/billing/PaymentMethodsView';
import { ApiKeysPage } from './account/ApiKeysPage';

type SettingsTab =
  | 'profile'
  | 'subscriptions'
  | 'history'
  | 'methods'
  | 'api-keys'
  | 'security'
  | 'notifications';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'profile';

  // Normalize tab aliases
  let activeTab: SettingsTab = 'profile';
  if (rawTab === 'account' || rawTab === 'account-info' || rawTab === 'profile') {
    activeTab = 'profile';
  } else if (rawTab === 'billing' || rawTab === 'subscriptions') {
    activeTab = 'subscriptions';
  } else if (rawTab === 'history' || rawTab === 'invoices') {
    activeTab = 'history';
  } else if (rawTab === 'methods' || rawTab === 'payment-methods') {
    activeTab = 'methods';
  } else if (rawTab === 'api-keys' || rawTab === 'keys') {
    activeTab = 'api-keys';
  } else if (rawTab === 'security' || rawTab === '2fa') {
    activeTab = 'security';
  } else if (rawTab === 'notifications' || rawTab === 'activity') {
    activeTab = 'notifications';
  }

  const handleTabChange = (tab: SettingsTab) => {
    setSearchParams({ tab });
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile & Account', icon: <User size={15} /> },
    { id: 'subscriptions', label: 'Billing & Plans', icon: <Layers size={15} /> },
    { id: 'history', label: 'Payment History', icon: <Receipt size={15} /> },
    { id: 'methods', label: 'Payment Methods', icon: <CreditCard size={15} /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key size={15} /> },
    { id: 'security', label: 'Security & 2FA', icon: <Shield size={15} /> },
  ];

  return (
    <div className="content-container">
      {/* Breadcrumb Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <Home size={14} />
          <span>›</span>
          <span>Control Panel</span>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Settings & Workspace Control
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Manage your personal identity, proxy subscriptions, invoice receipts, and API access keys.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          padding: '0.35rem',
          background: 'var(--bg-subtle)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem',
        }}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.835rem',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div style={{ width: '100%' }}>
        {activeTab === 'profile' && (
          <AccountInfoSection onNavigateTo2FA={() => handleTabChange('security')} />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsView />
        )}

        {activeTab === 'history' && (
          <PaymentHistoryView />
        )}

        {activeTab === 'methods' && (
          <PaymentMethodsView />
        )}

        {activeTab === 'api-keys' && (
          <ApiKeysPage />
        )}

        {activeTab === 'security' && (
          <TwoFactorSection />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsSection />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
