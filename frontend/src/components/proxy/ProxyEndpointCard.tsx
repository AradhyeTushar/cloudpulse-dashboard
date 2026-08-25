import React from 'react';
import { Globe, ShieldCheck, Zap, Radio } from 'lucide-react';
import { ProxyType } from '../../types';
import { ProxyStatusBadge } from './ProxyStatusBadge';

interface ProxyEndpointCardProps {
  type: ProxyType;
  title: string;
  poolSize: string;
  host: string;
  port: number;
  protocols: string[];
  latencyAvg: string;
  onSelect?: () => void;
}

export const ProxyEndpointCard: React.FC<ProxyEndpointCardProps> = ({
  type,
  title,
  poolSize,
  host,
  port,
  protocols,
  latencyAvg,
  onSelect,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{poolSize} Pool Capacity</span>
          </div>
          <ProxyStatusBadge status="optimal" />
        </div>

        <div style={{ borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: '0.75rem 0', margin: '0.75rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Gateway Host</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{host}:{port}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Avg Latency</div>
            <div style={{ fontWeight: 700, color: '#10b981' }}>{latencyAvg}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {protocols.map((p) => (
            <span
              key={p}
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {onSelect && (
        <button
          onClick={onSelect}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Create {title} Credentials
        </button>
      )}
    </div>
  );
};
