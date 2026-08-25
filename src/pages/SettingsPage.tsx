import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AccountInfoSection } from '../components/profile/AccountInfoSection';
import { TwoFactorSection } from '../components/profile/TwoFactorSection';
import { AccountActivitySection } from '../components/profile/AccountActivitySection';
import { NotificationSettingsSection } from '../components/profile/NotificationSettingsSection';
import { AccountSharingSection } from '../components/profile/AccountSharingSection';

type ProfileTab = 'account-info' | 'account-sharing' | 'security' | 'activity' | 'notifications';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as ProfileTab) || 'account-info';

  const handleTabChange = (tab: ProfileTab) => {
    setSearchParams({ tab });
  };

  return (
    <div style={{ width: '100%' }}>
      {activeTab === 'account-info' && (
        <AccountInfoSection onNavigateTo2FA={() => handleTabChange('security')} />
      )}

      {activeTab === 'account-sharing' && (
        <AccountSharingSection />
      )}

      {activeTab === 'security' && (
        <TwoFactorSection />
      )}

      {activeTab === 'activity' && (
        <AccountActivitySection />
      )}

      {activeTab === 'notifications' && (
        <NotificationSettingsSection />
      )}
    </div>
  );
};

export default SettingsPage;
