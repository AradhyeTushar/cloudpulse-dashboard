import React, { useState } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff, Terminal, Shield, Sparkles } from 'lucide-react';
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
  const [copiedUri, setCopiedUri] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [useLocalHost, setUseLocalHost] = useState(true);

  const activeHost = useLocalHost ? '127.0.0.1' : endpoint.host;
  const proxyUri = `http://${endpoint.username}:${endpoint.password}@${activeHost}:${endpoint.port}`;
  const curlCommand = `curl -x "http://${endpoint.username}:${endpoint.password}@${activeHost}:${endpoint.port}" https://api.ipify.org`;

  const copyUri = () => {
    navigator.clipboard.writeText(proxyUri);
    setCopiedUri(true);
    showToast('Copied Proxy URI', `Copied: ${proxyUri}`, 'success');
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    showToast('Copied cURL Command', 'Paste into terminal to test instantly.', 'success');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1.1rem',
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {endpoint.name}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Target: {endpoint.country} ({endpoint.countryCode})
            </div>
          </div>
          <ProxyStatusBadge status="active" />
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.65rem 0' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.18rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: endpoint.proxyType === 'residential' ? 'rgba(92, 60, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
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
              padding: '0.18rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            HTTP CONNECT
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.18rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: endpoint.rotationMode === 'sticky' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: endpoint.rotationMode === 'sticky' ? '#f59e0b' : '#10b981',
            }}
          >
            {endpoint.rotationMode === 'sticky' ? `Sticky (${endpoint.sessionDurationMin}m)` : 'Rotating'}
          </span>
        </div>

        {/* Host Selector Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target Host:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setUseLocalHost(true)}
              style={{
                border: 'none',
                background: useLocalHost ? 'var(--brand-primary)' : 'transparent',
                color: useLocalHost ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              127.0.0.1 (Local)
            </button>
            <button
              type="button"
              onClick={() => setUseLocalHost(false)}
              style={{
                border: 'none',
                background: !useLocalHost ? 'var(--brand-primary)' : 'transparent',
                color: !useLocalHost ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {endpoint.host}
            </button>
          </div>
        </div>

        {/* Credentials Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Host:Port</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeHost}:{endpoint.port}</span>
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
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
            {copiedUri ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copiedUri ? 'Copied' : 'Copy URI'}</span>
          </button>

          <button
            onClick={copyCurl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.775rem',
              fontWeight: 700,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            {copiedCurl ? <Check size={13} color="#10b981" /> : <Terminal size={13} />}
            <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
          </button>
        </div>

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
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
