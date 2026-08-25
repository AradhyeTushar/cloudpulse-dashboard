import {
  ProxyEndpointConfig,
  ProxyLocationNode,
  ProxyStickySession,
  BandwidthUsageStats,
  AdminUser,
  AdminPlan,
  AdminProvider,
  AdminAbuseEvent,
  AdminSystemHealth,
} from '../types';
import {
  MOCK_PROXY_ENDPOINTS,
  MOCK_LOCATIONS,
  MOCK_STICKY_SESSIONS,
  MOCK_USAGE_STATS,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_PLANS,
  MOCK_ADMIN_PROVIDERS,
  MOCK_ADMIN_ABUSE_EVENTS,
  MOCK_SYSTEM_HEALTH,
} from '../data/mock-proxy';

const ENDPOINTS_KEY = 'cloudpulse_proxy_endpoints';
const SESSIONS_KEY = 'cloudpulse_proxy_sessions';
const ADMIN_USERS_KEY = 'cloudpulse_admin_users';

export type CreateEndpointDTO = Partial<Omit<ProxyEndpointConfig, 'id' | 'createdAt'>> & {
  name: string;
  proxyType: ProxyEndpointConfig['proxyType'];
  protocol: ProxyEndpointConfig['protocol'];
  rotationMode: ProxyEndpointConfig['rotationMode'];
  country: string;
  countryCode: string;
};

export const proxyService = {
  getEndpoints: (): ProxyEndpointConfig[] => {
    const saved = localStorage.getItem(ENDPOINTS_KEY);
    if (!saved) {
      localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(MOCK_PROXY_ENDPOINTS));
      return MOCK_PROXY_ENDPOINTS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return MOCK_PROXY_ENDPOINTS;
    }
  },

  createEndpoint: (dto: CreateEndpointDTO): ProxyEndpointConfig => {
    const list = proxyService.getEndpoints();
    const host = dto.host || (dto.proxyType === 'datacenter' ? 'dc.cloudpulse.net' : 'pr.cloudpulse.net');
    const port = dto.port || (dto.protocol === 'socks5' ? 1080 : 8000);
    const username = dto.username || 'cp_' + Math.random().toString(36).substring(2, 8);
    const password = dto.password || 'p_sec_' + Math.random().toString(36).substring(2, 10);

    const newEp: ProxyEndpointConfig = {
      id: 'ep_' + Math.random().toString(36).substring(2, 9),
      name: dto.name,
      proxyType: dto.proxyType,
      protocol: dto.protocol,
      host,
      port,
      username,
      password,
      rotationMode: dto.rotationMode,
      sessionDurationMin: dto.sessionDurationMin || 10,
      country: dto.country,
      countryCode: dto.countryCode,
      state: dto.state,
      city: dto.city,
      ipWhitelist: dto.ipWhitelist || [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newEp, ...list];
    localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(updated));
    return newEp;
  },

  deleteEndpoint: (id: string) => {
    const list = proxyService.getEndpoints();
    const updated = list.filter((e) => e.id !== id);
    localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(updated));
  },

  getLocations: (): ProxyLocationNode[] => {
    return MOCK_LOCATIONS;
  },

  getStickySessions: (): ProxyStickySession[] => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    if (!saved) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(MOCK_STICKY_SESSIONS));
      return MOCK_STICKY_SESSIONS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return MOCK_STICKY_SESSIONS;
    }
  },

  rotateSessionIP: (sessionId: string): ProxyStickySession => {
    const sessions = proxyService.getStickySessions();
    const randomIP = `${Math.floor(Math.random() * 180 + 20)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          exitIP: randomIP,
          durationSeconds: 0,
          startedAt: 'Just now',
        };
      }
      return s;
    });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    return updated.find((s) => s.id === sessionId)!;
  },

  terminateSession: (sessionId: string) => {
    const sessions = proxyService.getStickySessions();
    const updated = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  },

  getUsageStats: (): BandwidthUsageStats => {
    return MOCK_USAGE_STATS;
  },

  // Admin Features
  getAdminUsers: (): AdminUser[] => {
    const saved = localStorage.getItem(ADMIN_USERS_KEY);
    if (!saved) {
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(MOCK_ADMIN_USERS));
      return MOCK_ADMIN_USERS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return MOCK_ADMIN_USERS;
    }
  },

  toggleUserStatus: (userId: string): AdminUser => {
    const users = proxyService.getAdminUsers();
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: nextStatus as 'active' | 'suspended' };
      }
      return u;
    });
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updated));
    return updated.find((u) => u.id === userId)!;
  },

  getAdminPlans: (): AdminPlan[] => {
    return MOCK_ADMIN_PLANS;
  },

  getAdminProviders: (): AdminProvider[] => {
    return MOCK_ADMIN_PROVIDERS;
  },

  getAdminAbuseEvents: (): AdminAbuseEvent[] => {
    return MOCK_ADMIN_ABUSE_EVENTS;
  },

  getSystemHealth: (): AdminSystemHealth => {
    return MOCK_SYSTEM_HEALTH;
  },
};
