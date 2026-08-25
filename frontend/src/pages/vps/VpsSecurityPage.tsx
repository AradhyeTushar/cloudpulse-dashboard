import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance, FirewallRule } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsSecurityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form
  const [port, setPort] = useState('');
  const [protocol, setProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [source, setSource] = useState('0.0.0.0/0');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    load();
  }, [id]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!port) return;
    const newRule: FirewallRule = {
      id: `rule-${Date.now()}`,
      type: 'Inbound',
      protocol,
      portRange: port,
      source: source || '0.0.0.0/0',
      action: 'ACCEPT',
      description: desc || `Port ${port} rule`,
    };
    setRules((prev) => [...prev, newRule]);
    setAddModalOpen(false);
    setPort('');
    setDesc('');
    showToast('Firewall Rule Created', `Allow ${protocol} traffic on port ${port}.`, 'success');
  };

  return (
    <div>
      {/* Top Header matching Screenshot 2 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Firewall</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {rules.length === 0 ? (
        /* Empty State Canvas matching Screenshot 2 */
        <div className="empty-state-canvas">
          <div className="empty-state-icon-art" style={{ width: '120px', height: '90px' }}>
            {/* Brick Wall + Gear + Shield with Flame SVG */}
            <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
              <circle cx="28" cy="24" r="8" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
              <rect x="28" y="24" width="46" height="42" stroke="#cbd5e1" strokeWidth="1.5" fill="var(--bg-subtle)" />
              <line x1="28" y1="38" x2="74" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="28" y1="52" x2="74" y2="52" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="51" y1="24" x2="51" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="40" y1="38" x2="40" y2="52" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="62" y1="38" x2="62" y2="52" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="51" y1="52" x2="51" y2="66" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Front Shield */}
              <path
                d="M74 38L60 44V56C60 65 65.5 73.5 74 76C82.5 73.5 88 65 88 56V44L74 38Z"
                fill="var(--bg-surface)"
                stroke="var(--border-strong)"
                strokeWidth="1.75"
              />
              <path
                d="M74 48c0 0-4 4-4 8a4 4 0 0 0 8 0c0-4-4-8-4-8z"
                stroke="var(--brand-primary)"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          <h2 className="empty-state-title">Protect your VPS with a firewall</h2>
          <p className="empty-state-desc">
            Create firewall rules to control incoming and outgoing traffic and keep your server secure.
          </p>

          <Button
            variant="primary"
            className="btn-pill"
            icon={<Plus size={14} />}
            onClick={() => setAddModalOpen(true)}
            style={{ marginBottom: '1rem' }}
          >
            + Firewall
          </Button>

          <div>
            <a
              href="#learn"
              onClick={(e) => { e.preventDefault(); showToast('Firewall Guide', 'Opening firewall documentation...', 'info'); }}
              style={{ color: 'var(--brand-primary-text)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Learn more</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      ) : (
        /* Active Rules Table */
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Configured Firewall Rules ({rules.length})</h3>
            <Button
              variant="primary"
              size="sm"
              className="btn-pill"
              icon={<Plus size={14} />}
              onClick={() => setAddModalOpen(true)}
            >
              + Add Rule
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Protocol</th>
                  <th>Port Range</th>
                  <th>Source CIDR</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td><span style={{ fontWeight: 600 }}>{r.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.protocol}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.portRange}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.source}</td>
                    <td>
                      <span className="status-badge status-running">
                        {r.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.description}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                        onClick={() => {
                          setRules((prev) => prev.filter((item) => item.id !== r.id));
                          showToast('Rule Deleted', `Port ${r.portRange} rule removed.`, 'success');
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
      )}

      {/* Terminal Modal */}
      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}

      {/* Add Firewall Rule Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Firewall Rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddRule}>Create Rule</Button>
          </>
        }
      >
        <form onSubmit={handleAddRule}>
          <div className="form-group">
            <label className="form-label">Port Range</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 80, 443, 3000-3010"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Protocol</label>
            <select
              className="form-select"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as any)}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Source CIDR</label>
            <input
              type="text"
              className="form-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="0.0.0.0/0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Web HTTPS Traffic"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
