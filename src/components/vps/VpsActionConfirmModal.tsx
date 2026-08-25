import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VpsInstance } from '../../types';
import { AlertTriangle, Power, RotateCw, Trash2 } from 'lucide-react';

export type VpsActionType = 'restart' | 'stop' | 'start' | 'delete';

interface VpsActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  vps: VpsInstance | null;
  actionType: VpsActionType;
  loading?: boolean;
}

export const VpsActionConfirmModal: React.FC<VpsActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  vps,
  actionType,
  loading = false,
}) => {
  if (!vps) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'restart':
        return {
          title: `Restart Server (${vps.name})`,
          icon: <RotateCw size={24} color="var(--status-provisioning)" />,
          description: `Are you sure you want to perform a graceful reboot of ${vps.hostname}? Active SSH sessions and network connections will be temporarily disconnected.`,
          confirmText: 'Reboot Server',
          confirmVariant: 'primary' as const,
        };
      case 'stop':
        return {
          title: `Power Off Server (${vps.name})`,
          icon: <Power size={24} color="var(--status-error)" />,
          description: `This will send an ACPI shutdown signal to ${vps.hostname}. Running applications, databases, and websites on this server will become unreachable until powered on.`,
          confirmText: 'Power Off',
          confirmVariant: 'danger' as const,
        };
      case 'start':
        return {
          title: `Power On Server (${vps.name})`,
          icon: <Power size={24} color="var(--status-running)" />,
          description: `This will start virtual machine ${vps.hostname} and boot the primary OS image.`,
          confirmText: 'Power On',
          confirmVariant: 'primary' as const,
        };
      case 'delete':
        return {
          title: `Delete Server (${vps.name})`,
          icon: <Trash2 size={24} color="var(--status-error)" />,
          description: `Warning: This action is irreversible. All data, NVMe storage partitions, and snapshots on ${vps.hostname} (${vps.ipAddress}) will be permanently erased.`,
          confirmText: 'Permanently Delete VPS',
          confirmVariant: 'danger' as const,
        };
    }
  };

  const config = getActionConfig();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={config.confirmVariant} onClick={onConfirm} loading={loading}>
            {config.confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.icon}
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {config.description}
          </p>
        </div>
      </div>
    </Modal>
  );
};
