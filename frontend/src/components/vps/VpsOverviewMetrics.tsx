import React from 'react';
import { Cpu, Server, HardDrive, Activity, Clock } from 'lucide-react';
import { VpsInstance } from '../../types';
import { OverviewCard } from '../dashboard/OverviewCard';

interface VpsOverviewMetricsProps {
  vps: VpsInstance;
}

export const VpsOverviewMetrics: React.FC<VpsOverviewMetricsProps> = ({ vps }) => {
  const { currentMetrics, planDetails, uptimeSeconds } = vps;

  // Format uptime
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const uptimeFormatted = `${days}d ${hours}h`;

  return (
    <div className="metrics-grid">
      <OverviewCard
        label="CPU Usage"
        value={`${currentMetrics.cpuPercent}%`}
        subtitle={`${planDetails.vCPU} vCPU Core${planDetails.vCPU > 1 ? 's' : ''} @ 3.4 GHz`}
        icon={<Cpu size={20} />}
        progressPercent={currentMetrics.cpuPercent}
      />

      <OverviewCard
        label="RAM Memory"
        value={`${currentMetrics.ramPercent}%`}
        subtitle={`${currentMetrics.ramUsedGB.toFixed(2)} GB of ${planDetails.ramGB} GB used`}
        icon={<Server size={20} />}
        progressPercent={currentMetrics.ramPercent}
      />

      <OverviewCard
        label="NVMe Storage"
        value={`${currentMetrics.storagePercent.toFixed(0)}%`}
        subtitle={`${currentMetrics.storageUsedGB} GB of ${planDetails.storageGB} GB used`}
        icon={<HardDrive size={20} />}
        progressPercent={currentMetrics.storagePercent}
      />

      <OverviewCard
        label="Network Traffic"
        value={`${currentMetrics.networkTotalGB} GB`}
        subtitle={`In: ${currentMetrics.networkInMB} MB • Out: ${currentMetrics.networkOutMB} MB`}
        icon={<Activity size={20} />}
      />

      <OverviewCard
        label="System Uptime"
        value={uptimeFormatted}
        subtitle="100% SLA uptime achieved"
        icon={<Clock size={20} />}
      />
    </div>
  );
};
