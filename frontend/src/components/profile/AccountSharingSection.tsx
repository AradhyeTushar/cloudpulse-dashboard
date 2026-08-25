import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Mail,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface SharedUser {
  id: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'Viewer';
  status: 'Active' | 'Pending';
  accessSince: string;
}

export const AccountSharingSection: React.FC = () => {
  const { showToast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Administrator' | 'Developer' | 'Viewer'>('Developer');

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    {
      id: 'su-1',
      email: 'dev.team@cloudhost.net',
      role: 'Developer',
      status: 'Active',
      accessSince: '2026-08-22',
    },
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const newUser: SharedUser = {
      id: `su-${Date.now()}`,
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Pending',
      accessSince: 'Just now',
    };
    setSharedUsers((prev) => [...prev, newUser]);
    setInviteEmail('');
    setInviteModalOpen(false);
    showToast('Invitation Sent', `Invitation sent to ${newUser.email}.`, 'success');
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Account sharing
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Grant access to team members or external developers to manage your infrastructure.
          </p>
        </div>

        <Button
          variant="primary"
          className="btn-pill"
          icon={<Plus size={14} />}
          onClick={() => setInviteModalOpen(true)}
        >
          Grant Access
        </Button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Role / Privileges</th>
                <th>Status</th>
                <th>Granted Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sharedUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-subtle)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={user.status === 'Active' ? 'status-badge status-running' : 'status-badge status-provisioning'}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{user.accessSince}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      style={{ color: '#ef4444' }}
                      title="Revoke access"
                      onClick={() => {
                        setSharedUsers((prev) => prev.filter((u) => u.id !== user.id));
                        showToast('Access Revoked', `Revoked access for ${user.email}.`, 'success');
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Grant Account Access"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite}>Send Invitation</Button>
          </>
        }
      >
        <form onSubmit={handleInvite}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <option value="Administrator">Administrator (Full control)</option>
              <option value="Developer">Developer (Manage servers & containers)</option>
              <option value="Viewer">Viewer (Read-only metrics & logs)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
