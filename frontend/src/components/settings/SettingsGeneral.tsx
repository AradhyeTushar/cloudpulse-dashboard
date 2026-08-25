import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface SettingsGeneralProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export const SettingsGeneral: React.FC<SettingsGeneralProps> = ({ user, onUpdate }) => {
  const [workspaceName, setWorkspaceName] = useState(user.workspaceName);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate({ workspaceName, name, email, timezone });
      showToast('Profile Updated', 'Your workspace details have been saved.', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">General Settings</h2>
      <p className="settings-section-desc">Manage your workspace identity and personal profile preferences.</p>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Workspace Name</label>
          <input
            type="text"
            className="form-input"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
          <span className="form-help">Visible to team members and in infrastructure labels.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            className="form-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="America/New_York (UTC-4)">America/New York (UTC-4)</option>
            <option value="Europe/London (UTC+1)">Europe/London (UTC+1)</option>
            <option value="Europe/Frankfurt (UTC+2)">Europe/Frankfurt (UTC+2)</option>
            <option value="Asia/Singapore (UTC+8)">Asia/Singapore (UTC+8)</option>
            <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
            <option value="America/Los_Angeles (UTC-7)">America/Los Angeles (UTC-7)</option>
          </select>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" loading={saving} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
