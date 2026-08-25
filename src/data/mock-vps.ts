import { VpsInstance, VpsPlan, CatalogItem, MetricTimePoint, FirewallRule, SnapshotItem } from '../types';

export const MOCK_VPS_PLANS: VpsPlan[] = [
  { id: 'kvm-1', name: 'KVM 1', vCPU: 1, ramGB: 4, storageGB: 50, bandwidthTB: 4, priceMonthly: 5.99 },
  { id: 'kvm-2', name: 'KVM 2', vCPU: 2, ramGB: 8, storageGB: 80, bandwidthTB: 8, priceMonthly: 9.99 },
  { id: 'kvm-4', name: 'KVM 4', vCPU: 4, ramGB: 16, storageGB: 160, bandwidthTB: 16, priceMonthly: 19.99 },
  { id: 'kvm-8', name: 'KVM 8', vCPU: 8, ramGB: 32, storageGB: 320, bandwidthTB: 32, priceMonthly: 39.99 },
];

export const INITIAL_VPS_LIST: VpsInstance[] = [
  {
    id: 'srv1920898',
    name: 'srv1920898',
    hostname: 'srv1920898.hstgr.cloud',
    ipAddress: '200.234.41.58',
    ipv6Address: '2a02:4780:11:1010::1',
    status: 'Running',
    plan: 'KVM 2',
    planDetails: {
      vCPU: 2,
      ramGB: 8,
      storageGB: 80,
      bandwidthTB: 8,
    },
    region: 'US East',
    regionFlag: '🇺🇸',
    datacenter: 'New York (US-East 1)',
    os: 'ubuntu',
    osVersion: 'Ubuntu 24.04 64bit',
    kernelVersion: 'Linux 6.8.0-31-generic',
    virtualization: 'KVM',
    createdAt: '2026-08-21',
    expiresAt: '2026-09-21',
    uptimeSeconds: 1051200, // 12d 4h
    currentMetrics: {
      cpuPercent: 23,
      ramPercent: 42,
      storagePercent: 47.5,
      ramUsedGB: 3.36,
      storageUsedGB: 38.0,
      networkInMB: 480,
      networkOutMB: 720,
      networkTotalGB: 1.2,
    },
    snapshotsCount: 2,
    backupsEnabled: true,
    autoRenew: true,
  }
];

export const MOCK_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'game-panel',
    title: 'Game Panel',
    description: 'Host your favorite games with powerful processors and full customization.',
    category: 'panels',
    icon: 'Gamepad2',
    actionText: 'Setup',
  },
  {
    id: 'self-hosting-n8n',
    title: 'Self hosting n8n',
    description: 'Self-hosted n8n delivers no-code AI workflows with unlimited runs.',
    category: 'workflows',
    icon: 'Workflow',
    actionText: 'Setup',
  },
  {
    id: 'app-catalog',
    title: 'Application catalog',
    description: 'Deploy popular apps like OpenClaw, Paperclip, Hermes agent and more.',
    category: 'apps',
    icon: 'Boxes',
    actionText: 'See catalog',
  }
];

// Generate realistic mock metric history
export const generateMockMetrics = (range: '1h' | '24h' | '7d' | '30d'): MetricTimePoint[] => {
  const pointsCount = range === '1h' ? 20 : range === '24h' ? 24 : range === '7d' ? 28 : 30;
  const points: MetricTimePoint[] = [];
  const now = Date.now();
  const stepMs = (range === '1h' ? 3 * 60 : range === '24h' ? 60 * 60 : range === '7d' ? 6 * 3600 : 24 * 3600) * 1000;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const t = new Date(now - i * stepMs);
    const timeStr = range === '1h' 
      ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : range === '24h'
      ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : t.toLocaleDateString([], { month: 'short', day: 'numeric' });

    // Realistic curves with some jitter
    const baseCpu = 20 + Math.sin(i * 0.4) * 8 + (Math.random() * 6 - 3);
    const baseRam = 40 + Math.cos(i * 0.2) * 5 + (Math.random() * 4 - 2);
    const baseDisk = 12 + Math.random() * 8;
    const baseNetIn = 15 + Math.sin(i * 0.5) * 10 + Math.random() * 5;
    const baseNetOut = 25 + Math.cos(i * 0.5) * 15 + Math.random() * 10;

    points.push({
      timestamp: timeStr,
      cpu: Math.max(5, Math.min(95, Math.round(baseCpu))),
      ram: Math.max(15, Math.min(90, Math.round(baseRam))),
      diskIO: Math.max(1, Math.round(baseDisk)),
      networkIn: Math.max(0, Math.round(baseNetIn)),
      networkOut: Math.max(0, Math.round(baseNetOut)),
    });
  }
  return points;
};

export const MOCK_FIREWALL_RULES: FirewallRule[] = [
  { id: 'f-1', type: 'Inbound', protocol: 'TCP', portRange: '22', source: '0.0.0.0/0', action: 'ACCEPT', description: 'SSH Access' },
  { id: 'f-2', type: 'Inbound', protocol: 'TCP', portRange: '80, 443', source: '0.0.0.0/0', action: 'ACCEPT', description: 'HTTP / HTTPS Web Traffic' },
  { id: 'f-3', type: 'Inbound', protocol: 'TCP', portRange: '5432', source: '10.0.0.0/16', action: 'ACCEPT', description: 'PostgreSQL internal network' },
  { id: 'f-4', type: 'Outbound', protocol: 'ALL', portRange: 'ALL', source: '0.0.0.0/0', action: 'ACCEPT', description: 'Allow all outbound connections' },
];

export const MOCK_SNAPSHOTS: SnapshotItem[] = [
  { id: 'snap-01', name: 'pre-upgrade-backup', sizeMB: 4820, createdAt: '2026-08-22 14:10', status: 'Available' },
  { id: 'snap-02', name: 'stable-release-v1.4', sizeMB: 5120, createdAt: '2026-08-24 09:30', status: 'Available' },
];
