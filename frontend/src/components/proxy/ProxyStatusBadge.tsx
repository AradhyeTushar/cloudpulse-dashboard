import React from 'react';
import { ProxyStatus } from '../../types';

export type StatusType = ProxyStatus | 'optimal' | 'moderate' | 'degraded' | 'active' | 'expiring' | 'terminated' | 'online' | 'offline';

interface ProxyStatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  title?: string;
}

export const ProxyStatusBadge: React.FC<ProxyStatusBadgeProps> = ({ status, size = 'sm', title }) => {
  const getColors = () => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'optimal':
      case 'active':
      case 'online':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', dot: '#10b981' };
      case 'moderate':
      case 'expiring':
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', dot: '#f59e0b' };
      case 'traffic limit reached':
        return { bg: 'rgba(239, 68, 68, 0.14)', text: '#ef4444', dot: '#ef4444' };
      case 'expired':
      case 'plan expired':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', dot: '#ef4444' };
      case 'disabled':
      case 'degraded':
      case 'terminated':
      case 'offline':
      case 'suspended':
        return { bg: 'rgba(148, 163, 184, 0.18)', text: 'var(--text-secondary)', dot: '#94a3b8' };
      default:
        return { bg: 'rgba(92, 60, 246, 0.12)', text: 'var(--brand-primary)', dot: 'var(--brand-primary)' };
    }
  };

  const colors = getColors();

  return (
    <span
      title={title || status}
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
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};
