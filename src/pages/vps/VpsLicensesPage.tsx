import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Plus, Key } from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsLicensesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Licenses</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card
          title="Active Software & Panel Licenses"
          action={
            <Button
              variant="primary"
              size="sm"
              className="btn-pill"
              icon={<Plus size={14} />}
              onClick={() => showToast('Attach License', 'License activation modal.', 'info')}
            >
              + Add License
            </Button>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>License Key</th>
                  <th>Status</th>
                  <th>Expiration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Ubuntu Pro (LTS 10-Year Security)</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>C1488920-UBPRO-ENT-COMM</td>
                  <td>
                    <span className="status-badge status-running">Active</span>
                  </td>
                  <td>2034-04-20</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => showToast('Manage License', 'Opening license details...', 'info')}>
                      Manage
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}
    </div>
  );
};
