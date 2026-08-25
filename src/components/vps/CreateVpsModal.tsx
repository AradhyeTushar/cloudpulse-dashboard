import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MOCK_VPS_PLANS } from '../../data/mock-vps';
import { OperatingSystem } from '../../types';

interface CreateVpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    hostname: string;
    os: OperatingSystem;
    plan: string;
    region: string;
    sshKey?: string;
  }) => Promise<void>;
}

export const CreateVpsModal: React.FC<CreateVpsModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [selectedOs, setSelectedOs] = useState<OperatingSystem>('ubuntu');
  const [selectedRegion, setSelectedRegion] = useState('US East');
  const [selectedPlan, setSelectedPlan] = useState('KVM 2');
  const [sshKey, setSshKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({
        name: name || `srv-${Math.floor(1000 + Math.random() * 9000)}`,
        hostname: hostname || `${name || 'server'}.hstgr.cloud`,
        os: selectedOs,
        plan: selectedPlan,
        region: selectedRegion,
        sshKey,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const osOptions: Array<{ id: OperatingSystem; name: string; desc: string; tag: string }> = [
    { id: 'ubuntu', name: 'Ubuntu', desc: '24.04 LTS (Noble Numbat)', tag: 'Recommended' },
    { id: 'debian', name: 'Debian', desc: '12 (Bookworm) 64bit', tag: 'Stable' },
    { id: 'almalinux', name: 'AlmaLinux', desc: '9.4 (Enterprise RHEL binary)', tag: 'Enterprise' },
    { id: 'docker', name: 'Docker on Ubuntu', desc: 'Pre-installed Docker & Compose', tag: 'Dev Ready' },
  ];

  const regionOptions = [
    { id: 'US East', name: 'US East (N. Virginia)', flag: '🇺🇸', ping: '18ms' },
    { id: 'EU Central', name: 'EU Central (Frankfurt)', flag: '🇩🇪', ping: '32ms' },
    { id: 'Asia Pacific', name: 'Asia Pacific (Singapore)', flag: '🇸🇬', ping: '84ms' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Virtual Private Server (VPS)"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Provision VPS
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Select OS */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            1. Select Operating System
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {osOptions.map((os) => (
              <div
                key={os.id}
                onClick={() => setSelectedOs(os.id)}
                style={{
                  border: `2px solid ${selectedOs === os.id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: selectedOs === os.id ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{os.name}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--brand-primary-text)' }}>{os.tag}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{os.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Select Datacenter Region */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            2. Choose Datacenter Region
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {regionOptions.map((reg) => (
              <div
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                style={{
                  border: `2px solid ${selectedRegion === reg.id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: selectedRegion === reg.id ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <span>{reg.flag}</span>
                  <span>{reg.name}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Latency: ~{reg.ping}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Select Plan */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            3. Choose Compute Plan
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {MOCK_VPS_PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.name)}
                style={{
                  border: `2px solid ${selectedPlan === plan.name ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: selectedPlan === plan.name ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{plan.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary-text)', fontWeight: 700, margin: '0.25rem 0' }}>
                  ${plan.priceMonthly}/mo
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {plan.vCPU} vCPU • {plan.ramGB}GB RAM
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {plan.storageGB}GB NVMe
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Hostname & SSH */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Server Hostname</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. srv-us-production"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setHostname(`${e.target.value || 'server'}.hstgr.cloud`);
              }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Public Domain / FQDN</label>
            <input
              type="text"
              className="form-input"
              placeholder="srv-us-production.hstgr.cloud"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
