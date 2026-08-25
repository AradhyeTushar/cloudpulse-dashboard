import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Pencil,
  X,
  Calendar,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance, OperatingSystem } from '../../types';
import { Sparkline } from '../../components/vps/Sparkline';
import { RadialGauge } from '../../components/vps/RadialGauge';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { ResetPasswordModal } from '../../components/vps/ResetPasswordModal';
import { EditSpecModal } from '../../components/vps/EditSpecModal';
import { useToast } from '../../context/ToastContext';

export const VpsOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rebootDropdownOpen, setRebootDropdownOpen] = useState(false);
  const [promoBannerVisible, setPromoBannerVisible] = useState(true);

  // Modals
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [resetPassOpen, setResetPassOpen] = useState(false);
  const [editSpecState, setEditSpecState] = useState<{ open: boolean; title: string; field: string; value: string }>({
    open: false,
    title: '',
    field: '',
    value: '',
  });

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      setVps(found);
    };
    loadVps();
  }, [id]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast('Copied', `${fieldName} copied to clipboard.`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReboot = async (force = false) => {
    setRebootDropdownOpen(false);
    if (!vps) return;
    showToast(
      force ? 'Force Resetting VPS...' : 'Rebooting VPS...',
      `${vps.hostname} signal sent.`,
      'info'
    );
    await vpsService.updateVpsStatus(vps.id, 'Running');
  };

  const handleOpenEdit = (title: string, field: string, value: string) => {
    setEditSpecState({
      open: true,
      title,
      field,
      value,
    });
  };

  const handleSaveSpec = (field: string, newValue: string) => {
    if (!vps) return;
    if (field === 'hostname') setVps({ ...vps, hostname: newValue });
    else if (field === 'region') setVps({ ...vps, region: newValue });
    else if (field === 'os') setVps({ ...vps, os: newValue as OperatingSystem, osVersion: newValue });
    showToast('Updated', `${field} updated successfully.`, 'success');
  };

  if (!vps) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading server details...
      </div>
    );
  }

  // Sparkline data
  const cpuSparkline = [8, 12, 10, 15, 14, 18, 16, 22, 19, 11, 14, 11];
  const memSparkline = [20, 21, 22, 23, 24, 24, 23, 24, 25, 24, 24, 24];
  const inTrafficSparkline = [10, 40, 25, 80, 50, 90, 45, 70, 85, 90.4];
  const outTrafficSparkline = [2, 3, 4, 3, 5, 4, 6, 5, 4, 5.4];

  const sshUsername = 'root';
  const serverLocation = vps.region === 'US East' ? 'India - Mumbai 2' : vps.region;
  const serverOsDisplay = 'Ubuntu 26.04';
  const serverUptime = '1 day 2 hours';
  const backupFrequency = 'Weekly';

  return (
    <div>
      {/* =====================================================================
          1. TOP SERVER BANNER CARD (Screenshots 2 & 3)
         ===================================================================== */}
      <div className="server-banner-card">
        <div className="server-banner-top">
          <div className="server-banner-info">
            <div className="server-os-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="5.5" r="1.8" />
                <circle cx="6.5" cy="15.5" r="1.8" />
                <circle cx="17.5" cy="15.5" r="1.8" />
              </svg>
            </div>

            <div>
              <div className="server-banner-title-row">
                <span className="server-banner-title">{serverOsDisplay}</span>
                <span className="status-badge status-running">
                  <span className="status-dot status-running" />
                  <span>Running</span>
                </span>
              </div>
              <div className="server-banner-subtitle">
                {vps.plan} • {vps.hostname}
              </div>
            </div>
          </div>

          <div className="server-banner-actions">
            {/* Split Reboot Button */}
            <div style={{ position: 'relative' }}>
              <div className="reboot-split-btn">
                <button className="reboot-main-action" onClick={() => handleReboot(false)}>
                  <span>Reboot</span>
                </button>
                <button
                  className="reboot-arrow-action"
                  onClick={() => setRebootDropdownOpen(!rebootDropdownOpen)}
                  aria-label="Reboot options"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {rebootDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '0.35rem',
                    minWidth: '160px',
                    zIndex: 50,
                  }}
                >
                  <button
                    style={{ width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleReboot(false)}
                  >
                    Graceful Reboot
                  </button>
                  <button
                    style={{ width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.8125rem', color: 'var(--status-error)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleReboot(true)}
                  >
                    Force Power Reset
                  </button>
                </div>
              )}
            </div>

            {/* Terminal Top Button */}
            <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
              <span>Terminal</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Server Credentials Row */}
        <div className="server-credentials-row">
          <div className="cred-item">
            <span className="cred-label">SSH username:</span>
            <span className="cred-value">{sshUsername}</span>
            <button
              className="cred-copy-icon"
              title="Copy username"
              onClick={() => handleCopy(sshUsername, 'SSH username')}
            >
              {copiedField === 'SSH username' ? <Check size={13} color="var(--status-running)" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="cred-item">
            <span className="cred-label">IPv4:</span>
            <span className="cred-value">{vps.ipAddress}</span>
            <button
              className="cred-copy-icon"
              title="Copy IPv4"
              onClick={() => handleCopy(vps.ipAddress, 'IPv4')}
            >
              {copiedField === 'IPv4' ? <Check size={13} color="var(--status-running)" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="cred-item">
            <span className="cred-label">Forgot root password?</span>
            <button className="cred-link-btn" onClick={() => setResetPassOpen(true)}>
              Reset password
            </button>
          </div>

          <div className="cred-item" style={{ marginLeft: 'auto' }}>
            <span className="cred-label">Root access:</span>
            <span className="cred-value">ssh {sshUsername}@{vps.ipAddress}</span>
            <button
              className="cred-copy-icon"
              title="Copy SSH command"
              onClick={() => handleCopy(`ssh ${sshUsername}@${vps.ipAddress}`, 'SSH Command')}
            >
              {copiedField === 'SSH Command' ? <Check size={13} color="var(--status-running)" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. SIX METRIC SPARKLINE & GAUGE CARDS (Screenshots 2 & 3)
         ===================================================================== */}
      <div className="overview-metrics-grid">
        {/* 1. CPU Usage */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>CPU usage</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">11%</div>
          </div>
          <div className="sparkline-container">
            <Sparkline data={cpuSparkline} color="#5c3cf6" />
          </div>
        </div>

        {/* 2. Memory Usage */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>Memory usage</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">24%</div>
          </div>
          <div className="sparkline-container">
            <Sparkline data={memSparkline} color="#5c3cf6" />
          </div>
        </div>

        {/* 3. Disk Usage */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>Disk usage</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">
              28 GB <span className="metric-stat-total">/ 100 GB</span>
            </div>
          </div>
          <div className="gauge-container">
            <RadialGauge percent={28} />
          </div>
        </div>

        {/* 4. Incoming Traffic */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>Incoming traffic</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">90.4 MB</div>
          </div>
          <div className="sparkline-container">
            <Sparkline data={inTrafficSparkline} color="#ef4444" />
          </div>
        </div>

        {/* 5. Outgoing Traffic */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>Outgoing traffic</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">5.4 MB</div>
          </div>
          <div className="sparkline-container">
            <Sparkline data={outTrafficSparkline} color="#5c3cf6" />
          </div>
        </div>

        {/* 6. Bandwidth */}
        <div className="overview-metric-card" onClick={() => navigate(`/vps/${vps.id}/backups/usage`)}>
          <div className="metric-info-col">
            <div className="metric-header-link">
              <span>Bandwidth</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>›</span>
            </div>
            <div className="metric-stat-val">
              0.006 TB <span className="metric-stat-total">/ 8 TB</span>
            </div>
          </div>
          <div className="gauge-container">
            <RadialGauge percent={1} />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. FOUR QUICK SETTING ACTION CARDS (Screenshot 2)
         ===================================================================== */}
      <div className="quick-settings-grid">
        {/* 1. SSH key */}
        <div className="quick-setting-card" onClick={() => navigate(`/vps/${vps.id}/settings/ssh-keys`)}>
          <div className="quick-setting-top-row">
            <span className="quick-setting-title">SSH key</span>
            <ChevronRight size={14} color="var(--text-dim)" />
          </div>
          <div className="quick-setting-value">Manage</div>
        </div>

        {/* 2. Firewall rules */}
        <div className="quick-setting-card" onClick={() => navigate(`/vps/${vps.id}/security/firewall`)}>
          <div className="quick-setting-top-row">
            <span className="quick-setting-title">Firewall rules</span>
            <ChevronRight size={14} color="var(--text-dim)" />
          </div>
          <div className="quick-setting-value">0</div>
        </div>

        {/* 3. Snapshot & backups */}
        <div className="quick-setting-card" onClick={() => navigate(`/vps/${vps.id}/backups/snapshots`)}>
          <div className="quick-setting-top-row">
            <span className="quick-setting-title">Snapshot & backups</span>
            <ChevronRight size={14} color="var(--text-dim)" />
          </div>
          <div className="quick-setting-value">0</div>
        </div>

        {/* 4. Malware scanner */}
        <div className="quick-setting-card" onClick={() => navigate(`/vps/${vps.id}/security/malware`)}>
          <div className="quick-setting-top-row">
            <span className="quick-setting-title">Malware scanner</span>
            <ChevronRight size={14} color="var(--text-dim)" />
          </div>
          <div className="quick-setting-value" style={{ fontSize: '0.875rem' }}>Not installed</div>
        </div>
      </div>

      {/* =====================================================================
          4. DAILY BACKUPS PROMO BANNER (Screenshot 2)
         ===================================================================== */}
      {promoBannerVisible && (
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
              onClick={() => showToast('Upgraded', 'Daily backup schedule activated.', 'success')}
            >
              Upgrade
            </button>
            <button
              className="btn-icon"
              onClick={() => setPromoBannerVisible(false)}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. TWO BOTTOM SPEC CARDS (VPS details & Plan details - Screenshot 2)
         ===================================================================== */}
      <div className="specs-two-col-grid">
        {/* VPS details Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">VPS details</h3>
          </div>
          <div className="card-body" style={{ padding: '0 1.5rem 0.5rem' }}>
            <div className="spec-detail-row">
              <span className="spec-row-label">Server location</span>
              <div className="spec-row-value-group">
                <span>{serverLocation}</span>
                <span className="spec-edit-pencil" onClick={() => handleOpenEdit('Change Server Location', 'region', serverLocation)}>
                  <Pencil size={13} />
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">OS</span>
              <div className="spec-row-value-group">
                <span>{serverOsDisplay}</span>
                <span className="spec-edit-pencil" onClick={() => handleOpenEdit('Change Operating System', 'os', serverOsDisplay)}>
                  <Pencil size={13} />
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Hostname</span>
              <div className="spec-row-value-group">
                <span>{vps.hostname}</span>
                <span className="spec-edit-pencil" onClick={() => handleOpenEdit('Change Hostname', 'hostname', vps.hostname)}>
                  <Pencil size={13} />
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">VPS uptime</span>
              <div className="spec-row-value-group">
                <span>{serverUptime}</span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">SSH username</span>
              <div className="spec-row-value-group">
                <span style={{ fontFamily: 'var(--font-mono)' }}>{sshUsername}</span>
                <span className="cred-copy-icon" onClick={() => handleCopy(sshUsername, 'SSH Username')}>
                  <Copy size={13} />
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">IPv4</span>
              <div className="spec-row-value-group">
                <span style={{ fontFamily: 'var(--font-mono)' }}>{vps.ipAddress}</span>
                <span className="cred-copy-icon" onClick={() => handleCopy(vps.ipAddress, 'IPv4')}>
                  <Copy size={13} />
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Current backup schedule</span>
              <div className="spec-row-value-group">
                <span>{backupFrequency}</span>
                <span className="spec-edit-pencil" onClick={() => handleOpenEdit('Change Backup Schedule', 'backupSchedule', backupFrequency)}>
                  <Pencil size={13} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan details Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Plan details</h3>
          </div>
          <div className="card-body" style={{ padding: '0 1.5rem 0.5rem' }}>
            <div className="spec-detail-row">
              <span className="spec-row-label">Current plan</span>
              <div className="spec-row-value-group">
                <span>{vps.plan}</span>
                <span className="spec-purple-link" onClick={() => showToast('Upgrade Plan', 'Select a new compute tier.', 'info')}>
                  Upgrade
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Expiration date</span>
              <div className="spec-row-value-group">
                <span>{vps.expiresAt}</span>
                <span className="spec-purple-link" onClick={() => showToast('Renew Plan', 'Generating renewal invoice...', 'success')}>
                  Renew
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Auto-renewal</span>
              <div className="spec-row-value-group">
                <span className="spec-purple-link" onClick={() => showToast('Auto-Renewal', 'Auto-renewal enabled.', 'success')}>
                  Turn on
                </span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">CPU core</span>
              <div className="spec-row-value-group">
                <span>2</span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Memory</span>
              <div className="spec-row-value-group">
                <span>8 GB</span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Disk space</span>
              <div className="spec-row-value-group">
                <span>100 GB</span>
              </div>
            </div>

            <div className="spec-detail-row">
              <span className="spec-row-label">Bandwidth</span>
              <div className="spec-row-value-group">
                <span>8 TB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Modal */}
      <TerminalModal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        vps={vps}
      />

      {/* Reset Root Password Modal */}
      <ResetPasswordModal
        isOpen={resetPassOpen}
        onClose={() => setResetPassOpen(false)}
        hostname={vps.hostname}
      />

      {/* Edit Spec Inline Modal */}
      <EditSpecModal
        isOpen={editSpecState.open}
        onClose={() => setEditSpecState({ ...editSpecState, open: false })}
        title={editSpecState.title}
        fieldLabel={editSpecState.field}
        initialValue={editSpecState.value}
        onSave={(val) => handleSaveSpec(editSpecState.field, val)}
      />
    </div>
  );
};
