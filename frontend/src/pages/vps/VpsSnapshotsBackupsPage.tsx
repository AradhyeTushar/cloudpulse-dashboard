import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsSnapshotsBackupsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleSaveSchedule = () => {
    showToast('Schedule Saved', `Backup schedule set to ${schedule}.`, 'success');
    setScheduleModalOpen(false);
  };

  return (
    <div>
      {/* Top Header matching Screenshot 3 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Snapshots & Backups</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Upgrade to Automated Daily Backups Promo Banner (Screenshot 3) */}
      {promoVisible && (
        <div className="backup-promo-card">
          <div className="backup-promo-left">
            <div className="backup-calendar-icon">
              <Calendar size={18} />
            </div>
            <div>
              <div className="backup-promo-title">Upgrade to automated daily backups</div>
              <div className="backup-promo-desc">Protect your data every day with automatic backups and quick data recovery.</div>
            </div>
          </div>

          <div className="backup-promo-right">
            <div className="backup-promo-price">
              ₹ 589.00 <span>/mo</span>
            </div>
            <button
              className="backup-promo-btn"
              onClick={() => showToast('Upgrade Initiated', 'Daily backups activated.', 'success')}
            >
              Upgrade
            </button>
            <button
              className="btn-icon"
              onClick={() => setPromoVisible(false)}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Empty State Canvas matching Screenshot 3 */}
      <div className="empty-state-canvas">
        <div className="empty-state-icon-art">
          {/* Cylinder / Disk stack SVG illustration */}
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <ellipse cx="35" cy="20" rx="20" ry="8" stroke="var(--border-strong)" strokeWidth="2" fill="var(--bg-subtle)" />
            <path d="M15 20V34C15 38.4183 23.9543 42 35 42C46.0457 42 55 38.4183 55 34V20" stroke="var(--border-strong)" strokeWidth="2" />
            <path d="M15 34V48C15 52.4183 23.9543 56 35 56C46.0457 56 55 52.4183 55 48V34" stroke="var(--border-strong)" strokeWidth="2" />
            {/* Circular refresh badge */}
            <circle cx="48" cy="48" r="9" fill="var(--bg-surface)" stroke="var(--border-color)" strokeWidth="2" />
            <path d="M48 44a4 4 0 1 1-3.5 2" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="empty-state-title">There are no backups yet</h2>
        <p className="empty-state-desc">
          Backups are run automatically, based on your chosen schedule. Once created, they'll appear here.
        </p>

        <Button
          variant="secondary"
          className="btn-pill"
          onClick={() => setScheduleModalOpen(true)}
          style={{ marginBottom: '1.25rem' }}
        >
          Manage backup schedule
        </Button>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Current backup schedule: <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{schedule}</span>
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

      {/* Manage Backup Schedule Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Manage Backup Schedule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSchedule}>Save Schedule</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Automatic Backup Frequency</label>
          <select
            className="form-select"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as any)}
          >
            <option value="daily">Daily (High protection)</option>
            <option value="weekly">Weekly (Standard)</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};
