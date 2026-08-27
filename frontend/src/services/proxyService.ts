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
  ProxyStatus,
  ProxyProtocol,
  UserProxySubscription,
  ProxyUsageDashboardSummary,
} from '../types';
import {
  PROXY_PLANS,
  ProxyPlanConfig,
  getPlanConfig,
  formatTrafficMB,
  formatTrafficBytes,
  DEFAULT_PLAN,
} from '../config/proxyPlans';
import {
  MOCK_LOCATIONS,
  MOCK_USAGE_STATS,
  MOCK_ADMIN_USERS,
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

function getUserKey(prefix: string): string {
  const { id, email } = getCurrentUserIdentity();
  const safeKey = (email || id || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `cloudpulse_${prefix}_${safeKey}`;
}

// Automatically sanitize any legacy synthesized mock endpoints (e.g. 8.4 MB Primary Gateway)
function sanitizeLegacyLocalStorage(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('cloudpulse_proxy_endpoints')) {
        if (storageKey.includes('alex_mercer') || storageKey.includes('admin_operator')) {
          continue;
        }
        const val = localStorage.getItem(storageKey);
        if (val && (val.includes('Primary Gateway') || val.includes('8.4') || val.includes('8808038'))) {
          try {
            const list = JSON.parse(val);
            if (Array.isArray(list)) {
              const cleaned = list.filter(
                (ep: any) =>
                  !ep.name?.includes('Primary Gateway') &&
                  Math.abs((ep.usedBytes || 0) - 8.4 * 1024 * 1024) > 10000
              );
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            }
          } catch {}
        }
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  sanitizeLegacyLocalStorage();
}

const ADMIN_USERS_KEY = 'cloudpulse_admin_users';

function getInitialUserSubscription(email: string): UserProxySubscription {
  const now = new Date();
  const expires28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  if (email.includes('alex.mercer')) {
    return {
      id: 'sub_alex_pro_plus',
      planId: 'plan_pro_plus',
      planSlug: 'pro-plus',
      status: 'active',
      startedAt: '2026-08-01T00:00:00Z',
      expiresAt: expires28Days.toISOString(),
      autoRenew: true,
      paymentMethod: 'Credit Card (**** 4242)',
    };
  } else if (email.includes('admin.operator')) {
    return {
      id: 'sub_admin_business_plus',
      planId: 'plan_business_plus',
      planSlug: 'business-plus',
      status: 'active',
      startedAt: '2026-08-01T00:00:00Z',
      expiresAt: expires28Days.toISOString(),
      autoRenew: true,
      paymentMethod: 'Hostinger Balance',
    };
  } else if (email.includes('validator')) {
    return {
      id: 'sub_val_starter',
      planId: 'plan_starter',
      planSlug: 'starter',
      status: 'active',
      startedAt: '2026-08-15T00:00:00Z',
      expiresAt: expires28Days.toISOString(),
      autoRenew: false,
      paymentMethod: 'PayPal',
    };
  }

  // Default new user starts on Free Plan (validity is per proxy up to 12h, 50 proxies allowance)
  return {
    id: 'sub_free_' + Math.random().toString(36).substring(2, 9),
    planId: 'plan_free',
    planSlug: 'free',
    status: 'active',
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: false,
    paymentMethod: 'None (Free Plan)',
  };
}

function getInitialUserEndpoints(email: string, plan: ProxyPlanConfig): ProxyEndpointConfig[] {
  const now = new Date();

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
        createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 24 * 3600 * 1000).toISOString(),
        status: 'Active',
        usedBytes: 4.8 * 1024 * 1024 * 1024,
        limitBytes: 30 * 1024 * 1024 * 1024,
        isFree: false,
        planId: 'plan_pro_plus',
      },
      {
        id: 'ep_mercer_2',
        name: 'Alex EU Scraping Pipeline',
        proxyType: 'residential',
        protocol: 'socks5',
        host: 'pr.cloudpulse.net',
        port: 8000,
        username: 'cp_1638ac43_eu',
        password: 'p_sec_0068cfdb54424bbf',
        rotationMode: 'rotating',
        sessionDurationMin: 0,
        country: 'Germany',
        countryCode: 'DE',
        ipWhitelist: [],
        createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 26 * 24 * 3600 * 1000).toISOString(),
        status: 'Active',
        usedBytes: 3.2 * 1024 * 1024 * 1024,
        limitBytes: 30 * 1024 * 1024 * 1024,
        isFree: false,
        planId: 'plan_pro_plus',
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
        createdAt: new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 22 * 24 * 3600 * 1000).toISOString(),
        status: 'Active',
        usedBytes: 12.4 * 1024 * 1024 * 1024,
        limitBytes: 50 * 1024 * 1024 * 1024,
        isFree: false,
        planId: 'plan_business_plus',
      },
    ];
  }

  // New user starts with ZERO (0) active proxies until they create or purchase one
  return [];
}

