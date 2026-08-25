import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { TerminalModal } from '../../components/vps/TerminalModal';

interface ActionLogItem {
  id: string;
  name: string;
  status: 'Success' | 'Running' | 'Failed';
  triggeredOn: string;
}

export const VpsLatestActionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  const actions: ActionLogItem[] = [
    { id: '1', name: 'docker_instance_install', status: 'Success', triggeredOn: '2026-08-24 02:18:38' },
    { id: '2', name: 'ct_set_rootpasswd', status: 'Success', triggeredOn: '2026-08-24 01:56:01' },
    { id: '3', name: 'ct_start', status: 'Success', triggeredOn: '2026-08-24 01:54:31' },
    { id: '4', name: 'ipam_delete_reverse', status: 'Success', triggeredOn: '2026-08-24 01:52:23' },
    { id: '5', name: 'ct_stop', status: 'Success', triggeredOn: '2026-08-24 01:51:47' },
    { id: '6', name: 'ct_recreate', status: 'Success', triggeredOn: '2026-08-24 01:49:27' },
    { id: '7', name: 'ipam_set_reverse', status: 'Success', triggeredOn: '2026-08-24 01:49:04' },
    { id: '8', name: 'ct_recovery_stop', status: 'Success', triggeredOn: '2026-08-24 01:47:53' },
    { id: '9', name: 'ct_recovery', status: 'Success', triggeredOn: '2026-08-24 01:46:08' },
  ];

  return (
    <div>
      {/* Top Header matching Screenshot 5 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Latest Actions</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Table Card matching Screenshot 5 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Action name</span>
                  <ArrowUpDown size={12} color="var(--text-dim)" />
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Status</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Triggered on</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {actions.map((act) => (
                <tr key={act.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {act.name}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <CheckCircle2 size={15} fill="#059669" color="white" />
                      <span>{act.status}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {act.triggeredOn}
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
    </div>
  );
};
