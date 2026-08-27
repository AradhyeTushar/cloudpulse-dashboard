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
  name: string;
  hostname: string;
  ipAddress: string;
  ipv6Address?: string;
  status: VpsStatus;
  plan: string;
  planDetails: {
    vCPU: number;
    ramGB: number;
    storageGB: number;
    bandwidthTB: number;
  };
  region: string;
  regionFlag?: string;
  datacenter: string;
  os: OperatingSystem;
  osVersion: string;
  kernelVersion: string;
  virtualization: 'KVM' | 'LXC';
  createdAt: string;
  expiresAt: string;
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

export type ProxyType = 'residential' | 'datacenter' | 'mobile' | 'isp';
export type ProxyProtocol = 'http' | 'https' | 'socks5';
export type ProxyRotationMode = 'sticky' | 'rotating';
export type ProxyStatus = 'Active' | 'Disabled' | 'Expired' | 'Traffic Limit Reached' | 'Plan Expired';

export interface ProxyEndpointConfig {
  id: string;
  name: string;
  proxyType: ProxyType;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username: string;
  password: string;
  rotationMode: ProxyRotationMode;
  sessionDurationMin: number;
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  ipWhitelist: string[];
  createdAt: string;
  // Plan & Status tracking fields
  status?: ProxyStatus;
  disabledReason?: string;
  usedBytes?: number;
  limitBytes?: number;
  expiresAt?: string;
  isFree?: boolean;
  planId?: string;
}

export interface UserProxySubscription {
  id: string;
  planId: string;
  planSlug: string;
  status: 'active' | 'expired' | 'canceled';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  paymentMethod?: string;
  lastDailyReset?: string;
}

export interface ProxyUsageDashboardSummary {
  plan: {
    id: string;
    slug: string;
    name: string;
    priceUSD: number;
    priceDisplay: string;
    isFree: boolean;
    expiresAt: string;
    renewalDisplay: string;
    status: 'Active' | 'Expired';
    validityDisplay: string;
  };
  proxyUsage: {
    used: number;
    max: number;
    available: number;
    activeCount: number;
    disabledCount: number;
    expiredCount: number;
    usagePercent: number;
  };
  trafficUsage: {
    usedMB: number;
    limitMB: number;
    remainingMB: number;
    usagePercent: number;
    usedDisplay: string;
    remainingDisplay: string;
    limitDisplay: string;
    resetInfo: string;
    scope: 'per_proxy' | 'daily' | 'total_period';
  };
}

export interface ProxyLocationNode {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  region: 'North America' | 'Europe' | 'Asia-Pacific' | 'Latin America' | 'Middle East';
  totalIPs: number;
  availableIPs: number;
  avgLatencyMs: number;
  status: 'optimal' | 'moderate' | 'degraded';
  activeNodes: number;
}

export interface ProxyStickySession {
  id: string;
  endpointName: string;
  exitIP: string;
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  protocol: ProxyProtocol;
  startedAt: string;
  durationSeconds: number;
  bytesInMB: number;
  bytesOutMB: number;
  requestsCount: number;
  status: 'active' | 'expiring' | 'terminated';
}

export interface BandwidthUsageStats {
  totalGBUsed: number;
  totalGBLimit: number;
  remainingGB: number;
  activeConcurrentStreams: number;
  requestsToday: number;
  dailySeries: { date: string; usageGB: number; requests: number }[];
  topDomains: { domain: string; percentage: number; requests: number; bandwidthGB: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'suspended' | 'pending';
  plan: string;
  bandwidthUsedGB: number;
  bandwidthLimitGB: number;
  activeSessionsCount: number;
  createdAt: string;
}

export interface AdminPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  pricePerGB: number;
  bandwidthGB: number;
  threadsLimit: number;
  dedicatedPools: boolean;
  features: string[];
  isActive: boolean;
}

export interface AdminProvider {
  id: string;
  name: string;
  type: 'Residential IP Pool' | 'Datacenter Tier 1' | 'Mobile Carrier 5G' | 'ISP Direct';
  region: string;
  totalNodes: number;
  activeNodes: number;
  latencyMs: number;
  uptimePct: number;
  status: 'online' | 'warning' | 'maintenance';
}

export interface AdminAbuseEvent {
  id: string;
  timestamp: string;
  ip: string;
  userEmail: string;
  targetDomain: string;
  reason: string;
  actionTaken: 'Blocked' | 'Rate-Limited' | 'Flagged';
  severity: 'high' | 'medium' | 'low';
}

export interface AdminSystemHealth {
  gatewayThroughputMBps: number;
  totalActiveTunnels: number;
  redisLatencyMs: number;
  postgresQueryTimeMs: number;
  apiSuccessRatePct: number;
  nodeHealthPct: number;
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

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  targetType: 'proxy' | 'session' | 'billing' | 'security' | 'vps' | 'application' | 'domain';
  status: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  relativeTime: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: 'residential' | 'datacenter' | 'mobile' | 'tools' | 'panels' | 'workflows' | 'apps' | 'databases';
  icon: string;
  badge?: string;
  actionText: string;
}
