import React from 'react';
import { VpsStatus } from '../../types';

interface StatusBadgeProps {
  status: VpsStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusLower = status.toLowerCase();

  const getStatusClass = () => {
    switch (statusLower) {
      case 'running':
      case 'active':
        return 'status-running';
      case 'stopped':
      case 'inactive':
        return 'status-stopped';
      case 'provisioning':
      case 'pending':
        return 'status-provisioning';
      case 'error':
      case 'failed':
        return 'status-error';
      case 'suspended':
        return 'status-suspended';
      default:
        return 'status-stopped';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      <span className="status-dot" />
      <span>{status}</span>
    </span>
  );
};
