import React, { useState } from 'react';
import { User, Mail, Building, Save } from 'lucide-react';
import { MOCK_USER } from '../../data/mock-user';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState(MOCK_USER.name);
  const [workspace, setWorkspace] = useState(MOCK_USER.workspaceName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Saved', 'Your user profile details have been saved.', 'success');
  };

  return (
    <div className="content-container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Profile Information
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Update your account identity, personal email, and default tenant workspace.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
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
              Workspace / Organization Name
            </label>
            <input type="text" className="input-field" value={workspace} onChange={(e) => setWorkspace(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" type="submit">
              <Save size={14} style={{ marginRight: '0.35rem' }} />
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
