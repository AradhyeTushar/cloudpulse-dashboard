import React from 'react';
import { Layers, ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface BandwidthCardProps {
  usedGB: number;
  totalLimitGB: number;
  remainingGB: number;
}

export const BandwidthCard: React.FC<BandwidthCardProps> = ({
  usedGB,
  totalLimitGB,
  remainingGB,
}) => {
  const percentage = Math.min(100, Math.max(0, (usedGB / totalLimitGB) * 100));

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Bandwidth Consumed
        </span>
        <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(92, 60, 246, 0.12)', color: 'var(--brand-primary)' }}>
          <Layers size={18} />
        </div>
      </div>

      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        {usedGB} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalLimitGB} GB</span>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: 6, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: percentage > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #5c3cf6, #8b5cf6)',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#10b981' }}>{remainingGB} GB</strong> remaining
        </span>
        <NavLink to="/billing" style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>Top Up</span>
          <ArrowUpRight size={12} />
        </NavLink>
      </div>
    </div>
  );
};
