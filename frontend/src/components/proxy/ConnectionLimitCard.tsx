import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface ConnectionLimitCardProps {
  activeStreams: number;
  maxThreads: number;
}

export const ConnectionLimitCard: React.FC<ConnectionLimitCardProps> = ({
  activeStreams,
  maxThreads,
}) => {
  const percentage = Math.min(100, Math.max(0, (activeStreams / maxThreads) * 100));

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Active Concurrency
        </span>
        <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
          <Activity size={18} />
        </div>
      </div>

      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        {activeStreams} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {maxThreads.toLocaleString()} Streams</span>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: 6, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div
          style={{
            width: `${Math.max(percentage, 3)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Zap size={12} color="#10b981" />
        <span>Unlimited throughput per stream</span>
      </div>
    </div>
  );
};