function evaluateEndpointStatus(
  ep: ProxyEndpointConfig,
  subscription: UserProxySubscription,
  plan: ProxyPlanConfig,
  now: Date
): { status: ProxyStatus; reason?: string } {
  // 1. If manual disable
  if (ep.status === 'Disabled' && ep.disabledReason === 'Manually disabled by user') {
    return { status: 'Disabled', reason: 'Manually disabled by user' };
  }

  // 2. Paid Plan: Check if entire user subscription has expired (28 days)
  if (!plan.isFree) {
    const subExpiry = new Date(subscription.expiresAt);
    if (now > subExpiry || subscription.status === 'expired') {
      return {
        status: 'Plan Expired',
        reason: `Subscription plan expired on ${subExpiry.toLocaleDateString()}. Renew plan to reactivate.`,
      };
    }
  }

  // 3. Free Plan: Check 12-hour per-proxy validity
  if (ep.isFree || plan.isFree) {
    const createdAt = new Date(ep.createdAt);
    const freeExpiry = ep.expiresAt ? new Date(ep.expiresAt) : new Date(createdAt.getTime() + 12 * 3600 * 1000);
    if (now > freeExpiry) {
      return {
        status: 'Expired',
        reason: '12-hour free proxy validity period has expired.',
      };
    }

    // Check Free Plan 50 MB limit
    const usedBytes = ep.usedBytes || 0;
    const limitBytes = 50 * 1024 * 1024;
    if (usedBytes >= limitBytes) {
      return {
        status: 'Traffic Limit Reached',
        reason: `50 MB traffic limit reached (${formatTrafficBytes(usedBytes)} used). Upgrade to a paid plan for more capacity.`,
      };
    }
  }

  // 4. Paid Plan: Check bandwidth limit
  if (!plan.isFree) {
    if (plan.trafficScope === 'daily') {
      // Starter: 500 MB/day
      const usedBytes = ep.usedBytes || 0;
      if (usedBytes >= plan.trafficLimitBytes) {
        return {
          status: 'Traffic Limit Reached',
          reason: `Daily quota of ${plan.trafficLimitDisplay} reached. Quota resets at 00:00 UTC.`,
        };
      }
    }
  }

  return { status: 'Active' };
}

export type CreateEndpointDTO = Partial<Omit<ProxyEndpointConfig, 'id' | 'createdAt'>> & {
  name: string;
  proxyType: ProxyEndpointConfig['proxyType'];
  protocol: ProxyProtocol;
  rotationMode: ProxyEndpointConfig['rotationMode'];
  country: string;
  countryCode: string;
};

export const syncCredentialToBackend = async (ep: ProxyEndpointConfig) => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cloudpulse_auth_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetch('/api/v1/proxy-credentials/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: ep.name,
        proxy_type: ep.proxyType,
        protocol: ep.protocol,
        rotation_mode: ep.rotationMode,
        session_duration_min: ep.sessionDurationMin || 10,
        target_country: ep.country || 'India',
        target_country_code: ep.countryCode || 'IN',
        username: ep.username,
        password: ep.password,
        host: ep.host,
        ip_whitelist: ep.ipWhitelist || [],
      }),
    });
  } catch {
    // Non-blocking sync
  }
};

