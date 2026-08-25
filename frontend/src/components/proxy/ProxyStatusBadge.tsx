import React from 'react';

export type StatusType = 'optimal' | 'moderate' | 'degraded' | 'active' | 'expiring' | 'terminated' | 'online' | 'offline';

interface ProxyStatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export const ProxyStatusBadge: React.FC<ProxyStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'optimal':
      case 'active':
      case 'online':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', dot: '#10b981' };
      case 'moderate':
      case 'expiring':
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', dot: '#f59e0b' };
      case 'degraded':
      case 'terminated':
      case 'offline':
      case 'suspended':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', dot: '#ef4444' };
      default:
        return { bg: 'rgba(92, 60, 246, 0.12)', text: 'var(--brand-primary)', dot: 'var(--brand-primary)' };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: size === 'sm' ? '0.7rem' : '0.775rem',
        fontWeight: 700,
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        background: colors.bg,
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.dot }} />
      {status}
    </span>
  );
};
