import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface SettingsNotificationsProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export const SettingsNotifications: React.FC<SettingsNotificationsProps> = ({ user, onUpdate }) => {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState(user.notificationPreferences);
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof UserProfile['notificationPreferences']) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ notificationPreferences: prefs });
      showToast('Notifications Saved', 'Your alert preferences have been updated.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const items: Array<{ key: keyof UserProfile['notificationPreferences']; title: string; desc: string }> = [
    {
      key: 'serverDowntime',
      title: 'Server Downtime & Offline Alerts',
      desc: 'Send urgent notifications if any VPS instance stops responding to health checks.',
    },
    {
      key: 'highResourceUsage',
      title: 'High Resource Thresholds',
      desc: 'Alert when CPU, Memory, or Storage exceeds 90% capacity for longer than 10 minutes.',
    },
    {
      key: 'deploymentStatus',
      title: 'Deployment & Build Notifications',
      desc: 'Receive updates when new applications or worker nodes are provisioned.',
    },
    {
      key: 'emailAlerts',
      title: 'Daily Digest & Summary',
      desc: 'Summary of daily bandwidth, security scans, and backup completions.',
    },
  ];

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">Notification Channels & Alerts</h2>
      <p className="settings-section-desc">Choose which alerts you want to receive via email and web hooks.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ paddingRight: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {item.desc}
              </div>
            </div>

            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
              checked={prefs[item.key]}
              onChange={() => handleToggle(item.key)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Alert Preferences
        </Button>
      </div>
    </div>
  );
};
