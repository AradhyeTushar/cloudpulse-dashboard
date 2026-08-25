import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Check,
  Copy,
  QrCode,
  Smartphone,
  Mail,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

export const TwoFactorSection: React.FC = () => {
  const { showToast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [method, setMethod] = useState<'app' | 'email'>('app');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const secretKey = 'JBSWY3DPEHPK3PXP';
  const recoveryCodes = [
    '8F2A-99B1',
    '34C2-11A0',
    '87D3-55F4',
    '10E4-77C8',
    '99A5-44D2',
    '62B6-33E1',
  ];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    showToast('Secret Copied', 'Secret setup key copied.', 'info');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setStep(3); // Go to recovery codes
  };

  const handleCompleteSetup = () => {
    setIsEnabled(true);
    setSetupModalOpen(false);
    setStep(1);
    setOtpCode('');
    showToast('2FA Activated', 'Two-Factor Authentication is now protecting your account.', 'success');
  };

  const handleDisable2FA = () => {
    setIsEnabled(false);
    showToast('2FA Disabled', 'Two-factor protection turned off.', 'warning');
  };

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Two-Factor Authentication Setup
      </h1>

      {/* Hero Card matching Screenshot 3 */}
      <div className="tfa-hero-card">
        <div className="tfa-hero-left">
          <div className="tfa-shield-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <circle cx="12" cy="11" r="1.5" />
              <path d="M12 12.5V15" />
            </svg>
          </div>

          <div>
            <div className="tfa-title-row">
              <span className="tfa-title">Two-factor authentication</span>
              <span className={isEnabled ? 'status-badge status-running' : 'tfa-off-badge'}>
                {isEnabled ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="tfa-hero-desc">
              Add an extra layer of protection to your account by enabling two-factor authentication. You can use either an authentication app or email, but only one method can be active at a time.
            </p>
          </div>
        </div>

        <div>
          {!isEnabled ? (
            <button
              className="tfa-turnon-btn"
              onClick={() => {
                setStep(1);
                setSetupModalOpen(true);
              }}
            >
              <span className="tfa-notification-pip" />
              <span>Turn on</span>
            </button>
          ) : (
            <Button
              variant="secondary"
              className="btn-pill"
              onClick={handleDisable2FA}
            >
              Turn off
            </Button>
          )}
        </div>
      </div>

      {/* 2FA Setup Flow Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Set Up Two-Factor Authentication"
        footer={
          step === 1 ? (
            <>
              <Button variant="secondary" onClick={() => setSetupModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(2)}>Next</Button>
            </>
          ) : step === 2 ? (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={handleVerifyOtp} disabled={otpCode.length < 6}>Verify Code</Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleCompleteSetup}>Done & Enable</Button>
          )
        }
      >
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className={`resolver-chip-btn ${method === 'app' ? 'active' : ''}`}
                onClick={() => setMethod('app')}
              >
                <Smartphone size={14} />
                <span>Authenticator App (Recommended)</span>
              </button>
              <button
                type="button"
                className={`resolver-chip-btn ${method === 'email' ? 'active' : ''}`}
                onClick={() => setMethod('email')}
              >
                <Mail size={14} />
                <span>Email OTP</span>
              </button>
            </div>

            {method === 'app' ? (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {/* SVG Simulated QR Code */}
                <div style={{ display: 'inline-block', padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <rect width="120" height="120" fill="white" />
                    {/* Position detection corners */}
                    <rect x="10" y="10" width="30" height="30" fill="black" />
                    <rect x="15" y="15" width="20" height="20" fill="white" />
                    <rect x="20" y="20" width="10" height="10" fill="black" />

                    <rect x="80" y="10" width="30" height="30" fill="black" />
                    <rect x="85" y="15" width="20" height="20" fill="white" />
                    <rect x="90" y="20" width="10" height="10" fill="black" />

                    <rect x="10" y="80" width="30" height="30" fill="black" />
                    <rect x="15" y="85" width="20" height="20" fill="white" />
                    <rect x="20" y="90" width="10" height="10" fill="black" />

                    {/* Random QR payload dots */}
                    <rect x="50" y="15" width="8" height="8" fill="black" />
                    <rect x="65" y="25" width="8" height="8" fill="black" />
                    <rect x="50" y="50" width="15" height="15" fill="black" />
                    <rect x="80" y="60" width="8" height="8" fill="black" />
                    <rect x="95" y="75" width="12" height="12" fill="black" />
                    <rect x="50" y="85" width="10" height="10" fill="black" />
                    <rect x="65" y="95" width="8" height="8" fill="black" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Scan with Google Authenticator, Authy, or 1Password.
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <code style={{ background: 'var(--bg-surface)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}>
                    {secretKey}
                  </code>
                  <button type="button" className="btn-icon" onClick={handleCopyKey} title="Copy secret key">
                    {copiedKey ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Verification codes will be sent to <strong>admin@cloudhost.net</strong> on each login.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Enter the 6-digit code from your authenticator app to confirm the configuration.
            </p>
            <div className="form-group">
              <label className="form-label">6-digit Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="123456"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 800 }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
              />
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Save these recovery backup codes in a safe place. If you lose access to your device, you can use these codes to regain access.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>
              {recoveryCodes.map((c, i) => (
                <div key={i} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
