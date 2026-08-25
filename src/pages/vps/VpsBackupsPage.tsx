import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Camera, Plus, RefreshCw } from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance, SnapshotItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsBackupsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [snapModalOpen, setSnapModalOpen] = useState(false);
  const [snapName, setSnapName] = useState('');
  const [snapLoading, setSnapLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [found, snaps] = await Promise.all([
        vpsService.getVpsById(id),
        vpsService.getSnapshots(),
      ]);
      setVps(found);
      setSnapshots(snaps);
    };
    load();
  }, [id]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSnapLoading(true);
    try {
      const snap = await vpsService.createSnapshot(snapName || `snap-${vps?.name || 'server'}`);
      setSnapshots((prev) => [snap, ...prev]);
      setSnapModalOpen(false);
      setSnapName('');
      showToast('Snapshot Captured', `Snapshot ${snap.name} created.`, 'success');
    } finally {
      setSnapLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Backups & Monitoring</h1>
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
          title="Manual Snapshots"
          action={
            <Button
              variant="primary"
              size="sm"
              className="btn-pill"
              icon={<Plus size={14} />}
              onClick={() => setSnapModalOpen(true)}
            >
              Take Snapshot
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {snap.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Size: {(snap.sizeMB / 1024).toFixed(2)} GB • Created {snap.createdAt}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showToast('Restore Snapshot', `Rollback to ${snap.name} initiated.`, 'info')}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ color: 'var(--status-error)' }}
                    onClick={() => {
                      setSnapshots((prev) => prev.filter((s) => s.id !== snap.id));
                      showToast('Snapshot Deleted', `${snap.name} removed.`, 'success');
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
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

      <Modal
        isOpen={snapModalOpen}
        onClose={() => setSnapModalOpen(false)}
        title="Take VPS Snapshot"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSnapModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSnapshot} loading={snapLoading}>Create Snapshot</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Snapshot Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. pre-deployment-backup"
            value={snapName}
            onChange={(e) => setSnapName(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
