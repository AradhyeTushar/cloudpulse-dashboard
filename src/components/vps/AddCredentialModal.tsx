import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cred: { name: string; registryUrl: string; username: string }) => void;
}

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('dockerhub');
  const [customUrl, setCustomUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const url =
        provider === 'dockerhub'
          ? 'https://index.docker.io/v1/'
          : provider === 'ghcr'
          ? 'ghcr.io'
          : provider === 'gitlab'
          ? 'registry.gitlab.com'
          : customUrl || 'https://registry.example.com';

      onAdd({
        name: name || `${provider}-credentials`,
        registryUrl: url,
        username,
      });

      showToast('Credential Saved', `Registry credentials for ${username} added.`, 'success');
      onClose();
      setName('');
      setUsername('');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Registry Credential"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Save Credential
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Registry Provider</label>
          <select
            className="form-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="dockerhub">Docker Hub (docker.io)</option>
            <option value="ghcr">GitHub Container Registry (ghcr.io)</option>
            <option value="gitlab">GitLab Registry (registry.gitlab.com)</option>
            <option value="custom">Custom Registry Server</option>
          </select>
        </div>

        {provider === 'custom' && (
          <div className="form-group">
            <label className="form-label">Registry URL</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://registry.mycompany.com"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Credential Nickname</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. production-dockerhub"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Username / Organization</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. alex-mercer"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Personal Access Token / Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="dckr_pat_..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
};
