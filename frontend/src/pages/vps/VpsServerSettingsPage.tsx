import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Power, RotateCw, Trash2, Key } from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsServerSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    load();
  }, [id]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Server Settings</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Server Hostname & PTR Record">
          <form onSubmit={(e) => { e.preventDefault(); showToast('Hostname Saved', 'Reverse DNS PTR updated.', 'success'); }}>
            <div className="form-group">
              <label className="form-label">Server Hostname</label>
              <input type="text" className="form-input" defaultValue={vps?.hostname || ''} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" type="submit">Save Hostname</Button>
            </div>
          </form>
        </Card>

        <Card title="Power Management">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Control the hardware hypervisor state for {vps?.hostname}.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={<RotateCw size={14} />}
              onClick={() => showToast('Reboot Triggered', 'Graceful reboot signal sent.', 'info')}
            >
              Reboot VPS
            </Button>
            <Button
              variant="outline"
              icon={<Power size={14} />}
              onClick={() => showToast('Power Signal', 'Power state change signal sent.', 'info')}
            >
              Power Off
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => showToast('Destroy VPS', 'Deletion safeguard verification required.', 'warning')}
            >
              Destroy Server
            </Button>
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
