import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Copy,
  Trash2,
  Check,
  Shield,
  RefreshCw,
  Globe,
  Sliders,
  Terminal,
} from 'lucide-react';
import { proxyService } from '../../services/proxyService';
import { ProxyEndpointConfig, ProxyType, ProxyProtocol, ProxyRotationMode } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ProxyAccessPage: React.FC = () => {
  const { showToast } = useToast();
  const [endpoints, setEndpoints] = useState<ProxyEndpointConfig[]>(() => proxyService.getEndpoints());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [proxyType, setProxyType] = useState<ProxyType>('residential');
  const [protocol, setProtocol] = useState<ProxyProtocol>('http');
  const [rotationMode, setRotationMode] = useState<ProxyRotationMode>('rotating');
  const [sessionDurationMin, setSessionDurationMin] = useState(15);
  const [country, setCountry] = useState('India');
  const [ipWhitelist, setIpWhitelist] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Please specify a name for the endpoint.', 'error');
      return;
    }

    const newEndpoint = proxyService.createEndpoint({
      name,
      proxyType,
      protocol,
      host: proxyType === 'residential' ? 'pr.cloudpulse.net' : 'dc.cloudpulse.net',
      port: protocol === 'socks5' ? 1080 : 8000,
      username: 'cp_' + Math.random().toString(36).substring(2, 9),
      password: 'p_sec_' + Math.random().toString(36).substring(2, 10),
      rotationMode,
      sessionDurationMin: rotationMode === 'sticky' ? sessionDurationMin : 0,
      country,
      countryCode: country === 'India' ? 'IN' : country === 'United States' ? 'US' : country === 'Germany' ? 'DE' : 'GB',
      ipWhitelist: ipWhitelist ? ipWhitelist.split(',').map((s) => s.trim()) : [],
    });

    setEndpoints(proxyService.getEndpoints());
    setShowCreateModal(false);
    setName('');
    showToast('Endpoint Created', `Proxy endpoint ${newEndpoint.name} is now active.`, 'success');
  };

  const handleDelete = (id: string, epName: string) => {
    proxyService.deleteEndpoint(id);
    setEndpoints(proxyService.getEndpoints());
    showToast('Endpoint Deleted', `Proxy endpoint ${epName} has been removed.`, 'info');
  };

  const copyString = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied', 'Connection string copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="content-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Proxy Access & Credentials
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Generate authentication credentials, configure sticky vs rotating behaviors, and restrict authorized IP addresses.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} style={{ marginRight: '0.4rem' }} />
          Create Proxy Endpoint
        </Button>
      </div>

      {/* Endpoints Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Proxy Endpoints ({endpoints.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-refreshed every 30s</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Endpoint Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type & Protocol</th>
                <th style={{ padding: '0.85rem 1rem' }}>Host & Port</th>
                <th style={{ padding: '0.85rem 1rem' }}>Rotation Mode</th>
                <th style={{ padding: '0.85rem 1rem' }}>Country Target</th>
                <th style={{ padding: '0.85rem 1rem' }}>Credentials</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => {
                const proxyUri = `${ep.protocol}://${ep.username}:${ep.password}@${ep.host}:${ep.port}`;
                return (
                  <tr key={ep.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ep.name}
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: ep.proxyType === 'residential' ? 'rgba(92, 60, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: ep.proxyType === 'residential' ? 'var(--brand-primary)' : '#3b82f6',
                          textTransform: 'uppercase',
                        }}
                      >
                        {ep.proxyType} ({ep.protocol})
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {ep.host}:{ep.port}
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      {ep.rotationMode === 'sticky' ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.8rem' }}>
                          Sticky ({ep.sessionDurationMin}m)
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                          Rotating / Req
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      {ep.country} ({ep.countryCode})
                    </td>
                    <td style={{ padding: '1rem 1rem' }}>
                      <button
                        onClick={() => copyString(proxyUri, ep.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--bg-border)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: copiedId === ep.id ? '#10b981' : 'var(--text-primary)',
                        }}
                      >
                        {copiedId === ep.id ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedId === ep.id ? 'Copied' : 'Copy URI'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(ep.id, ep.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.3rem',
                        }}
                        title="Delete Endpoint"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create Proxy Endpoint" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Endpoint Friendly Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. US Production Scraper Pool"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Proxy Network Type
                </label>
                <select className="input-field" value={proxyType} onChange={(e) => setProxyType(e.target.value as ProxyType)}>
                  <option value="residential">Residential (60M+ IPs)</option>
                  <option value="datacenter">Datacenter (Dedicated 10Gbps)</option>
                  <option value="mobile">Mobile 5G / 4G Carrier</option>
                  <option value="isp">Static ISP</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Protocol
                </label>
                <select className="input-field" value={protocol} onChange={(e) => setProtocol(e.target.value as ProxyProtocol)}>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Rotation Behavior
                </label>
                <select className="input-field" value={rotationMode} onChange={(e) => setRotationMode(e.target.value as ProxyRotationMode)}>
                  <option value="rotating">Rotating (New IP per request)</option>
                  <option value="sticky">Sticky Session (Persistent IP)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Target Country
                </label>
                <select className="input-field" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="India">India (IN) - Mumbai / Delhi</option>
                  <option value="United States">United States (US)</option>
                  <option value="Germany">Germany (DE)</option>
                  <option value="United Kingdom">United Kingdom (GB)</option>
                  <option value="Japan">Japan (JP)</option>
                  <option value="Singapore">Singapore (SG)</option>
                </select>
              </div>
            </div>

            {rotationMode === 'sticky' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Sticky Session Duration (Minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  min="1"
                  max="60"
                  value={sessionDurationMin}
                  onChange={(e) => setSessionDurationMin(Number(e.target.value))}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                IP Whitelist (Optional, comma-separated)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 72.229.28.185, 185.193.126.88"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Endpoint
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
