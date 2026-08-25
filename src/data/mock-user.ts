import { UserProfile } from '../types';

export const MOCK_USER: UserProfile = {
  id: 'usr_98a72c1e',
  name: 'Alex Mercer',
  email: 'alex.mercer@cloudinfra.io',
  avatarUrl: '',
  role: 'Owner & Lead Engineer',
  workspaceName: 'Production Workspace',
  timezone: 'America/New_York (UTC-4)',
  theme: 'light',
  twoFactorEnabled: true,
  activeSessions: [
    {
      id: 'sess-1',
      device: 'MacBook Pro 16"',
      browser: 'Chrome 128.0 (macOS)',
      location: 'New York, US',
      ipAddress: '72.229.28.185',
      lastActive: 'Active now',
      current: true
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile 17.5 (iOS)',
      location: 'New York, US',
      ipAddress: '174.204.1.29',
      lastActive: '2 hours ago',
      current: false
    }
  ],
  notificationPreferences: {
    emailAlerts: true,
    serverDowntime: true,
    highResourceUsage: true,
    deploymentStatus: true,
    marketingNewsletter: false
  }
};
