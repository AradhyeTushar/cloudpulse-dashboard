import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostname: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  hostname,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('Root Password Reset', `New root credentials injected into ${hostname}.`, 'success');
      onClose();
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Root Password"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReset} loading={loading}>
            Set New Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleReset}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Enter a new root password for <strong>{hostname}</strong>. This requires a quick password injection into the cloud-init environment.
        </p>
        <div className="form-group">
          <label className="form-label">New Root Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="At least 10 characters..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
};
