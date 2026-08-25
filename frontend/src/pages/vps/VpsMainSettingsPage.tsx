import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Shield,
  Key,
  Cloud,
  Trash2,
  Network,
} from 'lucide-react';
import { vpsService } from '../../services/vpsService';
import { VpsInstance } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TerminalModal } from '../../components/vps/TerminalModal';
import { useToast } from '../../context/ToastContext';

export const VpsMainSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [password, setPassword] = useState('MyS3cureP@ssword2026!');
  const [showPass, setShowPass] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<'firewall' | 'ssh' | 'hostname' | 'logs' | 'dns' | null>(null);

  // Reset Firewall / Reset SSH confirmation checkbox
  const [firewallAck, setFirewallAck] = useState(false);
  const [sshAck, setSshAck] = useState(false);
  const [logsAck, setLogsAck] = useState(false);

  // Hostname change modal state
  const [newHostname, setNewHostname] = useState('');
  const [hostnameTouched, setHostnameTouched] = useState(false);

  // DNS Resolvers modal state
  const [dnsProvider, setDnsProvider] = useState<'custom' | 'google' | 'cloudflare'>('custom');
  const [dnsIp1, setDnsIp1] = useState('');
  const [dnsIp2, setDnsIp2] = useState('');

  useEffect(() => {
    const loadVps = async () => {
      if (!id) return;
      const found = await vpsService.getVpsById(id);
      if (found) {
        setVps(found);
        setNewHostname(found.hostname);
      }
    };
    loadVps();
  }, [id]);

  // Generate strong password
  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz';
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nums = '23456789';
    const syms = '-().&@?*#/:+';
    let res = '';
    for (let i = 0; i < 4; i++) res += uppers[Math.floor(Math.random() * uppers.length)];
    for (let i = 0; i < 6; i++) res += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 3; i++) res += nums[Math.floor(Math.random() * nums.length)];
    for (let i = 0; i < 2; i++) res += syms[Math.floor(Math.random() * syms.length)];
    const shuffled = res.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    showToast('Generated', 'Strong root password generated.', 'info');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPass(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('Password Updated', 'Root credentials updated on server.', 'success');
    } finally {
      setUpdatingPass(false);
    }
  };

  // Password checklist rules from Screenshots 1 & 2
  const hasNumber = /\d/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLength = password.length >= 12 && password.length <= 50;
  const hasValidSymbols = /^[\w\-.().&@?*#/:+]*$/.test(password) && /[-().&@?*#/:+]/.test(password);
  const onlyLatin = /^[A-Za-z0-9-().&@?*#/:+]+$/.test(password);

  // Hostname validation
  const hostnameHasLength = newHostname.trim().length >= 1;
  const hostnameHasNoSpacing = !/\s/.test(newHostname);
  const hostnameHasDot = newHostname.includes('.');
  const isHostnameValid = hostnameHasLength && hostnameHasNoSpacing && hostnameHasDot;

  // Handlers for modal actions
  const handleResetFirewall = () => {
    showToast('Firewall Reset', 'iptables and UFW rules reset to default.', 'success');
    setFirewallAck(false);
    setActiveModal(null);
  };

  const handleResetSsh = () => {
    showToast('SSH Reset', 'sshd_config and root shell restored to defaults.', 'success');
    setSshAck(false);
    setActiveModal(null);
  };

  const handleChangeHostname = () => {
    if (!isHostnameValid) return;
    if (vps) setVps({ ...vps, hostname: newHostname });
    showToast('Hostname Changed', `Server hostname updated to ${newHostname}`, 'success');
    setActiveModal(null);
  };

  const handleDeleteLogs = () => {
    showToast('Logs Deleted', 'Cleared /var/log. Freed 1.2 GB disk space without affecting web service.', 'success');
    setLogsAck(false);
    setActiveModal(null);
  };

  const handleSaveDnsResolvers = () => {
    showToast('DNS Resolvers Saved', `Upstream DNS set to ${dnsIp1 || 'default resolvers'}`, 'success');
    setActiveModal(null);
  };

  const selectDnsProvider = (p: 'custom' | 'google' | 'cloudflare') => {
    setDnsProvider(p);
    if (p === 'google') {
      setDnsIp1('8.8.8.8');
      setDnsIp2('8.8.4.4');
    } else if (p === 'cloudflare') {
      setDnsIp1('1.1.1.1');
      setDnsIp2('1.0.0.1');
    } else {
      setDnsIp1('');
      setDnsIp2('');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1>Main settings</h1>
        </div>

        <div>
          <button className="terminal-top-btn" onClick={() => setTerminalOpen(true)}>
            <span>Terminal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. CHANGE ROOT PASSWORD CARD (Screenshots 1 & 2)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Change Root Password</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Setting a strong and secure root password ensures the protection of your VPS. Root password used to log in to your VPS.
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleUpdatePassword}>
            <div className="password-box-row">
              <div className="password-input-wrapper">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="button" className="password-generate-btn" onClick={generatePassword}>
                <Sparkles size={14} color="var(--brand-primary)" />
                <span>Generate</span>
              </button>

              <Button
                variant="secondary"
                type="submit"
                loading={updatingPass}
                disabled={!hasNumber || !hasLower || !hasUpper || !hasLength}
              >
                Update password
              </Button>
            </div>

            {/* 6 Password Requirements Checklist */}
            <div className="password-checklist-grid">
              <div className={`checklist-item ${hasNumber ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={hasNumber ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>One number</span>
              </div>

              <div className={`checklist-item ${hasValidSymbols ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={hasValidSymbols ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>Only symbols: -().&@?*#/:+</span>
              </div>

              <div className={`checklist-item ${hasLower ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={hasLower ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>One lowercase letter</span>
              </div>

              <div className={`checklist-item ${hasUpper ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={hasUpper ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>One uppercase letter</span>
              </div>

              <div className={`checklist-item ${hasLength ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={hasLength ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>Use 12–50 characters</span>
              </div>

              <div className={`checklist-item ${onlyLatin ? 'valid' : ''}`}>
                <span className="checklist-check-icon">
                  <Check size={14} color={onlyLatin ? '#059669' : 'var(--text-dim)'} />
                </span>
                <span>Only latin letters</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* =====================================================================
          2. VPS CONFIGURATIONS CARD (Screenshots 1 & 2)
         ===================================================================== */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>VPS Configurations</h2>
        </div>

        <div className="card-body" style={{ padding: '0 1.5rem' }}>
          <div className="vps-config-list">
            {/* 1. Reset firewall configuration */}
            <div className="vps-config-item">
              <div className="vps-config-left">
                <div className="vps-config-icon-box">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="vps-config-title">Reset firewall configuration</div>
                  <div className="vps-config-desc">
                    Reset your server's firewall (iptables/ufw) configuration in case your IP gets blocked
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => {
                  setFirewallAck(false);
                  setActiveModal('firewall');
                }}
              >
                Reset
              </Button>
            </div>

            {/* 2. Reset SSH configuration */}
            <div className="vps-config-item">
              <div className="vps-config-left">
                <div className="vps-config-icon-box">
                  <Key size={20} />
                </div>
                <div>
                  <div className="vps-config-title">Reset SSH configuration</div>
                  <div className="vps-config-desc">
                    Reset your server's SSH settings and root user shell to the default SSH configuration
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => {
                  setSshAck(false);
                  setActiveModal('ssh');
                }}
              >
                Reset
              </Button>
            </div>

            {/* 3. Hostname */}
            <div className="vps-config-item">
              <div className="vps-config-left">
                <div className="vps-config-icon-box">
                  <Cloud size={20} />
                </div>
                <div>
                  <div className="vps-config-title">Hostname</div>
                  <div className="vps-config-desc">
                    Your current VPS hostname is <strong>{vps?.hostname || 'srv1920898.hstgr.cloud'}</strong>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => {
                  setNewHostname(vps?.hostname || '');
                  setHostnameTouched(false);
                  setActiveModal('hostname');
                }}
              >
                Change
              </Button>
            </div>

            {/* 4. Delete unnecessary logs */}
            <div className="vps-config-item">
              <div className="vps-config-left">
                <div className="vps-config-icon-box">
                  <Trash2 size={20} />
                </div>
                <div>
                  <div className="vps-config-title">Delete unnecessary logs</div>
                  <div className="vps-config-desc">
                    Clear unneeded files from <code>/var/log</code> to free up VPS disk space without impacting your website
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => {
                  setLogsAck(false);
                  setActiveModal('logs');
                }}
              >
                Delete
              </Button>
            </div>

            {/* 5. DNS Resolvers */}
            <div className="vps-config-item">
              <div className="vps-config-left">
                <div className="vps-config-icon-box">
                  <Network size={20} />
                </div>
                <div>
                  <div className="vps-config-title">
                    <span>DNS Resolvers</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      Default
                    </span>
                  </div>
                  <div className="vps-config-desc">
                    You can use the default Hostinger resolvers, or add your own custom DNS resolver.
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => {
                  setDnsProvider('custom');
                  setDnsIp1('');
                  setDnsIp2('');
                  setActiveModal('dns');
                }}
              >
                Change
              </Button>
            </div>
          </div>
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

      {/* MODAL 1: Reset firewall */}
      <Modal
        isOpen={activeModal === 'firewall'}
        onClose={() => setActiveModal(null)}
        title="Reset firewall configuration?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!firewallAck}
              onClick={handleResetFirewall}
            >
              Reset
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          This will reset your firewall rules to default settings.
        </p>

        <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          What will change:
        </div>
        <ul className="modal-bullet-list">
          <li>Custom firewall rules will be removed</li>
          <li>New connections will follow default rules</li>
          <li>Your current SSH session will stay active</li>
        </ul>

        <div className="danger-ack-box" onClick={() => setFirewallAck(!firewallAck)}>
          <input
            type="checkbox"
            checked={firewallAck}
            onChange={(e) => setFirewallAck(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span className="danger-ack-text">I understand this action can't be undone.</span>
        </div>
      </Modal>

      {/* MODAL 2: Reset SSH */}
      <Modal
        isOpen={activeModal === 'ssh'}
        onClose={() => setActiveModal(null)}
        title="Reset SSH configuration?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!sshAck}
              onClick={handleResetSsh}
            >
              Reset
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          This will reset your SSH settings to default.
        </p>

        <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          What will change:
        </div>
        <ul className="modal-bullet-list">
          <li>Custom SSH settings will be removed</li>
          <li>Root user shell will be reset to default</li>
          <li>Active connections may be affected</li>
        </ul>

        <div className="danger-ack-box" onClick={() => setSshAck(!sshAck)}>
          <input
            type="checkbox"
            checked={sshAck}
            onChange={(e) => setSshAck(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span className="danger-ack-text">I understand this action can't be undone.</span>
        </div>
      </Modal>

      {/* MODAL 3: Change Hostname */}
      <Modal
        isOpen={activeModal === 'hostname'}
        onClose={() => setActiveModal(null)}
        title="Change Hostname"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!isHostnameValid}
              onClick={handleChangeHostname}
            >
              Change
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
          Enter a new hostname for your server. Once you've changed your hostname, you won't be able to revert it back to default.
        </p>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Current hostname: <strong>{vps?.hostname || 'srv1920898.hstgr.cloud'}</strong>
        </div>

        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label className="form-label">New hostname</label>
          <input
            type="text"
            className="form-input"
            placeholder="servername.domain.tld"
            value={newHostname}
            onChange={(e) => {
              setNewHostname(e.target.value);
              setHostnameTouched(true);
            }}
            autoFocus
          />
        </div>

        <div style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
          {hostnameTouched && !hostnameHasLength && (
            <div style={{ color: '#ef4444', marginBottom: '0.35rem' }}>
              String must contain at least 1 character(s)
            </div>
          )}
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)' }}>
            <span style={{ color: hostnameHasNoSpacing ? '#059669' : 'var(--text-muted)' }}>
              • No spacing
            </span>
            <span style={{ color: hostnameHasDot ? '#059669' : 'var(--text-muted)' }}>
              • Use dot (.) for separation
            </span>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Delete logs */}
      <Modal
        isOpen={activeModal === 'logs'}
        onClose={() => setActiveModal(null)}
        title="Delete unnecessary logs?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!logsAck}
              onClick={handleDeleteLogs}
            >
              Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          This will permanently delete log files from the <strong>/var/log</strong> folder.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Your website will not be affected.
        </p>

        <div className="danger-ack-box" onClick={() => setLogsAck(!logsAck)}>
          <input
            type="checkbox"
            checked={logsAck}
            onChange={(e) => setLogsAck(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span className="danger-ack-text">I understand log files will be permanently deleted and can't be undone.</span>
        </div>
      </Modal>

      {/* MODAL 5: Change DNS resolvers */}
      <Modal
        isOpen={activeModal === 'dns'}
        onClose={() => setActiveModal(null)}
        title="Change DNS resolvers"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!dnsIp1.trim()}
              onClick={handleSaveDnsResolvers}
            >
              Save
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Custom your DNS resolvers or pick from popular provider. By changing DNS resolver, it will affect your VPS.
        </p>

        <div className="resolver-chips-row">
          <button
            type="button"
            className={`resolver-chip-btn ${dnsProvider === 'custom' ? 'active' : ''}`}
            onClick={() => selectDnsProvider('custom')}
          >
            {dnsProvider === 'custom' && <Check size={13} />}
            <span>Custom</span>
          </button>

          <button
            type="button"
            className={`resolver-chip-btn ${dnsProvider === 'google' ? 'active' : ''}`}
            onClick={() => selectDnsProvider('google')}
          >
            {dnsProvider === 'google' && <Check size={13} />}
            <span>Google</span>
          </button>

          <button
            type="button"
            className={`resolver-chip-btn ${dnsProvider === 'cloudflare' ? 'active' : ''}`}
            onClick={() => selectDnsProvider('cloudflare')}
          >
            {dnsProvider === 'cloudflare' && <Check size={13} />}
            <span>Cloudflare</span>
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">IP address 1 *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter IP address"
            value={dnsIp1}
            onChange={(e) => setDnsIp1(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">IP address 2 (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter IP address"
            value={dnsIp2}
            onChange={(e) => setDnsIp2(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
