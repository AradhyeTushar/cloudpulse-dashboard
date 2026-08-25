import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Info,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsEmergencyModePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleToggleClick = () => {
    if (!isEmergencyActive) {
      // Trigger confirmation modal (Screenshot 5)
      setConfirmModalOpen(true);
    } else {
      // Turn off directly
      setIsEmergencyActive(false);
      showToast('Emergency Mode Disabled', 'Server returning to standard boot kernel.', 'success');
    }
  };

  const handleConfirmTurnOn = async () => {
    setToggling(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setIsEmergencyActive(true);
      setConfirmModalOpen(false);
      showToast('Emergency Mode Activated', 'Rescue OS mounted on /mnt. Web console ready.', 'success');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      {/* Top Header matching Screenshots 4 & 5 */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Emergency mode</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. EMERGENCY MODE TOGGLE CARD (Screenshots 4 & 5)
         ===================================================================== */}
      <div className="emergency-card-container">
        <div className="emergency-info-row">
          <div className={`emergency-beacon-avatar ${isEmergencyActive ? 'active' : ''}`}>
            {/* Siren / Beacon Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="M20 12h2" />
              <path d="m19.07 4.93-1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12" />
              <path d="M9 18v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2" />
            </svg>
          </div>

          <div>
            <div className="emergency-mode-title-row">
              <span className="emergency-mode-title">Emergency mode</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: isEmergencyActive ? '#fef2f2' : 'var(--bg-subtle)',
                  color: isEmergencyActive ? '#ef4444' : 'var(--text-muted)',
                  border: `1px solid ${isEmergencyActive ? '#fecaca' : 'var(--border-color)'}`,
                }}
              >
                {isEmergencyActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="emergency-mode-desc">
              Activate emergency mode to fix startup problem or data backup on your VPS. Your file system can be found on <strong>/mnt</strong> directory.
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <label className="toggle-switch-wrap" onClick={(e) => e.preventDefault()}>
          <input
            type="checkbox"
            checked={isEmergencyActive}
            onChange={handleToggleClick}
          />
          <span className="toggle-switch-slider" onClick={handleToggleClick} />
        </label>
      </div>

      {/* Terminal Modal */}
      {vps && (
        <TerminalModal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          vps={vps}
        />
      )}

      {/* =====================================================================
          2. "Turn on emergency mode?" MODAL (Exact match to Screenshot 5)
         ===================================================================== */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Turn on emergency mode?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} disabled={toggling}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ background: '#111827', borderColor: '#111827', color: 'white' }}
              onClick={handleConfirmTurnOn}
              loading={toggling}
            >
              Next
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Use emergency mode to fix issues with your VPS. You'll be able to access your files in the <strong>/mnt</strong> folder. Turn it off to return your VPS to its previous state.
          </p>

          <div className="emergency-callout-box">
            <Info size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <span>Some VPS actions aren't available in emergency mode.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
