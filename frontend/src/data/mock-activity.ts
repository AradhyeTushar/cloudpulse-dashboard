import { ActivityItem } from '../types';

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'VPS srv1920898 health check passed',
    description: 'All system metrics nominal, 100% uptime maintained over the last 24 hours.',
    targetId: 'srv1920898',
    targetType: 'vps',
    status: 'success',
    timestamp: '2026-08-25T04:15:00Z',
    relativeTime: '28 minutes ago'
  },
  {
    id: 'act-2',
    title: 'Snapshot created for srv1920898',
    description: 'Manual snapshot stable-release-v1.4 completed successfully (5.12 GB).',
    targetId: 'srv1920898',
    targetType: 'vps',
    status: 'info',
    timestamp: '2026-08-24T09:30:00Z',
    relativeTime: '19 hours ago'
  },
  {
    id: 'act-3',
    title: 'Firewall rules updated',
    description: 'Added port rule TCP:5432 for internal subnet CIDR 10.0.0.0/16.',
    targetId: 'srv1920898',
    targetType: 'security',
    status: 'info',
    timestamp: '2026-08-23T18:45:00Z',
    relativeTime: '1 day ago'
  },
  {
    id: 'act-4',
    title: 'VPS srv1920898 provisioned',
    description: 'Instance deployed on KVM 2 node in US East (New York datacenter).',
    targetId: 'srv1920898',
    targetType: 'vps',
    status: 'success',
    timestamp: '2026-08-21T11:20:00Z',
    relativeTime: '3 days ago'
  }
];
