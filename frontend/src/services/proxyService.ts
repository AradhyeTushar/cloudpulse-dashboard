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

  createEndpoint: (ep: Omit<ProxyEndpointConfig, 'id' | 'createdAt'>): ProxyEndpointConfig => {
    const list = proxyService.getEndpoints();
    const newEp: ProxyEndpointConfig = {
      ...ep,
      id: 'ep_' + Math.random().toString(36).substring(2, 9),
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
    const newExitIP = `198.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          exitIP: newExitIP,
          startedAt: 'Just now',
          durationSeconds: 0,
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

  // Admin Services
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
        return {
          ...u,
          status: (u.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended',
        };
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
