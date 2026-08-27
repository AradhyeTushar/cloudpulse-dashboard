import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff, Terminal, AlertCircle, Clock, Activity, Shield } from 'lucide-react';
import { ProxyEndpointConfig } from '../../types';
import { ProxyStatusBadge } from './ProxyStatusBadge';
import { formatTrafficBytes } from '../../config/proxyPlans';
import { useToast } from '../../context/ToastContext';
import { proxyService } from '../../services/proxyService';
import { copyToClipboard } from '../../utils/clipboard';

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
  const [useLocalHost, setUseLocalHost] = useState(false);
  const [showIpEdit, setShowIpEdit] = useState(false);
  const [ipInput, setIpInput] = useState((endpoint.ipWhitelist || []).join(', '));

  useEffect(() => {
    setIpInput((endpoint.ipWhitelist || []).join(', '));
  }, [endpoint.ipWhitelist]);

  const handleSaveIPWhitelist = () => {
    const parsed = ipInput ? ipInput.split(',').map((s) => s.trim()).filter(Boolean) : [];
    proxyService.updateEndpointIPWhitelist(endpoint.id, parsed);
    setShowIpEdit(false);
    showToast('IP Blocks Updated', `Updated IP whitelist for ${endpoint.name}.`, 'success');
  };

  const serverHost =
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
      ? window.location.hostname
      : '200.234.41.58';

  const activeHost = useLocalHost
    ? '127.0.0.1'
    : endpoint.host && !endpoint.host.includes('cloudpulse.net')
    ? endpoint.host
    : serverHost;
  const proxyUri = `http://${endpoint.username}:${endpoint.password}@${activeHost}:${endpoint.port}`;
  const curlCommand = `curl -x "http://${endpoint.username}:${endpoint.password}@${activeHost}:${endpoint.port}" https://api.ipify.org`;

  const copyUri = async () => {
    await copyToClipboard(proxyUri);
    setCopiedUri(true);
    showToast('Copied Proxy URI', `Copied: ${proxyUri}`, 'success');
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const copyCurl = async () => {
    await copyToClipboard(curlCommand);
    setCopiedCurl(true);
    showToast('Copied cURL Command', 'Paste into terminal to test instantly.', 'success');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const usedBytes = endpoint.usedBytes || 0;
  const limitBytes = endpoint.limitBytes || (endpoint.isFree ? 50 * 1024 * 1024 : 500 * 1024 * 1024);
  const trafficPercent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;
  const status = endpoint.status || 'Active';

  const isDisabledOrExpired = status !== 'Active';

  return (
    <div
      className="card"
      style={{
        padding: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1.1rem',
        border: isDisabledOrExpired ? '1px solid rgba(239, 68, 68, 0.3)' : undefined,
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
          <ProxyStatusBadge status={status} title={endpoint.disabledReason} />
        </div>

        {/* Status explanation alert if not active */}
        {isDisabledOrExpired && endpoint.disabledReason && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.65rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: '#ef4444',
              margin: '0.5rem 0',
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span>{endpoint.disabledReason}</span>
          </div>
        )}

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
            {endpoint.protocol.toUpperCase()}
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
          {endpoint.isFree && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.18rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
              }}
            >
              Free Plan (12h)
            </span>
          )}
        </div>

        {/* Traffic Progress Bar */}
        <div style={{ margin: '0.65rem 0', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity size={12} /> Traffic Used:
            </span>
            <span style={{ fontWeight: 600, color: trafficPercent >= 100 ? '#ef4444' : 'var(--text-primary)' }}>
              {formatTrafficBytes(usedBytes)} / {formatTrafficBytes(limitBytes)} ({trafficPercent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${trafficPercent}%`,
                height: '100%',
                background: trafficPercent >= 100 ? '#ef4444' : trafficPercent > 80 ? '#f59e0b' : 'var(--brand-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Host Selector Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target Host:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
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
              Gateway ({serverHost})
            </button>
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

        {/* IP Whitelist / IP Blocks Section */}
        <div style={{ marginTop: '0.65rem', padding: '0.65rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showIpEdit ? '0.5rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={12} color="var(--brand-primary)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>IP Whitelist / Blocks:</span>
              {(!endpoint.ipWhitelist || endpoint.ipWhitelist.length === 0) ? (
                <span style={{ color: '#10b981', fontWeight: 600 }}>All Client IPs Allowed</span>
              ) : (
                <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {endpoint.ipWhitelist.length} rule{endpoint.ipWhitelist.length > 1 ? 's' : ''} ({endpoint.ipWhitelist.slice(0, 2).join(', ')}{endpoint.ipWhitelist.length > 2 ? '...' : ''})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowIpEdit(!showIpEdit)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-primary)',
                fontWeight: 700,
                fontSize: '0.725rem',
                cursor: 'pointer',
                padding: '0.1rem 0.35rem',
              }}
            >
              {showIpEdit ? 'Cancel' : 'Edit IP Blocks'}
            </button>
          </div>

          {showIpEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 110.227.184.49, 192.168.1.0/24"
                style={{
                  padding: '0.35rem 0.55rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const myIp = '110.227.184.49';
                    const cur = ipInput ? ipInput.split(',').map((s) => s.trim()).filter(Boolean) : [];
                    if (!cur.includes(myIp)) {
                      setIpInput([...cur, myIp].join(', '));
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  + Add My IP (110.227.184.49)
                </button>
                <button
                  type="button"
                  onClick={handleSaveIPWhitelist}
                  style={{
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Save IP Blocks
                </button>
              </div>
            </div>
          )}
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
