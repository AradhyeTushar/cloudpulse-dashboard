import React, { useState } from 'react';
import { Shield, Key, Lock, Smartphone, Check } from 'lucide-react';
import { MOCK_USER } from '../../data/mock-user';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const SecurityPage: React.FC = () => {
  const { showToast } = useToast();
  const [twoFactor, setTwoFactor] = useState(MOCK_USER.twoFactorEnabled);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    showToast('Password Updated', 'Your account password has been changed.', 'success');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="content-container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Security & Authentication
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Enforce Two-Factor Authentication, update password credentials, and review security settings.
        </p>
      </div>

      {/* 2FA Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Two-Factor Authentication (TOTP)</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Protect your account using an authenticator app (Google Authenticator, 1Password).
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

      {/* Password Change Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>Change Account Password</h3>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Current Password
            </label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              New Password
            </label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" type="submit">
              <Lock size={14} style={{ marginRight: '0.35rem' }} />
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
