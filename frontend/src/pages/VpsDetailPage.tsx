import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Power,
  Trash2,
  Terminal,
  ArrowLeft,
  Copy,
  Check,
  Server,
  Shield,
  Camera,
  Settings,
  Plus,
} from 'lucide-react';
import { vpsService } from '../services/vpsService';
import { activityService } from '../services/activityService';
import { VpsInstance, MetricTimePoint, FirewallRule, SnapshotItem } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs, TabItem } from '../components/ui/Tabs';
import { VpsOverviewMetrics } from '../components/vps/VpsOverviewMetrics';
import { ResourceChart } from '../components/vps/ResourceChart';
import { VpsWebTerminal } from '../components/vps/VpsWebTerminal';
import { VpsActionConfirmModal, VpsActionType } from '../components/vps/VpsActionConfirmModal';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

export const VpsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vps, setVps] = useState<VpsInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [metrics, setMetrics] = useState<MetricTimePoint[]>([]);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [copiedIp, setCopiedIp] = useState(false);

  // Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<VpsActionType>('restart');
  const [actionLoading, setActionLoading] = useState(false);

  // Snapshot modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Firewall rule modal
  const [firewallModalOpen, setFirewallModalOpen] = useState(false);
  const [rulePort, setRulePort] = useState('');
  const [ruleProtocol, setRuleProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [ruleDesc, setRuleDesc] = useState('');

  const loadVpsData = async () => {
    if (!id) return;
    try {
      const found = await vpsService.getVpsById(id);
      if (found) {
        setVps(found);
      } else {
        // If id doesn't match, fallback to first
        const list = await vpsService.getVpsList();
        if (list.length > 0) setVps(list[0]);
      }
      const [metricData, fRules, snaps] = await Promise.all([
        vpsService.getMetrics(timeRange),
        vpsService.getFirewallRules(),
        vpsService.getSnapshots(),
      ]);
      setMetrics(metricData);
      setFirewallRules(fRules);
      setSnapshots(snaps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVpsData();
  }, [id, timeRange]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(true);
    showToast('Copied', `${text} copied to clipboard.`, 'success');
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleOpenAction = (type: VpsActionType) => {
    setActionType(type);
    setConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!vps) return;
    setActionLoading(true);

    try {
      if (actionType === 'restart') {
        await vpsService.updateVpsStatus(vps.id, 'Running');
        showToast('Server Restarted', `${vps.hostname} reboot sequence finished.`, 'success');
      } else if (actionType === 'stop') {
        const nextStatus = vps.status === 'Running' ? 'Stopped' : 'Running';
        await vpsService.updateVpsStatus(vps.id, nextStatus);
        showToast(`Server ${nextStatus}`, `${vps.hostname} power status updated.`, 'info');
      } else if (actionType === 'delete') {
        await vpsService.deleteVps(vps.id);
        showToast('Server Deleted', `${vps.hostname} was removed.`, 'success');
        navigate('/vps');
        return;
      }
      await loadVpsData();
      setConfirmModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vps) return;
    setSnapshotLoading(true);
    try {
      const snap = await vpsService.createSnapshot(newSnapshotName || `snap-${vps.name}`);
      setSnapshots((prev) => [snap, ...prev]);
      setSnapshotModalOpen(false);
      setNewSnapshotName('');
      showToast('Snapshot Saved', `Snapshot ${snap.name} created successfully.`, 'success');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleAddFirewallRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulePort) return;
    const newRule = await vpsService.addFirewallRule({
      type: 'Inbound',
      protocol: ruleProtocol,
      portRange: rulePort,
      source: '0.0.0.0/0',
      action: 'ACCEPT',
      description: ruleDesc || `Port ${rulePort} Traffic`,
    });
    setFirewallRules((prev) => [...prev, newRule]);
    setFirewallModalOpen(false);
    setRulePort('');
    setRuleDesc('');
    showToast('Firewall Updated', `Port ${newRule.portRange} opened.`, 'success');
  };

  if (loading || !vps) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading server details...
      </div>
    );
  }

  const tabItems: TabItem[] = [
    { id: 'overview', label: 'Overview & Charts', icon: <Server size={15} /> },
    { id: 'terminal', label: 'Web Console', icon: <Terminal size={15} /> },
    { id: 'snapshots', label: 'Snapshots & Backups', icon: <Camera size={15} />, badge: snapshots.length },
    { id: 'networking', label: 'Networking & Firewall', icon: <Shield size={15} />, badge: firewallRules.length },
    { id: 'settings', label: 'Configuration & Settings', icon: <Settings size={15} /> },
  ];

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/vps')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={14} />
        <span>Back to all servers</span>
      </button>

      {/* Header Bar */}
      <div className="vps-detail-header">
        <div className="vps-title-section">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="vps-main-title">{vps.name}</h1>
              <StatusBadge status={vps.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>{vps.hostname}</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{vps.ipAddress}</span>
              <button
                onClick={() => handleCopy(vps.ipAddress)}
                className="copy-btn"
                title="Copy IPv4"
              >
                {copiedIp ? <Check size={14} color="var(--status-running)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="vps-action-toolbar">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCw size={14} />}
            onClick={() => handleOpenAction('restart')}
          >
            Restart
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Power size={14} />}
            onClick={() => handleOpenAction('stop')}
          >
            {vps.status === 'Running' ? 'Stop' : 'Start'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Terminal size={14} />}
            onClick={() => setActiveTab('terminal')}
          >
            Web Console
          </Button>

          <Button
            variant="outline"
            size="sm"
            style={{ color: 'var(--status-error)' }}
            icon={<Trash2 size={14} />}
            onClick={() => handleOpenAction('delete')}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Top Overview Metric Cards */}
      <VpsOverviewMetrics vps={vps} />

      {/* Navigation Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Historical Resource Graphs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            <ResourceChart
              title="CPU Utilization"
              currentValue={`${vps.currentMetrics.cpuPercent}%`}
              data={metrics}
              dataKey="cpu"
              unit="%"
              color="#6366f1"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />

            <ResourceChart
              title="RAM Memory Usage"
              currentValue={`${vps.currentMetrics.ramPercent}%`}
              data={metrics}
              dataKey="ram"
              unit="%"
              color="#8b5cf6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />

            <ResourceChart
              title="Disk IO Throughput"
              currentValue="18.4 MB/s"
              data={metrics}
              dataKey="diskIO"
              unit="MB/s"
              color="#ec4899"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />

            <ResourceChart
              title="Network Bandwidth"
              currentValue="42.8 Mbps"
              data={metrics}
              dataKey="networkIn"
              secondaryKey="networkOut"
              unit="Mbps"
              color="#10b981"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>

          {/* Server Information Specs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <Card title="Hardware & System Specifications">
              <div className="specs-grid" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
                <div className="spec-item">
                  <span className="spec-name">Server ID</span>
                  <span className="spec-value" style={{ fontFamily: 'var(--font-mono)' }}>{vps.id}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Operating System</span>
                  <span className="spec-value">{vps.osVersion}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Linux Kernel</span>
                  <span className="spec-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{vps.kernelVersion}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Virtualization Platform</span>
                  <span className="spec-value">{vps.virtualization} Hypervisor</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Compute Plan</span>
                  <span className="spec-value">{vps.plan} ({vps.planDetails.vCPU} vCPU, {vps.planDetails.ramGB}GB RAM)</span>
                </div>
              </div>
            </Card>

            <Card title="Networking & Datacenter Location">
              <div className="specs-grid" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
                <div className="spec-item">
                  <span className="spec-name">Primary IPv4</span>
                  <span className="spec-value" style={{ fontFamily: 'var(--font-mono)' }}>{vps.ipAddress}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">IPv6 Subnet</span>
                  <span className="spec-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{vps.ipv6Address || '2a02:4780:11:1010::1'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Datacenter Region</span>
                  <span className="spec-value">{vps.regionFlag} {vps.region}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Facility Node</span>
                  <span className="spec-value">{vps.datacenter}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-name">Created Date</span>
                  <span className="spec-value">{vps.createdAt}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TERMINAL */}
      {activeTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Direct browser-based SSH terminal session running over secure WebSockets.
            </p>
          </div>
          <VpsWebTerminal vps={vps} />
        </div>
      )}

      {/* TAB 3: SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <Card
          title="Manual Snapshots & Restore Points"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setSnapshotModalOpen(true)}
            >
              Take Snapshot
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {snap.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Size: {(snap.sizeMB / 1024).toFixed(2)} GB • Created {snap.createdAt}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showToast('Restore Snapshot', `Rollback to ${snap.name} initiated.`, 'info')}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ color: 'var(--status-error)' }}
                    onClick={() => {
                      setSnapshots((prev) => prev.filter((s) => s.id !== snap.id));
                      showToast('Snapshot Deleted', `${snap.name} removed.`, 'success');
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: NETWORKING & FIREWALL */}
      {activeTab === 'networking' && (
        <Card
          title="Cloud Firewall Rules"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setFirewallModalOpen(true)}
            >
              Add Port Rule
            </Button>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Protocol</th>
                  <th>Port Range</th>
                  <th>Source CIDR</th>
                  <th>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {firewallRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{rule.type}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{rule.protocol}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>{rule.portRange}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{rule.source}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--status-running-bg)', color: 'var(--status-running)' }}>
                        {rule.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Server Identity & Hostname">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Hostname Saved', 'Reverse DNS PTR and server hostname updated.', 'success');
              }}
            >
              <div className="form-group">
                <label className="form-label">Server Display Name</label>
                <input type="text" className="form-input" defaultValue={vps.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Qualified Domain Name (FQDN)</label>
                <input type="text" className="form-input" defaultValue={vps.hostname} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" type="submit">Save Hostname</Button>
              </div>
            </form>
          </Card>

          <Card title="Root Password Reset">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Password Reset', 'New root password has been applied to VPS.', 'success');
              }}
            >
              <div className="form-group">
                <label className="form-label">New Root Password</label>
                <input type="password" placeholder="••••••••••••" className="form-input" />
                <span className="form-help">Requires a graceful server reboot to inject new credentials.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="submit">Reset Root Password</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      <VpsActionConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteAction}
        vps={vps}
        actionType={actionType}
        loading={actionLoading}
      />

      {/* Snapshot Modal */}
      <Modal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        title="Take New VPS Snapshot"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSnapshotModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSnapshot} loading={snapshotLoading}>Create Snapshot</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Snapshot Name / Description</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. pre-node-update"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
          />
          <span className="form-help">Captures NVMe block state and active RAM image.</span>
        </div>
      </Modal>

      {/* Firewall Rule Modal */}
      <Modal
        isOpen={firewallModalOpen}
        onClose={() => setFirewallModalOpen(false)}
        title="Add Firewall Port Rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFirewallModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddFirewallRule}>Add Rule</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Port / Port Range</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 3000, 8080 or 8000-8050"
            value={rulePort}
            onChange={(e) => setRulePort(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Protocol</label>
          <select
            className="form-select"
            value={ruleProtocol}
            onChange={(e) => setRuleProtocol(e.target.value as 'TCP' | 'UDP')}
          >
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description / Service Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Node API Server"
            value={ruleDesc}
            onChange={(e) => setRuleDesc(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
