import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Key,
  Plus,
  Trash2,
  SlidersHorizontal,
  Copy,
  Check,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

interface SshKeyItem {
  id: string;
  name: string;
  type: string;
  publicKey: string;
}

export const VpsSshKeysPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState<SshKeyItem | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyContent, setNewKeyContent] = useState('');

  const [keys, setKeys] = useState<SshKeyItem[]>([
    {
      id: 'k-1',
      name: 'dev-workstation@macbook-pro',
      type: 'ssh-ed25519',
      publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOrf2iZ8t/nCqX2J7hKpM6kQ9wPvG4sLmF0yB3rV1xZa dev@macbook',
    },
    {
      id: 'k-2',
      name: 'ci-deployer@github-actions',
      type: 'ssh-ed25519',
      publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ3kL9mOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxY ci@deploy',
    },
  ]);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyContent.trim()) return;
    const item: SshKeyItem = {
      id: `k-${Date.now()}`,
      name: newKeyName.trim() || 'user@workstation',
      type: newKeyContent.startsWith('ssh-ed25519') ? 'ssh-ed25519' : 'ssh-rsa',
      publicKey: newKeyContent.trim(),
    };
    setKeys((prev) => [...prev, item]);
    setAddModalOpen(false);
    setNewKeyName('');
    setNewKeyContent('');
    showToast('SSH Key Added', `${item.name} added to authorized_keys.`, 'success');
  };

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast('Copied', 'Public key copied to clipboard.', 'info');
  };

  return (
    <div>
      {/* Top Header matching Screenshot 1 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>SSH keys</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Main SSH Key Card matching Screenshot 1 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>SSH Key</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              This is a list of SSH keys associated with your account. Remove any keys that you do not recognize.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="primary"
              size="sm"
              className="btn-pill"
              icon={<Plus size={14} />}
              onClick={() => setAddModalOpen(true)}
            >
              + SSH key
            </Button>
            <button className="btn-icon" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <SlidersHorizontal size={14} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '0 1.5rem' }}>
          <div className="vps-config-list">
            {keys.map((k) => (
              <div key={k.id} className="vps-config-item">
                <div className="vps-config-left">
                  <div className="vps-config-icon-box">
                    <Key size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {k.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {k.type}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="btn-pill"
                    onClick={() => setShowKeyModal(k)}
                  >
                    Show
                  </Button>

                  <button
                    className="btn-icon"
                    title="Remove key"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      setKeys((prev) => prev.filter((item) => item.id !== k.id));
                      showToast('Removed', `${k.name} removed from server.`, 'success');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Modal */}
      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}

      {/* Add SSH Key Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add SSH Key"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddKey}>Add SSH Key</Button>
          </>
        }
      >
        <form onSubmit={handleAddKey}>
          <div className="form-group">
            <label className="form-label">SSH Key Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. tusharOp@fedora"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Public Key (ssh-ed25519 or ssh-rsa)</label>
            <textarea
              className="form-input"
              rows={5}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..."
              value={newKeyContent}
              onChange={(e) => setNewKeyContent(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Show Key Modal */}
      {showKeyModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowKeyModal(null)}
          title={`Public Key: ${showKeyModal.name}`}
          footer={
            <>
              <Button
                variant="secondary"
                icon={copiedKey ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                onClick={() => handleCopyKey(showKeyModal.publicKey)}
              >
                {copiedKey ? 'Copied' : 'Copy Key'}
              </Button>
              <Button variant="primary" onClick={() => setShowKeyModal(null)}>Close</Button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Public Key Content</label>
            <textarea
              className="form-input"
              rows={5}
              readOnly
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--bg-subtle)' }}
              value={showKeyModal.publicKey}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
