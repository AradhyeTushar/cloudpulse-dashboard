import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Rocket, Globe, Activity, Plus, ShieldCheck } from 'lucide-react';
import { OverviewCard } from '../components/dashboard/OverviewCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ActivityList } from '../components/dashboard/ActivityList';
import { CreateVpsModal } from '../components/vps/CreateVpsModal';
import { vpsService } from '../services/vpsService';
import { activityService } from '../services/activityService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { VpsInstance, ActivityItem, UserProfile } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [vList, acts, uProfile] = await Promise.all([
        vpsService.getVpsList(),
        activityService.getActivities(),
        userService.getUserProfile(),
      ]);
      setVpsList(vList);
      setActivities(acts);
      setUser(uProfile);
    };
    loadData();
  }, []);

  const handleCreateVps = async (data: Parameters<typeof vpsService.createVps>[0]) => {
    const newVps = await vpsService.createVps(data);
    await activityService.addActivity(
      `VPS ${newVps.name} created`,
      `New ${newVps.plan} instance deployed in ${newVps.region}.`,
      'success',
      'vps',
      newVps.id
    );
    setVpsList((prev) => [newVps, ...prev]);
    setActivities(await activityService.getActivities());
    showToast('VPS Created', `${newVps.hostname} is now active and ready.`, 'success');
  };

  const runningVpsCount = vpsList.filter((v) => v.status === 'Running').length;
  const firstName = user?.name.split(' ')[0] || 'Alex';

  return (
    <div>
      {/* Welcome Section */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <div className="welcome-badge">
            <ShieldCheck size={13} />
            <span>Infrastructure Status: All Systems Operational</span>
          </div>
          <h2>Good morning, {firstName}</h2>
          <p>Manage your infrastructure, applications, and servers from one place.</p>
        </div>

        <div style={{ display: 'none' }} className="d-md-block">
          <button
            className="btn btn-primary btn-pill"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>+ Create VPS</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="metrics-grid">
        <OverviewCard
          label="VPS"
          value={runningVpsCount}
          subtitle="Running VPS instances"
          icon={<Server size={20} />}
          trend={{ text: '+1 this week', isPositive: true }}
        />

        <OverviewCard
          label="Applications"
          value="0"
          subtitle="Deployed applications"
          icon={<Rocket size={20} />}
        />

        <OverviewCard
          label="Domains"
          value="0"
          subtitle="Connected domains"
          icon={<Globe size={20} />}
        />

        <OverviewCard
          label="Usage"
          value="24%"
          subtitle="Current resource usage"
          icon={<Activity size={20} />}
          progressPercent={24}
        />
      </div>

      {/* Quick Actions Grid */}
      <QuickActions onCreateVps={() => setIsCreateModalOpen(true)} />

      {/* Recent Activity Section */}
      <div style={{ marginBottom: '2rem' }}>
        <ActivityList activities={activities} />
      </div>

      {/* Create VPS Modal */}
      <CreateVpsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateVps}
      />
    </div>
  );
};
