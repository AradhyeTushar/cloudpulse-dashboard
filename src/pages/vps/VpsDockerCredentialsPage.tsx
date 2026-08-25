import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Plus,
  KeyRound,
  Trash2,
  Lock,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { AddCredentialModal } from '../../components/vps/AddCredentialModal';
import { useToast } from '../../context/ToastContext';

interface RegistryCredential {
  id: string;
  name: string;
  registryUrl: string;
  username: string;
}

export const VpsDockerCredentialsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [credentials, setCredentials] = useState<RegistryCredential[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleAddCredential = (cred: Omit<RegistryCredential, 'id'>) => {
    const newCred: RegistryCredential = {
      ...cred,
      id: `cred-${Date.now()}`,
    };
    setCredentials((prev) => [...prev, newCred]);
  };

  return (
    <div>
      {/* Top Header matching Screenshot 5 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Credentials</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {credentials.length === 0 ? (
        /* Empty State matching Screenshot 5 */
        <div className="empty-state-canvas">
          <div className="empty-state-icon-art">
            <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
              <path
                d="M4 14C4 10.6863 6.68629 8 10 8H26L34 16H70C73.3137 16 76 18.6863 76 22V56C76 59.3137 73.3137 62 70 62H10C6.68629 62 4 59.3137 4 56V14Z"
                fill="var(--bg-subtle)"
                stroke="var(--border-color)"
                strokeWidth="2"
              />
              <circle cx="40" cy="38" r="11" stroke="var(--brand-primary)" strokeWidth="2" fill="none" opacity="0.6" />
              <path d="M40 33v5l3 3" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>

          <h2 className="empty-state-title">Add credentials to access private registry</h2>
          <p className="empty-state-desc">
            Use your credentials to pull Docker images from private registry.
          </p>

          <Button
            variant="primary"
            className="btn-pill"
            icon={<Plus size={16} />}
            onClick={() => setAddModalOpen(true)}
          >
            + Credential
          </Button>
        </div>
      ) : (
        /* Credentials List Table */
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={18} color="var(--brand-primary)" />
              <h3 className="card-title">Saved Registry Credentials ({credentials.length})</h3>
            </div>
            <Button variant="primary" size="sm" className="btn-pill" onClick={() => setAddModalOpen(true)}>
              + Add Credential
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Registry URL</th>
                  <th>Username</th>
                  <th>Token Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr key={cred.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cred.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{cred.registryUrl}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{cred.username}</td>
                    <td>
                      <span className="status-badge status-running">
                        <Lock size={12} style={{ marginRight: '3px' }} />
                        <span>Encrypted (AES-256)</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        title="Delete Credential"
                        onClick={() => {
                          setCredentials((prev) => prev.filter((c) => c.id !== cred.id));
                          showToast('Deleted', `${cred.name} removed.`, 'success');
                        }}
                        style={{ color: 'var(--status-error)' }}
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
      )}

      {/* Terminal Modal */}
      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}

      {/* Add Credential Modal */}
      <AddCredentialModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddCredential}
      />
    </div>
  );
};
