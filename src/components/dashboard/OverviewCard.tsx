import React from 'react';

interface OverviewCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  progressPercent?: number;
  trend?: {
    text: string;
    isPositive: boolean;
  };
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  progressPercent,
  trend,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-box">{icon}</div>
      </div>
      <div className="metric-value-row">
        <div className="metric-value">{value}</div>
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend.isPositive ? 'var(--status-running)' : 'var(--status-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend.text}
          </span>
        )}
      </div>
      <div className="metric-subtitle">{subtitle}</div>
      {progressPercent !== undefined && (
        <div className="metric-progress-bar">
          <div className="metric-progress-fill" style={{ width: `${Math.min(100, progressPercent)}%` }} />
        </div>
      )}
    </div>
  );
};
