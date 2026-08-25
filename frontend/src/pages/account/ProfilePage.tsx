import React, { useState } from 'react';
import { User, Mail, Building, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState(user?.name || 'Alex Mercer');
  const [workspace, setWorkspace] = useState(user?.workspaceName || "Alex Mercer's Workspace");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Updated', 'Your user profile details have been saved.', 'success');
  };

  return (
    <div className="content-container" style={{ maxWidth: '840px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Profile Information
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Update your account identity, personal email, and default tenant workspace.
        </p>
      </div>

      <div className="card" style={{ padding: '1.75rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                <span>Full Name</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: '0.95rem', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                <span>Email Address</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Verified</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.95rem', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  value={user?.email || 'alex.mercer@cloudinfra.io'}
                  disabled
                  style={{ paddingLeft: '2.5rem', opacity: 0.8 }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <span>Workspace / Organization Name</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Building size={16} style={{ position: 'absolute', left: '0.95rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--status-running)' }} />
              <span>Role: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.role || 'Customer'}</strong></span>
            </div>
            <Button variant="primary" type="submit">
              <Save size={14} style={{ marginRight: '0.4rem' }} />
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
