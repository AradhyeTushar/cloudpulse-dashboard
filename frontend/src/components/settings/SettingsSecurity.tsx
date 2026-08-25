import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Button } from '../ui/Button';
import { ShieldCheck, Smartphone, Laptop, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface SettingsSecurityProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export const SettingsSecurity: React.FC<SettingsSecurityProps> = ({ user, onUpdate }) => {
  const { showToast } = useToast();
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [sessions, setSessions] = useState(user.activeSessions);

  const handleToggle2FA = async () => {
    const updated = !twoFactor;
    setTwoFactor(updated);
    await onUpdate({ twoFactorEnabled: updated });
    showToast('Two-Factor Authentication', updated ? '2FA has been enabled.' : '2FA has been disabled.', 'info');
  };

  const handleRevokeSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    showToast('Session Revoked', 'The selected session has been logged out.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 2FA Card */}
      <div className="settings-card">
        <h2 className="settings-section-title">Two-Factor Authentication (2FA)</h2>
        <p className="settings-section-desc">Add an extra layer of security to prevent unauthorized access.</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: twoFactor ? 'var(--status-running-bg)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color={twoFactor ? 'var(--status-running)' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Authenticator App (TOTP)
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                {twoFactor ? 'Status: Active and protecting your account' : 'Status: Disabled'}
              </div>
            </div>
          </div>
          <Button variant={twoFactor ? 'outline' : 'primary'} size="sm" onClick={handleToggle2FA}>
            {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="settings-card">
        <h2 className="settings-section-title">Active Login Sessions</h2>
        <p className="settings-section-desc">These devices are currently authenticated into your control panel.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {sess.device.includes('iPhone') || sess.device.includes('Mobile') ? (
                  <Smartphone size={20} color="var(--text-muted)" />
                ) : (
                  <Laptop size={20} color="var(--text-muted)" />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{sess.device} • {sess.browser}</span>
                    {sess.current && (
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', background: 'var(--status-running-bg)', color: 'var(--status-running)', fontWeight: 700 }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    {sess.location} • IP: {sess.ipAddress} • {sess.lastActive}
                  </div>
                </div>
              </div>

              {!sess.current && (
                <button
                  className="btn-icon"
                  style={{ color: 'var(--status-error)' }}
                  onClick={() => handleRevokeSession(sess.id)}
                  title="Revoke session"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
