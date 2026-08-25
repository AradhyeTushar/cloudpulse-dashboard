export type VpsStatus = 'Running' | 'Stopped' | 'Provisioning' | 'Error' | 'Suspended';

export type OperatingSystem = 'ubuntu' | 'debian' | 'almalinux' | 'docker' | 'windows';

export type RegionId = 'us-east' | 'eu-central' | 'ap-southeast' | 'us-west';

export interface VpsPlan {
  id: string;
  name: string;
  vCPU: number;
  ramGB: number;
  storageGB: number;
  bandwidthTB: number;
  priceMonthly: number;
}

export interface VpsInstance {
  id: string;
  name: string; // e.g. srv1920898
  hostname: string; // e.g. srv1920898.hstgr.cloud
  ipAddress: string; // e.g. 200.234.41.58
  ipv6Address?: string; // e.g. 2a02:4780:11:1010::1
  status: VpsStatus;
  plan: string; // e.g. KVM 2
  planDetails: {
    vCPU: number;
    ramGB: number;
    storageGB: number;
    bandwidthTB: number;
  };
  region: string; // e.g. US East
  regionFlag?: string;
  datacenter: string; // e.g. New York (US-1)
  os: OperatingSystem;
  osVersion: string; // e.g. Ubuntu 24.04 64bit
  kernelVersion: string;
  virtualization: 'KVM' | 'LXC';
  createdAt: string; // e.g. 2026-08-21
  expiresAt: string; // e.g. 2026-09-21
  uptimeSeconds: number;
  currentMetrics: {
    cpuPercent: number;
    ramPercent: number;
    storagePercent: number;
    ramUsedGB: number;
    storageUsedGB: number;
    networkInMB: number;
    networkOutMB: number;
    networkTotalGB: number;
  };
  snapshotsCount: number;
  backupsEnabled: boolean;
  autoRenew: boolean;
}

export interface MetricTimePoint {
  timestamp: string;
  cpu: number;
  ram: number;
  diskIO: number;
  networkIn: number;
  networkOut: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  targetType: 'vps' | 'application' | 'domain' | 'security' | 'billing';
  status: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  relativeTime: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  workspaceName: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  twoFactorEnabled: boolean;
  activeSessions: {
    id: string;
    device: string;
    browser: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
  }[];
  notificationPreferences: {
    emailAlerts: boolean;
    serverDowntime: boolean;
    highResourceUsage: boolean;
    deploymentStatus: boolean;
    marketingNewsletter: boolean;
  };
}

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: 'panels' | 'workflows' | 'apps' | 'databases';
  icon: string;
  badge?: string;
  actionText: string;
}

export interface FirewallRule {
  id: string;
  type: 'Inbound' | 'Outbound';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
  portRange: string;
  source: string;
  action: 'ACCEPT' | 'DROP';
  description: string;
}

export interface SnapshotItem {
  id: string;
  name: string;
  sizeMB: number;
  createdAt: string;
  status: 'Available' | 'Creating';
}
