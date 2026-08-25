import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsOsPanelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedOs, setSelectedOs] = useState('ubuntu-24');

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleReinstall = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('OS Reinstall Scheduled', 'Your server OS rebuild task has been queued.', 'warning');
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>OS & Panel Settings</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Reinstall OS Card */}
        <Card title="Change Operating System">
          <form onSubmit={handleReinstall} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Rebuilding the operating system will format root storage partitions. Backup important files before proceeding.
            </p>

            <div className="form-group">
              <label className="form-label">Select OS Image</label>
              <select className="form-select" value={selectedOs} onChange={(e) => setSelectedOs(e.target.value)}>
                <option value="ubuntu-24">Ubuntu 24.04 64bit (LTS)</option>
                <option value="ubuntu-22">Ubuntu 22.04 64bit (LTS)</option>
                <option value="debian-12">Debian 12 64bit (Bookworm)</option>
                <option value="almalinux-9">AlmaLinux 9 64bit</option>
                <option value="docker-ubuntu">Docker Engine on Ubuntu 24.04</option>
              </select>
            </div>

            <Button variant="danger" type="submit" icon={<RefreshCw size={14} />}>
              Reinstall Operating System
            </Button>
          </form>
        </Card>

        {/* Control Panels Card */}
        <Card title="Management Panels & Stacks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dokploy / Coolify Engine</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Self-hosted PaaS with automatic SSL and Git integration</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => showToast('PaaS Setup', 'Installing PaaS control panel...', 'success')}>
                Install
              </Button>
            </div>

            <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>cPanel / CyberPanel</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Web hosting management panel with OpenLiteSpeed</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => showToast('CyberPanel', 'Configuring LiteSpeed...', 'info')}>
                Install
              </Button>
            </div>
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
