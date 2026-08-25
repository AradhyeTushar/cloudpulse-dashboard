import React, { useState } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff, Globe, Key, Shield } from 'lucide-react';
import { ProxyEndpointConfig } from '../../types';
import { ProxyStatusBadge } from './ProxyStatusBadge';
import { useToast } from '../../context/ToastContext';

interface ProxyCredentialCardProps {
  endpoint: ProxyEndpointConfig;
  onDelete: (id: string, name: string) => void;
}

export const ProxyCredentialCard: React.FC<ProxyCredentialCardProps> = ({
  endpoint,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const proxyUri = `${endpoint.protocol}://${endpoint.username}:${endpoint.password}@${endpoint.host}:${endpoint.port}`;

  const copyUri = () => {
    navigator.clipboard.writeText(proxyUri);
    setCopied(true);
    showToast('Copied', 'Full proxy URI copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {endpoint.name}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Target: {endpoint.country} ({endpoint.countryCode})
            </div>
          </div>
          <ProxyStatusBadge status="active" />
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: endpoint.proxyType === 'residential' ? 'rgba(92, 60, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: endpoint.proxyType === 'residential' ? 'var(--brand-primary)' : '#3b82f6',
              textTransform: 'uppercase',
            }}
          >
            {endpoint.proxyType}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            {endpoint.protocol}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: endpoint.rotationMode === 'sticky' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: endpoint.rotationMode === 'sticky' ? '#f59e0b' : '#10b981',
            }}
          >
            {endpoint.rotationMode === 'sticky' ? `Sticky (${endpoint.sessionDurationMin}m)` : 'Rotating'}
          </span>
        </div>

        {/* Credentials Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Host:Port</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{endpoint.host}:{endpoint.port}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Username</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{endpoint.username}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Password</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {showPassword ? endpoint.password : '••••••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: '0.75rem' }}>
        <button
          onClick={copyUri}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.775rem',
            fontWeight: 700,
            background: 'var(--brand-primary-light)',
            color: 'var(--brand-primary)',
            border: 'none',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied URI' : 'Copy Proxy URI'}</span>
        </button>

        <button
          onClick={() => onDelete(endpoint.id, endpoint.name)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.35rem',
          }}
          title="Delete Endpoint"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
