import { VpsInstance, MetricTimePoint, FirewallRule, SnapshotItem } from '../types';
import { INITIAL_VPS_LIST, generateMockMetrics, MOCK_FIREWALL_RULES, MOCK_SNAPSHOTS } from '../data/mock-vps';

const VPS_STORAGE_KEY = 'nexus_cloud_vps_list';
const FIREWALL_STORAGE_KEY = 'nexus_cloud_firewall_rules';
const SNAPSHOTS_STORAGE_KEY = 'nexus_cloud_snapshots';

class VpsService {
  private getStoredVpsList(): VpsInstance[] {
    try {
      const data = localStorage.getItem(VPS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    return INITIAL_VPS_LIST;
  }

  private saveVpsList(list: VpsInstance[]) {
    try {
      localStorage.setItem(VPS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  // List all VPS
  async getVpsList(): Promise<VpsInstance[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return this.getStoredVpsList();
  }

  // Get VPS by ID
  async getVpsById(id: string): Promise<VpsInstance | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const list = this.getStoredVpsList();
    const found = list.find((v) => v.id === id || v.name === id);
    return found || null;
  }

  // Create new VPS instance (mock)
  async createVps(data: {
    name: string;
    hostname: string;
    os: 'ubuntu' | 'debian' | 'almalinux' | 'docker' | 'windows';
    plan: string;
    region: string;
    sshKey?: string;
  }): Promise<VpsInstance> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = this.getStoredVpsList();

    const osNameMap: Record<string, string> = {
      ubuntu: 'Ubuntu 24.04 64bit',
      debian: 'Debian 12 64bit',
      almalinux: 'AlmaLinux 9 64bit',
      docker: 'Docker on Ubuntu 24.04',
      windows: 'Windows Server 2022',
    };

    const newVps: VpsInstance = {
      id: `srv${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: data.name.trim() || `srv-${Math.floor(1000 + Math.random() * 9000)}`,
      hostname: data.hostname.trim() || `${data.name.trim() || 'server'}.hstgr.cloud`,
      ipAddress: `198.51.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
      ipv6Address: `2a02:4780:11:${Math.floor(Math.random() * 9000)}::1`,
      status: 'Running',
      plan: data.plan || 'KVM 2',
      planDetails: {
        vCPU: data.plan.includes('4') ? 4 : data.plan.includes('8') ? 8 : data.plan.includes('1') ? 1 : 2,
        ramGB: data.plan.includes('4') ? 16 : data.plan.includes('8') ? 32 : data.plan.includes('1') ? 4 : 8,
        storageGB: data.plan.includes('4') ? 160 : data.plan.includes('8') ? 320 : data.plan.includes('1') ? 50 : 80,
        bandwidthTB: data.plan.includes('4') ? 16 : data.plan.includes('8') ? 32 : data.plan.includes('1') ? 4 : 8,
      },
      region: data.region || 'US East',
      regionFlag: data.region.includes('EU') ? '🇩🇪' : data.region.includes('Asia') ? '🇸🇬' : '🇺🇸',
      datacenter: `${data.region || 'US East'} Datacenter Node 01`,
      os: data.os,
      osVersion: osNameMap[data.os] || 'Ubuntu 24.04 64bit',
      kernelVersion: 'Linux 6.8.0-31-generic',
      virtualization: 'KVM',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      uptimeSeconds: 120,
      currentMetrics: {
        cpuPercent: 8,
        ramPercent: 18,
        storagePercent: 12,
        ramUsedGB: 1.44,
        storageUsedGB: 9.6,
        networkInMB: 42,
        networkOutMB: 65,
        networkTotalGB: 0.1,
      },
      snapshotsCount: 0,
      backupsEnabled: true,
      autoRenew: true,
    };

    const updated = [newVps, ...list];
    this.saveVpsList(updated);
    return newVps;
  }

  // Update Status (Restart, Stop, Start)
  async updateVpsStatus(id: string, status: VpsInstance['status']): Promise<VpsInstance | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = this.getStoredVpsList();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], status };
    this.saveVpsList(list);
    return list[index];
  }

  // Delete VPS
  async deleteVps(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = this.getStoredVpsList();
    const filtered = list.filter((v) => v.id !== id);
    this.saveVpsList(filtered);
    return true;
  }

  // Get historical resource metrics
  async getMetrics(range: '1h' | '24h' | '7d' | '30d'): Promise<MetricTimePoint[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return generateMockMetrics(range);
  }

  // Get Firewall Rules
  async getFirewallRules(): Promise<FirewallRule[]> {
    try {
      const data = localStorage.getItem(FIREWALL_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return MOCK_FIREWALL_RULES;
  }

  // Add Firewall Rule
  async addFirewallRule(rule: Omit<FirewallRule, 'id'>): Promise<FirewallRule> {
    const existing = await this.getFirewallRules();
    const newRule: FirewallRule = {
      ...rule,
      id: `f-${Date.now()}`,
    };
    const updated = [...existing, newRule];
    localStorage.setItem(FIREWALL_STORAGE_KEY, JSON.stringify(updated));
    return newRule;
  }

  // Get Snapshots
  async getSnapshots(): Promise<SnapshotItem[]> {
    try {
      const data = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return MOCK_SNAPSHOTS;
  }

  // Create Snapshot
  async createSnapshot(name: string): Promise<SnapshotItem> {
    const existing = await this.getSnapshots();
    const newSnap: SnapshotItem = {
      id: `snap-${Date.now()}`,
      name: name.trim() || `snap-${new Date().toISOString().slice(0, 10)}`,
      sizeMB: Math.floor(4000 + Math.random() * 2000),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Available',
    };
    const updated = [newSnap, ...existing];
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    return newSnap;
  }
}

export const vpsService = new VpsService();
