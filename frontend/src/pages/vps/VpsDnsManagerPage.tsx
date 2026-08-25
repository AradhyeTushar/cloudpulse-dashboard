import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

interface DomainItem {
  id: string;
  name: string;
  nameservers: string[];
  status: 'Active' | 'Pending';
}

export const VpsDnsManagerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<DomainItem[]>([
    {
      id: 'd-1',
      name: 'cloudhost-app.io',
      nameservers: ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
      status: 'Active',
    },
  ]);

  const [editDnsModal, setEditDnsModal] = useState<DomainItem | null>(null);
  const [copiedNs, setCopiedNs] = useState<string | null>(null);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    const newDom: DomainItem = {
      id: `d-${Date.now()}`,
      name: domainInput.trim().toLowerCase(),
      nameservers: ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
      status: 'Active',
    };
    setDomains((prev) => [newDom, ...prev]);
    setDomainInput('');
    showToast('Domain Added', `${newDom.name} connected to DNS Manager.`, 'success');
  };

  const handleCopyNs = (ns: string) => {
    navigator.clipboard.writeText(ns);
    setCopiedNs(ns);
    setTimeout(() => setCopiedNs(null), 2000);
    showToast('Copied', `${ns} copied to clipboard.`, 'info');
  };

  return (
    <div>
      {/* Top Header matching Screenshot 3 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>DNS Manager</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. ADD DOMAIN CARD (Screenshot 3)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Add domain</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Add domain to this account and manage it from domains dashboard
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '0.75rem', maxWidth: '800px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your domain name"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
            />
            <Button variant="primary" type="submit" style={{ flexShrink: 0, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
              Add
            </Button>
          </form>
        </div>
      </div>

      {/* =====================================================================
          2. DOMAINS TABLE CARD (Screenshot 3)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Domain name</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>Assigned nameservers</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((dom) => (
                <tr key={dom.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {dom.name}
                  </td>
                  <td>
                    <div className="nameserver-stack">
                      {dom.nameservers.map((ns, idx) => (
                        <div key={idx} className="nameserver-item">
                          <span>{ns}</span>
                          <button
                            type="button"
                            className="cred-copy-icon"
                            title="Copy nameserver"
                            onClick={() => handleCopyNs(ns)}
                          >
                            {copiedNs === ns ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <CheckCircle2 size={15} fill="#059669" color="white" />
                      <span>{dom.status}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-pill"
                      onClick={() => setEditDnsModal(dom)}
                    >
                      Edit DNS
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Screenshot 3 */}
        <div className="table-pagination-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Page size:</span>
            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.6rem', fontSize: '0.775rem' }}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>1 to {domains.length} of {domains.length}</span>
          </div>

          <div className="pagination-controls-group">
            <button className="pagination-arrow-btn" disabled><ChevronsLeft size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Page 1 of 1</span>
            <button className="pagination-arrow-btn" disabled><ChevronRight size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronsRight size={14} /></button>
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

      {/* Edit DNS Records Modal */}
      {editDnsModal && (
        <Modal
          isOpen={true}
          onClose={() => setEditDnsModal(null)}
          title={`DNS Zone Records: ${editDnsModal.name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditDnsModal(null)}>Close</Button>
              <Button variant="primary" onClick={() => { showToast('DNS Saved', 'Zone file updated.', 'success'); setEditDnsModal(null); }}>Save Records</Button>
            </>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Points to</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>A</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>@</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{vps?.ipAddress || '200.234.41.58'}</td>
                  <td>14400</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>CNAME</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>www</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{editDnsModal.name}</td>
                  <td>14400</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};
