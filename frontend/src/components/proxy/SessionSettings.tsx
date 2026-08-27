import React from 'react';
import { ProxyRotationMode } from '../../types';

interface SessionSettingsProps {
  rotationMode: ProxyRotationMode;
  sessionDurationMin: number;
  ipWhitelist: string[];
  onChangeRotationMode: (mode: ProxyRotationMode) => void;
  onChangeDuration: (minutes: number) => void;
  onChangeWhitelist: (whitelist: string[]) => void;
}

export const SessionSettings: React.FC<SessionSettingsProps> = ({
  rotationMode,
  sessionDurationMin,
  ipWhitelist,
  onChangeRotationMode,
  onChangeDuration,
  onChangeWhitelist,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Rotation Mode Selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          IP Rotation Strategy
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div
            onClick={() => onChangeRotationMode('rotating')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: rotationMode === 'rotating' ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
              background: rotationMode === 'rotating' ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: rotationMode === 'rotating' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
              Rotating (Per Request)
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Assigns a fresh IP address for every HTTP connection.
            </div>
          </div>

          <div
            onClick={() => onChangeRotationMode('sticky')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: rotationMode === 'sticky' ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
              background: rotationMode === 'sticky' ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: rotationMode === 'sticky' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
              Sticky Session (Persistent)
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Maintains the same exit IP across requests for a set time.
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Duration Options */}
      {rotationMode === 'sticky' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Sticky Tunnel Duration
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[5, 10, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onChangeDuration(mins)}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: sessionDurationMin === mins ? '2px solid var(--brand-primary)' : '1px solid var(--bg-border)',
                  background: sessionDurationMin === mins ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                  color: sessionDurationMin === mins ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IP Whitelist */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Authorized Client IP Whitelist / IP Blocks
          </label>
          <button
            type="button"
            onClick={() => {
              const myIp = '110.227.184.49';
              if (!ipWhitelist.includes(myIp)) {
                onChangeWhitelist([...ipWhitelist, myIp]);
              }
            }}
            style={{
              background: 'rgba(92, 60, 246, 0.1)',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Use My IP (110.227.184.49)
          </button>
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="Comma-separated e.g. 110.227.184.49, 192.168.1.0/24, 10.0.0.0/8"
          value={ipWhitelist.join(', ')}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
            onChangeWhitelist(parsed);
          }}
        />
        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
          Supports individual IPv4/IPv6 addresses and CIDR IP blocks (e.g. <code>/24</code>, <code>/16</code>). Leave blank to allow any client.
        </span>
      </div>
    </div>
  );
};
