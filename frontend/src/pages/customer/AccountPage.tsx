import React, { useState } from 'react';
import { User, Shield, Key, Smartphone, Bell, Activity, Check } from 'lucide-react';
import { MOCK_USER } from '../../data/mock-user';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const AccountPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState(MOCK_USER.name);
  const [workspace, setWorkspace] = useState(MOCK_USER.workspaceName);
  const [twoFactor, setTwoFactor] = useState(MOCK_USER.twoFactorEnabled);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Saved', 'Your account settings have been updated.', 'success');
  };

  return (
    <div className="content-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Account & Security Settings
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Manage your personal details, Two-Factor Authentication (TOTP), and security policies.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>Profile Details</h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input type="email" className="input-field" value={MOCK_USER.email} disabled style={{ opacity: 0.7 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Workspace Name
            </label>
            <input type="text" className="input-field" value={workspace} onChange={(e) => setWorkspace(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Two-Factor Authentication (2FA)</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Enforce TOTP authenticator (Google Authenticator, 1Password) on every login.
            </p>
          </div>

          <Button
            variant={twoFactor ? 'secondary' : 'primary'}
            onClick={() => {
              setTwoFactor(!twoFactor);
              showToast('2FA Status Updated', `Two-Factor Authentication is now ${!twoFactor ? 'enabled' : 'disabled'}.`, 'info');
            }}
          >
            {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      </div>
    </div>
  );
};
