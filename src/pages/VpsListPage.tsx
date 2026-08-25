import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { VpsTable } from '../components/vps/VpsTable';
import { CreateVpsModal } from '../components/vps/CreateVpsModal';
import { VpsActionConfirmModal, VpsActionType } from '../components/vps/VpsActionConfirmModal';
import { Button } from '../components/ui/Button';
import { vpsService } from '../services/vpsService';
import { activityService } from '../services/activityService';
import { useToast } from '../context/ToastContext';
import { VpsInstance } from '../types';

export const VpsListPage: React.FC = () => {
  const { showToast } = useToast();
  const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Confirmation modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetVps, setTargetVps] = useState<VpsInstance | null>(null);
  const [actionType, setActionType] = useState<VpsActionType>('restart');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVpsList = async () => {
    try {
      const list = await vpsService.getVpsList();
      setVpsList(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVpsList();
  }, []);

  const handleCreateVps = async (data: Parameters<typeof vpsService.createVps>[0]) => {
    const newVps = await vpsService.createVps(data);
    await activityService.addActivity(
      `VPS ${newVps.name} provisioned`,
      `New instance created with ${newVps.plan} plan in ${newVps.region}.`,
      'success',
      'vps',
      newVps.id
    );
    setVpsList((prev) => [newVps, ...prev]);
    showToast('VPS Created', `${newVps.hostname} (${newVps.ipAddress}) is now online.`, 'success');
  };

  const handleOpenConfirm = (vps: VpsInstance, type: VpsActionType) => {
    setTargetVps(vps);
    setActionType(type);
    setConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!targetVps) return;
    setActionLoading(true);

    try {
      if (actionType === 'restart') {
        await vpsService.updateVpsStatus(targetVps.id, 'Running');
        await activityService.addActivity(
          `VPS ${targetVps.name} restarted`,
          `Reboot command executed successfully.`,
          'info',
          'vps',
          targetVps.id
        );
        showToast('Server Restarted', `${targetVps.hostname} was rebooted successfully.`, 'success');
      } else if (actionType === 'stop') {
        const nextStatus = targetVps.status === 'Running' ? 'Stopped' : 'Running';
        await vpsService.updateVpsStatus(targetVps.id, nextStatus);
        await activityService.addActivity(
          `VPS ${targetVps.name} ${nextStatus.toLowerCase()}`,
          `Power state modified to ${nextStatus}.`,
          'warning',
          'vps',
          targetVps.id
        );
        showToast(`Server ${nextStatus}`, `${targetVps.hostname} state updated.`, 'info');
      } else if (actionType === 'delete') {
        await vpsService.deleteVps(targetVps.id);
        await activityService.addActivity(
          `VPS ${targetVps.name} deleted`,
          `Instance and associated resources permanently removed.`,
          'warning',
          'vps',
          targetVps.id
        );
        showToast('VPS Deleted', `${targetVps.name} has been deleted.`, 'success');
      }

      await fetchVpsList();
      setConfirmModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnapshot = async (vps: VpsInstance) => {
    const snap = await vpsService.createSnapshot(`snap-${vps.name}-${Date.now()}`);
    await activityService.addActivity(
      `Snapshot created for ${vps.name}`,
      `Snapshot ${snap.name} (${snap.sizeMB} MB) saved.`,
      'info',
      'vps',
      vps.id
    );
    showToast('Snapshot Created', `Snapshot created for ${vps.hostname}.`, 'success');
  };

  return (
    <div>
      {/* Top Header matching reference image */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>VPS</h1>
          <p className="page-subtitle">Manage your virtual private servers.</p>
        </div>

        <div>
          <Button
            variant="primary"
            className="btn-pill"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Get VPS
          </Button>
        </div>
      </div>

      {/* VPS Table Section with Expandable Row Telemetry */}
      <div style={{ marginBottom: '1.5rem' }}>
        <VpsTable
          vpsList={vpsList}
          onRestart={(vps) => handleOpenConfirm(vps, 'restart')}
          onStop={(vps) => handleOpenConfirm(vps, vps.status === 'Running' ? 'stop' : 'start')}
          onDelete={(vps) => handleOpenConfirm(vps, 'delete')}
          onSnapshot={handleSnapshot}
        />
      </div>

      {/* "ADD MORE" divider matching screenshot */}
      <div className="add-more-divider">
        <span>ADD MORE</span>
      </div>

      {/* Create Modal */}
      <CreateVpsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateVps}
      />

      {/* Action Confirmation Modal */}
      <VpsActionConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteAction}
        actionType={actionType}
        vps={targetVps}
        loading={actionLoading}
      />
    </div>
  );
};
