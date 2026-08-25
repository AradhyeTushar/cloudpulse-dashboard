import React, { useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, Shield, Code2, Terminal } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
}

export const ApiPage: React.FC = () => {
  const { showToast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: 'key_1',
      name: 'CI/CD Deployment Token',
      prefix: 'cp_live_98a72c...',
      scopes: ['proxy:read', 'proxy:write', 'sessions:rotate'],
      createdAt: '2026-08-12',
      lastUsed: '2 hours ago',
    },
    {
      id: 'key_2',
      name: 'Scraper Microservice Key',
      prefix: 'cp_live_bb412e...',
      scopes: ['proxy:read'],
      createdAt: '2026-08-20',
      lastUsed: '10 minutes ago',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const secret = 'cp_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKey: ApiKey = {
      id: 'key_' + Math.random().toString(36).substring(2, 8),
      name: keyName,
      prefix: secret.substring(0, 14) + '...',
      scopes: ['proxy:read', 'sessions:rotate'],
      createdAt: 'Just now',
      lastUsed: 'Never',
    };

    setKeys([newKey, ...keys]);
    setGeneratedSecret(secret);
    setKeyName('');
  };

  const copySecret = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      showToast('Key Copied', 'API secret copied to clipboard.', 'success');
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Developer API & Access Tokens
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Programmatically query proxy telemetry, create credentials, and trigger IP rotations via REST API.
          </p>
        </div>

        <Button variant="primary" onClick={() => { setShowCreateModal(true); setGeneratedSecret(null); }}>
          <Plus size={15} style={{ marginRight: '0.4rem' }} />
          Generate New API Token
        </Button>
      </div>

      {/* API Overview & cURL Tester */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Interactive cURL Example</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
          Test querying your real-time proxy endpoints and session metrics with bearer token authentication.
        </p>

        <div
          style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#58a6ff',
            overflowX: 'auto',
          }}
        >
          <pre style={{ margin: 0 }}>
            {`curl -X GET "http://localhost:8080/api/v1/sessions" \\
  -H "Authorization: Bearer cp_live_98a72c1e89b24" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      </div>

      {/* Keys Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Personal Access Tokens</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Token Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Key Prefix</th>
                <th style={{ padding: '0.85rem 1rem' }}>Scopes</th>
                <th style={{ padding: '0.85rem 1rem' }}>Last Used</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {k.name}
                  </td>
                  <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {k.prefix}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {k.scopes.map((s, idx) => (
                        <span key={idx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: 3, background: 'var(--bg-subtle)', border: '1px solid var(--bg-border)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {k.lastUsed}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setKeys(keys.filter((x) => x.id !== k.id));
                        showToast('Token Revoked', `Revoked token ${k.name}`, 'info');
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <Modal title="Create New API Key" onClose={() => setShowCreateModal(false)}>
          {generatedSecret ? (
            <div>
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>
                  Copy your API Secret Key now
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  This secret will never be shown again for security reasons.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input type="text" className="input-field" value={generatedSecret} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
                <Button variant="primary" onClick={copySecret}>
                  <Copy size={14} style={{ marginRight: '0.35rem' }} />
                  Copy
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Token Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Scraper Backend Production"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Generate Key
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
