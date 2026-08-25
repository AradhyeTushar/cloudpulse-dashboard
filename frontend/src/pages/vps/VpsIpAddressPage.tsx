import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

interface IpEntry {
  type: 'IPv4' | 'IPv6';
  address: string;
  reverseDns: string;
}

export const VpsIpAddressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const [ipList, setIpList] = useState<IpEntry[]>([
    { type: 'IPv4', address: '200.234.41.58', reverseDns: 'srv1920898.hstgr.cloud' },
    { type: 'IPv6', address: '2a02:4780:63:3894::1', reverseDns: '-' },
  ]);

  const [ptrModal, setPtrModal] = useState<{ open: boolean; ip: string; initialDns: string; index: number }>({
    open: false,
    ip: '',
    initialDns: '',
    index: 0,
  });

  const [ptrInput, setPtrInput] = useState('');

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      if (found) {
        setVps(found);
        setIpList([
          { type: 'IPv4', address: found.ipAddress, reverseDns: found.hostname },
          { type: 'IPv6', address: found.ipv6Address || '2a02:4780:63:3894::1', reverseDns: '-' },
        ]);
      }
    };
    loadVps();
  }, [id]);

  const handleOpenSetPtr = (entry: IpEntry, index: number) => {
    setPtrModal({
      open: true,
      ip: entry.address,
      initialDns: entry.reverseDns === '-' ? `${vps?.name || 'server'}.hstgr.cloud` : entry.reverseDns,
      index,
    });
    setPtrInput(entry.reverseDns === '-' ? `${vps?.name || 'server'}.hstgr.cloud` : entry.reverseDns);
  };

  const handleSavePtr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptrInput) return;
    const updated = [...ipList];
    updated[ptrModal.index] = { ...updated[ptrModal.index], reverseDns: ptrInput };
    setIpList(updated);
    setPtrModal({ ...ptrModal, open: false });
    showToast('PTR Record Updated', `Reverse DNS for ${ptrModal.ip} set to ${ptrInput}.`, 'success');
  };

  const handleDeletePtr = (index: number) => {
    const updated = [...ipList];
    const targetIp = updated[index].address;
    updated[index] = { ...updated[index], reverseDns: '-' };
    setIpList(updated);
    showToast('PTR Record Removed', `Reverse DNS PTR record for ${targetIp} deleted.`, 'success');
  };

  return (
    <div>
      {/* Top Header matching Screenshot 3 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>IP address</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Table Card matching Screenshot 3 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Type</th>
                <th>IP Address</th>
                <th>Reverse DNS</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ipList.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{entry.type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {entry.address}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: entry.reverseDns === '-' ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                    {entry.reverseDns}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="ptr-actions-cell">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="btn-pill"
                        onClick={() => handleOpenSetPtr(entry, idx)}
                      >
                        Set PTR record
                      </Button>

                      {entry.reverseDns !== '-' && (
                        <button
                          className="delete-ptr-link"
                          onClick={() => handleDeletePtr(idx)}
                        >
                          Delete PTR record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Set PTR Record Modal */}
      <Modal
        isOpen={ptrModal.open}
        onClose={() => setPtrModal({ ...ptrModal, open: false })}
        title={`Set Reverse DNS (PTR) for ${ptrModal.ip}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPtrModal({ ...ptrModal, open: false })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePtr}>
              Save PTR Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePtr}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Enter a domain name that resolves back to <strong>{ptrModal.ip}</strong> for Reverse DNS verification.
          </p>
          <div className="form-group">
            <label className="form-label">Domain Name / Hostname</label>
            <input
              type="text"
              className="form-input"
              value={ptrInput}
              onChange={(e) => setPtrInput(e.target.value)}
              placeholder="e.g. mail.example.com"
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
