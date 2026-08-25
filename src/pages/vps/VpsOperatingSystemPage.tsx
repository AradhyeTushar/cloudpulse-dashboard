import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Search,
  Star,
  RefreshCw,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

interface OsItem {
  id: string;
  name: string;
  category: 'plain' | 'panel' | 'app';
  starred?: boolean;
  color: string;
  version: string;
}

export const VpsOperatingSystemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'plain' | 'panel' | 'app'>('plain');
  const [search, setSearch] = useState('');
  const [selectedOs, setSelectedOs] = useState<string>('Ubuntu');
  const [reinstallModalOpen, setReinstallModalOpen] = useState(false);
  const [reinstallAck, setReinstallAck] = useState(false);
  const [reinstalling, setReinstalling] = useState(false);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const osList: OsItem[] = [
    { id: 'almalinux', name: 'AlmaLinux', category: 'plain', starred: true, color: '#ff4d4d', version: '9.4 64bit' },
    { id: 'debian', name: 'Debian', category: 'plain', starred: true, color: '#d70a53', version: '12 64bit (Bookworm)' },
    { id: 'rocky', name: 'Rocky Linux', category: 'plain', starred: true, color: '#10b981', version: '9.4 64bit' },
    { id: 'ubuntu', name: 'Ubuntu', category: 'plain', starred: true, color: '#e95420', version: '26.04 / 24.04 LTS' },
    { id: 'alpine', name: 'Alpine Linux', category: 'plain', color: '#0d597f', version: '3.20' },
    { id: 'arch', name: 'Arch Linux', category: 'plain', color: '#1793d1', version: 'Rolling 2026' },
    { id: 'centos', name: 'CentOS', category: 'plain', color: '#9333ea', version: 'Stream 9' },
    { id: 'cloudlinux', name: 'CloudLinux', category: 'plain', color: '#3b82f6', version: '8.9' },
    { id: 'fedora', name: 'Fedora Cloud', category: 'plain', color: '#294172', version: '40' },
    { id: 'kali', name: 'Kali Linux', category: 'plain', color: '#000000', version: '2026.2' },
    { id: 'nixos', name: 'NixOS 26.05', category: 'plain', color: '#5277c3', version: '26.05' },
    { id: 'opensuse', name: 'openSUSE', category: 'plain', color: '#73ba25', version: 'Leap 15.6' },
    // Panels
    { id: 'cpanel', name: 'cPanel & WHM', category: 'panel', color: '#ff6c2c', version: 'v118' },
    { id: 'cyberpanel', name: 'CyberPanel', category: 'panel', color: '#0066cc', version: 'OpenLiteSpeed' },
    { id: 'coolify', name: 'Coolify PaaS', category: 'panel', starred: true, color: '#6b46c1', version: 'v4' },
    { id: 'dokploy', name: 'Dokploy PaaS', category: 'panel', starred: true, color: '#10b981', version: 'v0.8' },
    // Apps
    { id: 'docker-app', name: 'Docker + Ubuntu 24.04', category: 'app', starred: true, color: '#0db7ed', version: 'Docker 26.1' },
    { id: 'n8n-app', name: 'n8n Automation Stack', category: 'app', color: '#ea4c89', version: 'v1.45' },
  ];

  const filteredOs = osList.filter(
    (o) => o.category === selectedTab && o.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmReinstall = async () => {
    setReinstalling(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      showToast('OS Reinstall Initiated', `Server is being rebuilt with ${selectedOs}.`, 'success');
      setReinstallModalOpen(false);
      setReinstallAck(false);
    } finally {
      setReinstalling(false);
    }
  };

  return (
    <div>
      {/* Top Header matching Screenshot 2 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Operating System</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. CURRENT OS CARD (Screenshot 2)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Current OS</h2>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#fff1eb',
                color: '#e95420',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              U
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ubuntu 26.04
            </span>
          </div>

          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '900px' }}>
            Ubuntu is a computer operating system based on the Debian Linux distribution and distributed as free and open source software, using its own desktop environment. Ubuntu is designed primarily for use on personal computers, although a server edition also exists.
          </p>
        </div>
      </div>

      {/* =====================================================================
          2. CHANGE OS CARD (Screenshot 2)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ alignItems: 'center' }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Change OS</h2>
        </div>

        <div className="card-body">
          {/* Filter Bar */}
          <div className="os-filter-bar">
            <div className="os-tab-pills">
              <button
                type="button"
                className={`os-tab-pill ${selectedTab === 'plain' ? 'active' : ''}`}
                onClick={() => setSelectedTab('plain')}
              >
                Plain OS
              </button>
              <button
                type="button"
                className={`os-tab-pill ${selectedTab === 'panel' ? 'active' : ''}`}
                onClick={() => setSelectedTab('panel')}
              >
                Control panel
              </button>
              <button
                type="button"
                className={`os-tab-pill ${selectedTab === 'app' ? 'active' : ''}`}
                onClick={() => setSelectedTab('app')}
              >
                Applications
              </button>
            </div>

            <div className="os-search-input-wrap">
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search OS"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* OS Distribution Cards Grid */}
          <div className="os-cards-grid">
            {filteredOs.map((os) => (
              <div
                key={os.id}
                className={`os-card-item ${selectedOs === os.name ? 'selected' : ''}`}
                onClick={() => setSelectedOs(os.name)}
              >
                <div className="os-card-left">
                  <div
                    className="os-logo-box"
                    style={{ background: `${os.color}15`, color: os.color, borderRadius: '6px' }}
                  >
                    {os.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="os-card-name">{os.name}</span>
                </div>

                {os.starred && (
                  <Star size={14} className="os-star-icon" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. REINSTALL OS BOTTOM CARD (Screenshot 2)
         ===================================================================== */}
      <div className="card">
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="vps-config-icon-box">
              <RefreshCw size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                Reinstall OS
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Selected image: <strong>{selectedOs}</strong>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            className="btn-pill"
            onClick={() => {
              setReinstallAck(false);
              setReinstallModalOpen(true);
            }}
          >
            Reinstall
          </Button>
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

      {/* Reinstall Confirmation Modal */}
      <Modal
        isOpen={reinstallModalOpen}
        onClose={() => setReinstallModalOpen(false)}
        title={`Reinstall OS with ${selectedOs}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReinstallModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!reinstallAck}
              onClick={handleConfirmReinstall}
              loading={reinstalling}
            >
              Confirm Reinstall
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Reinstalling the operating system will format the virtual disk partitions. All files and configurations currently stored on root will be wiped.
        </p>

        <div className="danger-ack-box" onClick={() => setReinstallAck(!reinstallAck)}>
          <input
            type="checkbox"
            checked={reinstallAck}
            onChange={(e) => setReinstallAck(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span className="danger-ack-text">I understand that all data on this VPS will be permanently erased.</span>
        </div>
      </Modal>
    </div>
  );
};
