export type TrafficScope = 'per_proxy' | 'daily' | 'total_period';

export interface ProxyPlanConfig {
  id: string;
  slug: string;
  name: string;
  maxProxies: number;
  trafficLimitMB: number;
  trafficLimitBytes: number;
  trafficLimitDisplay: string;
  trafficScope: TrafficScope;
  validityHours: number;
  validityDays: number;
  validityDisplay: string;
  priceUSD: number;
  priceDisplay: string;
  isFree: boolean;
  status: 'Free' | 'Paid';
  features: string[];
}

export const PROXY_PLANS: ProxyPlanConfig[] = [
  {
    id: 'plan_free',
    slug: 'free',
    name: 'Free',
    maxProxies: 50,
    trafficLimitMB: 50,
    trafficLimitBytes: 50 * 1024 * 1024,
    trafficLimitDisplay: '50 MB per proxy',
    trafficScope: 'per_proxy',
    validityHours: 12,
    validityDays: 0.5,
    validityDisplay: '12 hours',
    priceUSD: 0,
    priceDisplay: '$0',
    isFree: true,
    status: 'Free',
    features: [
      'Up to 50 Free Proxies',
      '50 MB Traffic limit per proxy',
      '12-hour validity period per proxy',
      'HTTP, HTTPS, SOCKS5 protocols',
      'Global location routing',
    ],
  },
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Starter',
    maxProxies: 1,
    trafficLimitMB: 500,
    trafficLimitBytes: 500 * 1024 * 1024,
    trafficLimitDisplay: '500 MB/day',
    trafficScope: 'daily',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 1.99,
    priceDisplay: '$1.99',
    isFree: false,
    status: 'Paid',
    features: [
      '1 Dedicated Proxy Slot',
      '500 MB / Day Bandwidth Reset',
      '28 Days Validity',
      'Sticky & Rotating Sessions',
      'Zero Captcha IP Pool',
    ],
  },
  {
    id: 'plan_basic',
    slug: 'basic',
    name: 'Basic',
    maxProxies: 2,
    trafficLimitMB: 5 * 1024,
    trafficLimitBytes: 5 * 1024 * 1024 * 1024,
    trafficLimitDisplay: '5 GB',
    trafficScope: 'total_period',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 4.99,
    priceDisplay: '$4.99',
    isFree: false,
    status: 'Paid',
    features: [
      '2 Active Proxy Slots',
      '5 GB Included Traffic',
      '28 Days Validity',
      'City & State Geo-Targeting',
      'IP Whitelisting & API Access',
    ],
  },
  {
    id: 'plan_pro',
    slug: 'pro',
    name: 'Pro',
    maxProxies: 5,
    trafficLimitMB: 15 * 1024,
    trafficLimitBytes: 15 * 1024 * 1024 * 1024,
    trafficLimitDisplay: '15 GB',
    trafficScope: 'total_period',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 9.99,
    priceDisplay: '$9.99',
    isFree: false,
    status: 'Paid',
    features: [
      '5 Active Proxy Slots',
      '15 GB Included Traffic',
      '28 Days Validity',
      'High-Speed Residential Network',
      'Concurrent Connections up to 1,000',
    ],
  },
  {
    id: 'plan_pro_plus',
    slug: 'pro-plus',
    name: 'Pro Plus',
    maxProxies: 5,
    trafficLimitMB: 30 * 1024,
    trafficLimitBytes: 30 * 1024 * 1024 * 1024,
    trafficLimitDisplay: '30 GB',
    trafficScope: 'total_period',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 14.99,
    priceDisplay: '$14.99',
    isFree: false,
    status: 'Paid',
    features: [
      '5 Active Proxy Slots',
      '30 GB Included Traffic',
      '28 Days Validity',
      'Residential & Mobile 5G Tiers',
      'Priority Transit & Low Latency',
    ],
  },
  {
    id: 'plan_business',
    slug: 'business',
    name: 'Business',
    maxProxies: 10,
    trafficLimitMB: 30 * 1024,
    trafficLimitBytes: 30 * 1024 * 1024 * 1024,
    trafficLimitDisplay: '30 GB',
    trafficScope: 'total_period',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 19.99,
    priceDisplay: '$19.99',
    isFree: false,
    status: 'Paid',
    features: [
      '10 Active Proxy Slots',
      '30 GB Included Traffic',
      '28 Days Validity',
      'Enterprise Concurrency (5,000 threads)',
      'Sub-user Management & Audit Logs',
    ],
  },
  {
    id: 'plan_business_plus',
    slug: 'business-plus',
    name: 'Business Plus',
    maxProxies: 10,
    trafficLimitMB: 50 * 1024,
    trafficLimitBytes: 50 * 1024 * 1024 * 1024,
    trafficLimitDisplay: '50 GB',
    trafficScope: 'total_period',
    validityHours: 28 * 24,
    validityDays: 28,
    validityDisplay: '28 days',
    priceUSD: 29.99,
    priceDisplay: '$29.99',
    isFree: false,
    status: 'Paid',
    features: [
      '10 Active Proxy Slots',
      '50 GB Included Traffic',
      '28 Days Validity',
      'Dedicated Residential Subnets',
      '24/7 Dedicated Support & SRE',
    ],
  },
];

export const DEFAULT_PLAN = PROXY_PLANS[0]; // Free plan is default

export function getPlanConfig(idOrSlug?: string): ProxyPlanConfig {
  if (!idOrSlug) return DEFAULT_PLAN;
  const normalized = idOrSlug.toLowerCase().trim();
  const found = PROXY_PLANS.find(
    (p) => p.id.toLowerCase() === normalized || p.slug.toLowerCase() === normalized || p.name.toLowerCase() === normalized
  );
  return found || DEFAULT_PLAN;
}

export function formatTrafficMB(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(mb * 10) / 10} MB`;
}

export function formatTrafficBytes(bytes: number): string {
  return formatTrafficMB(bytes / (1024 * 1024));
}
