import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  ChevronDown,
  Square,
  Trash2,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { DockerComposeModal } from '../../components/vps/DockerComposeModal';
import { useToast } from '../../context/ToastContext';

interface DockerAppItem {
  id: string;
  name: string;
  template: string;
  status: 'running' | 'stopped';
  ports: string;
  uptime: string;
}

export const VpsDockerAppsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [apps, setApps] = useState<DockerAppItem[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'manual' | 'git' | 'template'>('manual');
  const [composeDropdownOpen, setComposeDropdownOpen] = useState(false);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleOpenCompose = (mode: 'manual' | 'git' | 'template') => {
    setComposeMode(mode);
    setComposeDropdownOpen(false);
    setComposeModalOpen(true);
  };

  const handleDeployApp = (app: { name: string; image: string; ports: string; status: 'Running' | 'Stopped' }) => {
    const newApp: DockerAppItem = {
      id: `app-${Date.now()}`,
      name: app.name || 'custom-container-stack',
      template: app.image,
      status: app.status === 'Running' ? 'running' : 'stopped',
      ports: app.ports || '8080:80',
      uptime: 'Just started',
    };
    setApps((prev) => [...prev, newApp]);
  };

  return (
    <div>
      {/* Top Header matching Screenshot 4 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Docker Manager</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {apps.length === 0 ? (
        /* Empty State Canvas matching Screenshot 4 */
        <div className="empty-state-canvas">
          <div className="empty-state-icon-art">
            <svg width="90" height="74" viewBox="0 0 90 74" fill="none">
              <rect x="5" y="8" width="80" height="58" rx="8" stroke="var(--border-strong)" strokeWidth="2" fill="var(--bg-subtle)" />
              <line x1="5" y1="20" x2="85" y2="20" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="2" fill="#ef4444" />
              <circle cx="20" cy="14" r="2" fill="#fbbf24" />
              <circle cx="26" cy="14" r="2" fill="#10b981" />
              {/* Rocket in browser */}
              <path d="M45 28L52 35L48 50L45 47L42 50L38 35L45 28Z" fill="var(--brand-primary)" opacity="0.8" />
              <circle cx="45" cy="37" r="2.5" fill="white" />
            </svg>
          </div>

          <h2 className="empty-state-title">Get started with your first deployment</h2>
          <p className="empty-state-desc">
            Use Docker Compose to deploy and manage containerized applications with simple configuration files.
          </p>

          {/* Split Compose Button matching Screenshot 4 */}
          <div style={{ position: 'relative' }}>
            <div className="reboot-split-btn">
              <button
                className="reboot-main-action"
                onClick={() => handleOpenCompose('manual')}
              >
                <span>Compose</span>
              </button>
              <button
                className="reboot-arrow-action"
                onClick={() => setComposeDropdownOpen(!composeDropdownOpen)}
                aria-label="Compose options"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {composeDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '0.35rem',
                  minWidth: '200px',
                  zIndex: 50,
                }}
              >
                <button
                  style={{ width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => handleOpenCompose('manual')}
                >
                  Compose manually
                </button>
                <button
                  style={{ width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => handleOpenCompose('git')}
                >
                  Import from repository
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Applications Table */
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Deployed Applications ({apps.length})</h3>
            <Button variant="primary" size="sm" className="btn-pill" onClick={() => handleOpenCompose('manual')}>
              + Compose
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Application Name</th>
                  <th>Template / Stack</th>
                  <th>Ports</th>
                  <th>Uptime</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.name}</td>
                    <td>{app.template}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{app.ports}</td>
                    <td>{app.uptime}</td>
                    <td>
                      <span className="status-badge status-running">Running</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button
                          className="btn-icon"
                          title="Stop container"
                          onClick={() => showToast('Container Stopped', `${app.name} halted.`, 'info')}
                        >
                          <Square size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--status-error)' }}
                          title="Delete container"
                          onClick={() => {
                            setApps((prev) => prev.filter((a) => a.id !== app.id));
                            showToast('Application Deleted', `${app.name} removed.`, 'success');
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {/* Docker Compose Modal */}
      <DockerComposeModal
        isOpen={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        mode={composeMode}
        onDeploy={handleDeployApp}
      />
    </div>
  );
};
