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
  MOCK_LOCATIONS,
  MOCK_USAGE_STATS,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_PLANS,
  MOCK_ADMIN_PROVIDERS,
  MOCK_ADMIN_ABUSE_EVENTS,
  MOCK_SYSTEM_HEALTH,
} from '../data/mock-proxy';

function getCurrentUserIdentity(): { id: string; email: string; name: string } {
  try {
    const raw = localStorage.getItem('cloudpulse_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      return {
        id: u.id || 'usr_default',
        email: u.email || '',
        name: u.name || '',
      };
    }
  } catch {
    // fallback
  }
  return { id: 'usr_default', email: '', name: '' };
}

function getUserEndpointsKey(): string {
  const { id, email } = getCurrentUserIdentity();
  const safeKey = (email || id || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `cloudpulse_proxy_endpoints_${safeKey}`;
}

function getUserSessionsKey(): string {
  const { id, email } = getCurrentUserIdentity();
  const safeKey = (email || id || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `cloudpulse_proxy_sessions_${safeKey}`;
}

const ADMIN_USERS_KEY = 'cloudpulse_admin_users';

function getInitialUserEndpoints(email: string): ProxyEndpointConfig[] {
  if (email.includes('alex.mercer')) {
    return [
      {
        id: 'ep_mercer_1',
        name: 'Alex US Residential Grid',
        proxyType: 'residential',
        protocol: 'http',
        host: 'pr.cloudpulse.net',
        port: 8000,
        username: 'cp_1638ac43',
        password: 'p_sec_0068cfdb54424bbf',
        rotationMode: 'sticky',
        sessionDurationMin: 15,
        country: 'United States',
        countryCode: 'US',
        state: 'California',
        city: 'San Francisco',
        ipWhitelist: ['198.51.100.4'],
        createdAt: '2026-08-20',
      },
      {
        id: 'ep_mercer_2',
        name: 'Alex EU Scraping Pipeline',
        proxyType: 'residential',
        protocol: 'socks5',
        host: 'pr.cloudpulse.net',
        port: 8000,
        username: 'cp_1638ac43',
        password: 'p_sec_0068cfdb54424bbf',
        rotationMode: 'rotating',
        sessionDurationMin: 0,
        country: 'Germany',
        countryCode: 'DE',
        ipWhitelist: [],
        createdAt: '2026-08-22',
      },
    ];
  } else if (email.includes('admin.operator')) {
    return [
      {
        id: 'ep_admin_1',
        name: 'Admin Master Gateway Credential',
        proxyType: 'residential',
        protocol: 'http',
        host: 'pr.cloudpulse.net',
        port: 8000,
        username: 'cp_b5033187',
        password: 'p_sec_d2a742fbf1e60994',
        rotationMode: 'sticky',
        sessionDurationMin: 30,
        country: 'United States',
        countryCode: 'US',
        ipWhitelist: [],
        createdAt: '2026-08-01',
      },
    ];
  } else if (email.includes('validator')) {
    return [
      {
        id: 'ep_validator_1',
        name: 'Validator Automated Probe Credential',
        proxyType: 'residential',
        protocol: 'http',
        host: 'pr.cloudpulse.net',
        port: 8000,
        username: 'cp_76b59065',
        password: 'p_sec_a9cfccf6a8bba986',
        rotationMode: 'rotating',
        sessionDurationMin: 0,
        country: 'United Kingdom',
        countryCode: 'GB',
        ipWhitelist: [],
        createdAt: '2026-08-15',
      },
    ];
  }

  // New unique users start with their own clean default endpoint
  const prefix = email ? email.split('@')[0].slice(0, 6) : 'user';
  return [
    {
      id: 'ep_' + Math.random().toString(36).substring(2, 9),
      name: `${prefix.toUpperCase()} Primary Gateway`,
      proxyType: 'residential',
      protocol: 'http',
      host: 'pr.cloudpulse.net',
      port: 8000,
      username: 'cp_' + Math.random().toString(36).substring(2, 8),
      password: 'p_sec_' + Math.random().toString(36).substring(2, 12),
      rotationMode: 'sticky',
      sessionDurationMin: 10,
      country: 'United States',
      countryCode: 'US',
      ipWhitelist: [],
      createdAt: new Date().toISOString().split('T')[0],
    },
  ];
}

function getInitialUserSessions(email: string): ProxyStickySession[] {
  if (email.includes('alex.mercer')) {
    return [
      {
        id: 'sess_usr_4771fdba_1',
        endpointName: 'Alex US Residential Grid',
        exitIP: '198.51.83.30',
        country: 'United States',
        countryCode: 'US',
        flag: '🇺🇸',
        city: 'Los Angeles',
        protocol: 'http',
        startedAt: '4m ago',
        durationSeconds: 240,
        bytesInMB: 14.8,
        bytesOutMB: 3.2,
        requestsCount: 142,
        status: 'active',
      },
    ];
  } else if (email.includes('admin.operator')) {
    return [
      {
        id: 'sess_admin_master_1',
        endpointName: 'Admin Master Gateway Credential',
        exitIP: '198.51.77.230',
        country: 'United States',
        countryCode: 'US',
        flag: '🇺🇸',
        city: 'New York',
        protocol: 'http',
        startedAt: '12m ago',
        durationSeconds: 720,
        bytesInMB: 85.2,
        bytesOutMB: 18.6,
        requestsCount: 950,
        status: 'active',
      },
    ];
  }
  return [];
}

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
    const key = getUserEndpointsKey();
    const saved = localStorage.getItem(key);
    const { email } = getCurrentUserIdentity();
    if (!saved) {
      const initial = getInitialUserEndpoints(email);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return getInitialUserEndpoints(email);
    }
  },

  createEndpoint: (dto: CreateEndpointDTO): ProxyEndpointConfig => {
    const key = getUserEndpointsKey();
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
    localStorage.setItem(key, JSON.stringify(updated));
    return newEp;
  },

  deleteEndpoint: (id: string) => {
    const key = getUserEndpointsKey();
    const list = proxyService.getEndpoints();
    const updated = list.filter((e) => e.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  getLocations: (): ProxyLocationNode[] => {
    return MOCK_LOCATIONS;
  },

  getStickySessions: (): ProxyStickySession[] => {
    const key = getUserSessionsKey();
    const saved = localStorage.getItem(key);
    const { email } = getCurrentUserIdentity();
    if (!saved) {
      const initial = getInitialUserSessions(email);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return getInitialUserSessions(email);
    }
  },

  rotateSessionIP: (sessionId: string): ProxyStickySession => {
    const key = getUserSessionsKey();
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
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find((s) => s.id === sessionId)!;
  },

  terminateSession: (sessionId: string) => {
    const key = getUserSessionsKey();
    const sessions = proxyService.getStickySessions();
    const updated = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  getUsageStats: (): BandwidthUsageStats => {
    return MOCK_USAGE_STATS;
  },

  // Admin Features (Scoped to Admins)
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