export const proxyService = {
  // ---------------------------------------------------------------------------
  // Central Plan & Subscription Management
  // ---------------------------------------------------------------------------
  getPlans: (): ProxyPlanConfig[] => {
    return PROXY_PLANS;
  },

  getPlanById: (planId: string): ProxyPlanConfig => {
    return getPlanConfig(planId);
  },

  getUserSubscription: (): UserProxySubscription => {
    const key = getUserKey('proxy_subscription');
    const saved = localStorage.getItem(key);
    const { email } = getCurrentUserIdentity();
    if (!saved) {
      const initial = getInitialUserSubscription(email);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(saved);
    } catch {
      const initial = getInitialUserSubscription(email);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
  },

  upgradePlan: (planId: string): UserProxySubscription => {
    const key = getUserKey('proxy_subscription');
    const targetPlan = getPlanConfig(planId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 28 days validity for paid

    const updatedSub: UserProxySubscription = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      planId: targetPlan.id,
      planSlug: targetPlan.slug,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: targetPlan.isFree
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : expiresAt.toISOString(),
      autoRenew: !targetPlan.isFree,
      paymentMethod: targetPlan.isFree ? 'None (Free Plan)' : 'Razorpay / Credit Card',
    };

    localStorage.setItem(key, JSON.stringify(updatedSub));

    // Update existing endpoints to reflect upgraded plan limits & unblock active slots
    const endpoints = proxyService.getEndpoints();
    const refreshed = endpoints.map((ep, idx) => {
      const isWithinLimit = idx < targetPlan.maxProxies;
      return {
        ...ep,
        isFree: targetPlan.isFree,
        planId: targetPlan.id,
        limitBytes: targetPlan.isFree ? 50 * 1024 * 1024 : targetPlan.trafficLimitBytes,
        status: isWithinLimit && (ep.status === 'Plan Expired' || ep.status === 'Traffic Limit Reached')
          ? ('Active' as ProxyStatus)
          : ep.status,
      };
    });
    localStorage.setItem(getUserKey('proxy_endpoints'), JSON.stringify(refreshed));

    // Dispatch global events for instant UI synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloudpulse_plan_updated', { detail: { subscription: updatedSub, plan: targetPlan } }));
      window.dispatchEvent(new CustomEvent('proxy_plan_updated', { detail: { subscription: updatedSub, plan: targetPlan } }));
    }

    return updatedSub;
  },

  renewPlan: (): UserProxySubscription => {
    const currentSub = proxyService.getUserSubscription();
    const plan = getPlanConfig(currentSub.planId);
    const now = new Date();

    const currentExpiry = new Date(currentSub.expiresAt);
    const baseDate = currentExpiry > now ? currentExpiry : now;
    // Add 28 days to expiration
    const newExpiry = new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000);

    const renewedSub: UserProxySubscription = {
      ...currentSub,
      status: 'active',
      expiresAt: newExpiry.toISOString(),
    };

    localStorage.setItem(getUserKey('proxy_subscription'), JSON.stringify(renewedSub));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloudpulse_plan_updated', { detail: { subscription: renewedSub, plan } }));
      window.dispatchEvent(new CustomEvent('proxy_plan_updated', { detail: { subscription: renewedSub, plan } }));
    }

    return renewedSub;
  },

  // ---------------------------------------------------------------------------
  // Endpoints Management & Lifecycle
  // ---------------------------------------------------------------------------
  getEndpoints: (): ProxyEndpointConfig[] => {
    const key = getUserKey('proxy_endpoints');
    const sub = proxyService.getUserSubscription();
    const plan = getPlanConfig(sub.planId);
    const { email } = getCurrentUserIdentity();

    let rawList: ProxyEndpointConfig[] = [];
    const saved = localStorage.getItem(key);
    if (!saved) {
      rawList = getInitialUserEndpoints(email, plan);
      localStorage.setItem(key, JSON.stringify(rawList));
    } else {
      try {
        rawList = JSON.parse(saved);
        if (!Array.isArray(rawList)) rawList = [];
      } catch {
        rawList = getInitialUserEndpoints(email, plan);
      }
    }

    // Explicitly purge legacy synthesized mock endpoints (e.g. 8.4 MB Primary Gateway)
    // for all standard users who haven't created real endpoints
    const isDemo = email.includes('alex.mercer') || email.includes('admin.operator');
    if (!isDemo && rawList.length > 0) {
      const sanitized = rawList.filter((ep) => {
        const isLegacyMock =
          ep.name.includes('Primary Gateway') ||
          Math.abs((ep.usedBytes || 0) - 8.4 * 1024 * 1024) < 10000 ||
          (ep.isFree && (ep.usedBytes || 0) > 0 && ep.name.toLowerCase().includes('gateway'));
        return !isLegacyMock;
      });

      if (sanitized.length !== rawList.length) {
        rawList = sanitized;
        localStorage.setItem(key, JSON.stringify(rawList));
      }
    }

    // Run dynamic status evaluation on all endpoints
    const now = new Date();
    const defaultServerHost =
      typeof window !== 'undefined' &&
      window.location.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '200.234.41.58';

    const evaluated = rawList.map((ep) => {
      const { status, reason } = evaluateEndpointStatus(ep, sub, plan, now);
      const fixedHost = ep.host && !ep.host.includes('cloudpulse.net') ? ep.host : defaultServerHost;
      const updatedEp = {
        ...ep,
        host: fixedHost,
        status: ep.status === 'Disabled' && ep.disabledReason === 'Manually disabled by user' ? 'Disabled' : status,
        disabledReason: reason || ep.disabledReason,
      };
      if (updatedEp.status === 'Active') {
        syncCredentialToBackend(updatedEp);
      }
      return updatedEp;
    });

    return evaluated;
  },

  getFreeProxiesLifetimeCreated: (): number => {
    const key = getUserKey('free_proxies_lifetime_created');
    const saved = localStorage.getItem(key);
    let count = saved ? parseInt(saved, 10) || 0 : 0;

    // Reset count if it was incremented by legacy mock and user has 0 endpoints
    const { email } = getCurrentUserIdentity();
    const isDemo = email.includes('alex.mercer') || email.includes('admin.operator');
    if (!isDemo) {
      const endpointsKey = getUserKey('proxy_endpoints');
      const endpointsSaved = localStorage.getItem(endpointsKey);
      if (!endpointsSaved || endpointsSaved === '[]') {
        count = 0;
        localStorage.setItem(key, '0');
      }
    }

    return count;
  },

  incrementFreeProxiesLifetimeCount: () => {
    const key = getUserKey('free_proxies_lifetime_created');
    const current = proxyService.getFreeProxiesLifetimeCreated();
    localStorage.setItem(key, (current + 1).toString());
  },

  createEndpoint: (dto: CreateEndpointDTO): ProxyEndpointConfig => {
    const sub = proxyService.getUserSubscription();
    const plan = getPlanConfig(sub.planId);
    const existingList = proxyService.getEndpoints();
    const activeEndpoints = existingList.filter((e) => e.status === 'Active' || e.status === 'Disabled');

    // 1. Free Plan Enforcement (Max 50 free proxies)
    if (plan.isFree) {
      const lifetimeCreated = proxyService.getFreeProxiesLifetimeCreated();
      if (activeEndpoints.length >= plan.maxProxies || lifetimeCreated >= 50) {
        throw new Error(
          `Free plan allowance limit reached (maximum ${plan.maxProxies} free proxies). Please purchase a paid plan to obtain additional proxy capacity.`
        );
      }
    } else {
      // 2. Paid Plan Enforcement (Slot limits: 1, 2, 5, 10)
      if (activeEndpoints.length >= plan.maxProxies) {
        throw new Error(
          `Proxy slot limit reached (${plan.maxProxies} / ${plan.maxProxies} proxies used on ${plan.name} plan). Upgrade your plan to add more proxies.`
        );
      }
    }

    const key = getUserKey('proxy_endpoints');
    const now = new Date();
    const isFree = plan.isFree;
    const validityHours = isFree ? 12 : 28 * 24;
    const expiresAt = new Date(now.getTime() + validityHours * 3600 * 1000);
    const limitBytes = isFree ? 50 * 1024 * 1024 : plan.trafficLimitBytes;

    const host = dto.host || (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : '200.234.41.58');
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
      country: dto.country || 'India',
      countryCode: dto.countryCode || 'IN',
      state: dto.state,
      city: dto.city,
      ipWhitelist: dto.ipWhitelist || [],
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'Active',
      usedBytes: 0,
      limitBytes: limitBytes,
      isFree: isFree,
      planId: plan.id,
    };

    if (isFree) {
      proxyService.incrementFreeProxiesLifetimeCount();
    }

    const updated = [newEp, ...existingList];
    localStorage.setItem(key, JSON.stringify(updated));

    // Register with Control Plane backend immediately
    syncCredentialToBackend(newEp);

    return newEp;
  },

  deleteEndpoint: (id: string) => {
    const key = getUserKey('proxy_endpoints');
    const list = proxyService.getEndpoints();
    const updated = list.filter((e) => e.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  toggleEndpointStatus: (id: string): ProxyEndpointConfig => {
    const key = getUserKey('proxy_endpoints');
    const list = proxyService.getEndpoints();
    const updated = list.map((ep) => {
      if (ep.id === id) {
        const nextStatus: ProxyStatus = ep.status === 'Active' ? 'Disabled' : 'Active';
        return {
          ...ep,
          status: nextStatus,
          disabledReason: nextStatus === 'Disabled' ? 'Manually disabled by user' : undefined,
        };
      }
      return ep;
    });
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find((e) => e.id === id)!;
  },

  updateEndpointIPWhitelist: (id: string, ipWhitelist: string[]): ProxyEndpointConfig => {
    const key = getUserKey('proxy_endpoints');
    const list = proxyService.getEndpoints();
    let updatedEp: ProxyEndpointConfig | undefined;
    const cleanList = ipWhitelist.map((s) => s.trim()).filter(Boolean);
    const updated = list.map((ep) => {
      if (ep.id === id) {
        updatedEp = {
          ...ep,
          ipWhitelist: cleanList,
        };
        return updatedEp;
      }
      return ep;
    });
    localStorage.setItem(key, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proxy_endpoints_updated', { detail: { id, ipWhitelist: cleanList } }));
    }
    return updatedEp || list[0];
  },

  bulkUpdateIPWhitelist: (ids: string[], ipWhitelist: string[]): void => {
    const key = getUserKey('proxy_endpoints');
    const list = proxyService.getEndpoints();
    const cleanList = ipWhitelist.map((s) => s.trim()).filter(Boolean);
    const updated = list.map((ep) => {
      if (ids.length === 0 || ids.includes(ep.id)) {
        return {
          ...ep,
          ipWhitelist: cleanList,
        };
      }
      return ep;
    });
    localStorage.setItem(key, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proxy_endpoints_updated', { detail: { ids, ipWhitelist: cleanList } }));
    }
  },

  testClientIPAgainstWhitelist: (clientIP: string, ipWhitelist: string[]): { allowed: boolean; matchedRule?: string; reason: string } => {
    if (!ipWhitelist || ipWhitelist.length === 0) {
      return { allowed: true, reason: 'No IP restriction configured (All client IPs authorized)' };
    }
    const cleanClient = clientIP.trim();
    if (!cleanClient) {
      return { allowed: false, reason: 'Please enter a valid Client IP to test' };
    }

    const isIPInCIDR = (ip: string, cidr: string): boolean => {
      const cleanCIDR = cidr.trim();
      const cleanIP = ip.trim();
      if (cleanCIDR === cleanIP) return true;
      if (!cleanCIDR.includes('/')) return false;

      try {
        const [range, bitsStr] = cleanCIDR.split('/');
        const mask = ~(2 ** (32 - parseInt(bitsStr, 10)) - 1);
        const ip2long = (addr: string) => {
          const parts = addr.split('.').map(Number);
          return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
        };
        return (ip2long(cleanIP) & mask) === (ip2long(range) & mask);
      } catch {
        return false;
      }
    };

    for (const rule of ipWhitelist) {
      const cleanRule = rule.trim();
      if (!cleanRule) continue;
      if (cleanRule === cleanClient) {
        return { allowed: true, matchedRule: cleanRule, reason: `Authorized by exact IP match: ${cleanRule}` };
      }
      if (cleanRule.includes('/') && isIPInCIDR(cleanClient, cleanRule)) {
        return { allowed: true, matchedRule: cleanRule, reason: `Authorized by subnet CIDR block: ${cleanRule}` };
      }
    }
    return {
      allowed: false,
      reason: `Blocked: Client IP ${cleanClient} is not in authorized whitelist (${ipWhitelist.join(', ')})`,
    };
  },

  // ---------------------------------------------------------------------------
  // Usage Dashboard Summary Provider
  // ---------------------------------------------------------------------------
  getDashboardUsageSummary: (): ProxyUsageDashboardSummary => {
    const sub = proxyService.getUserSubscription();
    const plan = getPlanConfig(sub.planId);
    const endpoints = proxyService.getEndpoints();

    const usedSlots = endpoints.length;
    const maxSlots = plan.maxProxies;
    const availableSlots = Math.max(0, maxSlots - usedSlots);

    const activeCount = endpoints.filter((e) => e.status === 'Active').length;
    const disabledCount = endpoints.filter((e) => e.status === 'Disabled').length;
    const expiredCount = endpoints.filter(
      (e) => e.status === 'Expired' || e.status === 'Traffic Limit Reached' || e.status === 'Plan Expired'
    ).length;

    // Traffic telemetry aggregation
    let totalUsedMB = 0;
    endpoints.forEach((e) => {
      totalUsedMB += (e.usedBytes || 0) / (1024 * 1024);
    });

    // If Starter (500 MB/day), traffic is daily limit
    const limitMB = plan.isFree ? usedSlots * 50 || 50 : plan.trafficLimitMB;
    const remainingMB = Math.max(0, limitMB - totalUsedMB);
    const usagePercent = limitMB > 0 ? Math.min(100, Math.round((totalUsedMB / limitMB) * 100)) : 0;

    let resetInfo = '28-day billing cycle';
    if (plan.isFree) {
      resetInfo = '12 hours max per proxy (50 MB limit)';
    } else if (plan.trafficScope === 'daily') {
      resetInfo = 'Resets daily at 00:00 UTC';
    } else {
      const exp = new Date(sub.expiresAt);
      resetInfo = `Plan period ends ${exp.toLocaleDateString()}`;
    }

    const subExpiryDate = new Date(sub.expiresAt);
    const daysRemaining = Math.max(0, Math.ceil((subExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const renewalDisplay = plan.isFree
      ? '12 hours per proxy'
      : `${subExpiryDate.toLocaleDateString()} (${daysRemaining} days left)`;

    return {
      plan: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        priceUSD: plan.priceUSD,
        priceDisplay: plan.priceDisplay,
        isFree: plan.isFree,
        expiresAt: sub.expiresAt,
        renewalDisplay,
        status: sub.status === 'active' ? 'Active' : 'Expired',
        validityDisplay: plan.validityDisplay,
      },
      proxyUsage: {
        used: usedSlots,
        max: maxSlots,
        available: availableSlots,
        activeCount,
        disabledCount,
        expiredCount,
        usagePercent: Math.min(100, Math.round((usedSlots / maxSlots) * 100)),
      },
      trafficUsage: {
        usedMB: totalUsedMB,
        limitMB,
        remainingMB,
        usagePercent,
        usedDisplay: formatTrafficMB(totalUsedMB),
        remainingDisplay: formatTrafficMB(remainingMB),
        limitDisplay: plan.trafficLimitDisplay,
        resetInfo,
        scope: plan.trafficScope,
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Locations & Sessions & Admin (Preserved)
  // ---------------------------------------------------------------------------
  getLocations: (): ProxyLocationNode[] => {
    return MOCK_LOCATIONS;
  },

  getStickySessions: (): ProxyStickySession[] => {
    const key = getUserKey('proxy_sessions');
    const saved = localStorage.getItem(key);
    if (!saved) {
      return [];
    }
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  rotateSessionIP: (sessionId: string): ProxyStickySession => {
    const key = getUserKey('proxy_sessions');
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
    const key = getUserKey('proxy_sessions');
    const sessions = proxyService.getStickySessions();
    const updated = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  getUsageStats: (): BandwidthUsageStats => {
    return MOCK_USAGE_STATS;
  },

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
    return PROXY_PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMonthly: p.priceUSD,
      pricePerGB: p.trafficLimitMB > 0 ? p.priceUSD / (p.trafficLimitMB / 1024) : 0,
      bandwidthGB: p.trafficLimitMB / 1024,
      threadsLimit: p.maxProxies * 100,
      dedicatedPools: !p.isFree,
      features: p.features,
      isActive: true,
    }));
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
