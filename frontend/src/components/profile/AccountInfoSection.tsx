import React, { useState } from 'react';
import {
  Pencil,
  Trash2,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  User,
  Settings,
  Lock,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';

interface AccountInfoSectionProps {
  onNavigateTo2FA: () => void;
}

export const AccountInfoSection: React.FC<AccountInfoSectionProps> = ({ onNavigateTo2FA }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Customer Account',
    address: '-',
    phone: '-',
    company: user?.workspaceName || '-',
    currency: 'USD',
    email: user?.email || 'user@example.com',
    recoveryEmail: '-',
    passwordSet: true,
    googleConnected: false,
    githubConnected: false,
    memberSince: (user as any)?.createdAt ? String((user as any).createdAt).split('T')[0] : '2026-08-27',
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    open: boolean;
    title: string;
    field: keyof typeof profileData;
    value: string;
    type?: string;
  }>({
    open: false,
    title: '',
    field: 'name',
    value: '',
  });

  // Delete Account Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);

  const handleOpenEdit = (title: string, field: keyof typeof profileData, type = 'text') => {
    setEditModal({
      open: true,
      title,
      field,
      value: profileData[field] === '-' ? '' : String(profileData[field]),
      type,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData((prev) => ({
      ...prev,
      [editModal.field]: editModal.value.trim() || '-',
    }));
    showToast('Updated', `${editModal.title} has been updated.`, 'success');
    setEditModal({ ...editModal, open: false });
  };

  const handleDeletePhone = () => {
    setProfileData((prev) => ({ ...prev, phone: '-' }));
    showToast('Phone Removed', 'Phone number removed from invoice billing.', 'info');
  };

  const handleToggleGoogle = () => {
    if (profileData.googleConnected) {
      setProfileData((prev) => ({ ...prev, googleConnected: false }));
      showToast('Google Unlinked', 'Google single sign-on disconnected.', 'warning');
    } else {
      setProfileData((prev) => ({ ...prev, googleConnected: true }));
      showToast('Google Connected', 'Google OAuth account linked.', 'success');
    }
  };

  const handleToggleGithub = () => {
    if (profileData.githubConnected) {
      setProfileData((prev) => ({ ...prev, githubConnected: false }));
      showToast('GitHub Disconnected', 'GitHub integration unlinked.', 'warning');
    } else {
      setProfileData((prev) => ({ ...prev, githubConnected: true }));
      showToast('GitHub Connected', 'Connected to GitHub account.', 'success');
    }
  };

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Account information
      </h1>

      {/* =====================================================================
          1. PERSONAL INFORMATION CARD (Screenshots 1 & 2)
         ===================================================================== */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <User size={18} color="var(--brand-primary)" />
          <h2 className="profile-section-title">Personal information</h2>
        </div>
        <p className="profile-section-desc">
          The information provided below will reflect on your invoices
        </p>

        <div className="profile-row-list">
          {/* Name */}
          <div className="profile-row-item">
            <span className="profile-row-label">Name</span>
            <span className="profile-row-value">{profileData.name}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Edit Name', 'name')}
                title="Edit name"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="profile-row-item">
            <span className="profile-row-label">Address</span>
            <span className="profile-row-value">{profileData.address}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Edit Address', 'address')}
                title="Edit address"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Phone number */}
          <div className="profile-row-item">
            <span className="profile-row-label">Phone number</span>
            <span className="profile-row-value">{profileData.phone}</span>
            <div className="profile-row-actions">
              {profileData.phone !== '-' && (
                <button
                  className="profile-delete-icon-btn"
                  onClick={handleDeletePhone}
                  title="Delete phone number"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Edit Phone Number', 'phone', 'tel')}
                title="Edit phone number"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Company */}
          <div className="profile-row-item">
            <span className="profile-row-label">Company</span>
            <span className="profile-row-value">{profileData.company}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Edit Company', 'company')}
                title="Edit company"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Account currency */}
          <div className="profile-row-item">
            <div className="profile-row-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Account currency</span>
              <Info size={13} color="var(--text-muted)" />
            </div>
            <span className="profile-row-value">{profileData.currency}</span>
            <div className="profile-row-actions" style={{ minWidth: '32px' }}></div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. ACCOUNT SETTINGS CARD (Screenshots 1 & 2)
         ===================================================================== */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <Settings size={18} color="var(--brand-primary)" />
          <h2 className="profile-section-title">Account settings</h2>
        </div>

        <div className="profile-row-list">
          {/* Email */}
          <div className="profile-row-item">
            <span className="profile-row-label">Email</span>
            <span className="profile-row-value">{profileData.email}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Change Account Email', 'email', 'email')}
                title="Edit email"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Recovery email */}
          <div className="profile-row-item">
            <span className="profile-row-label">Recovery email</span>
            <span className="profile-row-value">{profileData.recoveryEmail}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Set Recovery Email', 'recoveryEmail', 'email')}
                title="Edit recovery email"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Add password */}
          <div className="profile-row-item">
            <span className="profile-row-label">Add password</span>
            <span className="profile-row-value">{profileData.passwordSet ? '••••••••••••' : '-'}</span>
            <div className="profile-row-actions">
              <button
                className="profile-edit-btn"
                onClick={() => handleOpenEdit('Set Account Password', 'passwordSet', 'password')}
                title="Change password"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Manage two-factor authentication */}
          <div
            className="profile-row-item"
            style={{ cursor: 'pointer' }}
            onClick={onNavigateTo2FA}
          >
            <span className="profile-row-label">Manage two-factor authentication</span>
            <div className="profile-row-value">
              <div className="tfa-disabled-badge">
                <XCircle size={15} fill="#ef4444" color="white" />
                <span>Disabled</span>
              </div>
            </div>
            <div className="profile-row-actions">
              <button className="profile-edit-btn" aria-label="Open Two-Factor Setup">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Member since */}
          <div className="profile-row-item">
            <span className="profile-row-label">Member since</span>
            <span className="profile-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
              {profileData.memberSince}
            </span>
            <div className="profile-row-actions" style={{ minWidth: '32px' }}></div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. SOCIAL LOGINS CARD (Screenshot 2)
         ===================================================================== */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <Lock size={18} color="var(--brand-primary)" />
          <h2 className="profile-section-title">Social logins</h2>
        </div>

        <div className="social-integration-item" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="social-left-info">
            <div className="social-logo-wrap">
              {/* Google G SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div>
              <div className="social-title-text">Google</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="status-enabled-badge">
              <CheckCircle2 size={15} fill="#059669" color="white" />
              <span>Enabled</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="btn-pill"
              onClick={handleToggleGoogle}
            >
              {profileData.googleConnected ? 'Unlink' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. ACCOUNT INTEGRATIONS CARD (Screenshot 2)
         ===================================================================== */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <Boxes size={18} color="var(--brand-primary)" />
          <h2 className="profile-section-title">Account integrations</h2>
        </div>

        <div className="social-integration-item" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="social-left-info">
            <div className="social-logo-wrap">
              {/* GitHub SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <div className="social-title-text">GitHub</div>
              <div className="social-sub-text">Connect your GitHub account</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>

            <Button
              variant="outline"
              size="sm"
              className="btn-pill"
              onClick={handleToggleGithub}
            >
              {profileData.githubConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. ACCOUNT DANGER ZONE CARD (Screenshot 2)
         ===================================================================== */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <AlertTriangle size={18} color="#ef4444" />
          <h2 className="profile-section-title">Account</h2>
        </div>

        <div className="social-integration-item" style={{ borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="social-title-text" style={{ fontWeight: 700 }}>Delete account</div>
            <div className="social-sub-text" style={{ maxWidth: '600px', marginTop: '0.2rem' }}>
              Keep in mind that upon deleting your account all of your account information will be deleted without the possibility of restoration.
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            style={{ color: '#ef4444', borderColor: '#fecaca' }}
            className="btn-pill"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </div>

      {/* Generic Field Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ ...editModal, open: false })}
        title={editModal.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal({ ...editModal, open: false })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label">{editModal.title}</label>
            <input
              type={editModal.type || 'text'}
              className="form-input"
              value={editModal.value}
              onChange={(e) => setEditModal({ ...editModal, value: e.target.value })}
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Permanently?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!deleteAck}
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => {
                showToast('Account Deletion Requested', 'Account termination scheduled.', 'error');
                setDeleteModalOpen(false);
              }}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          This will schedule the permanent deletion of your account, active VPS instances, configurations, and billing history.
        </p>

        <div className="danger-ack-box" onClick={() => setDeleteAck(!deleteAck)}>
          <input
            type="checkbox"
            checked={deleteAck}
            onChange={(e) => setDeleteAck(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span className="danger-ack-text">I understand this action cannot be undone.</span>
        </div>
      </Modal>
    </div>
  );
};
