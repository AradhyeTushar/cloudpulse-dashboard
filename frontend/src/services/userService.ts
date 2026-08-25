import { UserProfile } from '../types';

export class UserService {
  private getStoredUser(): UserProfile {
    try {
      const raw = localStorage.getItem('cloudpulse_auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        return {
          id: u.id || 'usr_default',
          name: u.name || 'CloudPulse User',
          email: u.email || 'user@example.com',
          role: u.role || 'user',
          workspaceName: u.workspaceName || `${u.name || 'My'}'s Workspace`,
          avatarUrl: '',
          timezone: 'UTC (GMT+0)',
          theme: 'dark',
          twoFactorEnabled: false,
          activeSessions: [
            {
              id: 'sess_1',
              device: 'MacBook Pro (Chrome)',
              browser: 'Chrome 128.0',
              location: 'San Francisco, US',
              ipAddress: '198.51.100.4',
              lastActive: 'Active Now',
              current: true,
            },
          ],
          notificationPreferences: {
            emailAlerts: true,
            serverDowntime: true,
            highResourceUsage: true,
            deploymentStatus: false,
            marketingNewsletter: false,
          },
        };
      }
    } catch {
      // Fallback
    }

    return {
      id: 'usr_guest',
      name: 'Guest User',
      email: 'guest@cloudpulse.io',
      role: 'user',
      workspaceName: 'Guest Workspace',
      avatarUrl: '',
      timezone: 'UTC (GMT+0)',
      theme: 'dark',
      twoFactorEnabled: false,
      activeSessions: [],
      notificationPreferences: {
        emailAlerts: true,
        serverDowntime: true,
        highResourceUsage: false,
        deploymentStatus: false,
        marketingNewsletter: false,
      },
    };
  }

  private saveUser(user: UserProfile) {
    try {
      const raw = localStorage.getItem('cloudpulse_auth_user');
      let current = {};
      if (raw) {
        current = JSON.parse(raw);
      }
      const merged = { ...current, ...user };
      localStorage.setItem('cloudpulse_auth_user', JSON.stringify(merged));
      localStorage.setItem(`cloudpulse_profile_${user.id}`, JSON.stringify(merged));
    } catch {
      // Ignore
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('cloudpulse_auth_token');
    if (token) {
      try {
        const res = await fetch('/api/v1/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const apiUser: UserProfile = {
              id: json.data.id,
              name: json.data.name,
              email: json.data.email,
              role: json.data.role,
              workspaceName: json.data.workspace_name,
              avatarUrl: '',
              timezone: 'UTC (GMT+0)',
              theme: 'dark',
              twoFactorEnabled: false,
              activeSessions: [
                {
                  id: 'sess_live',
                  device: 'Desktop Workstation',
                  browser: 'Web Browser',
                  location: 'Control Plane',
                  ipAddress: '127.0.0.1',
                  lastActive: 'Just now',
                  current: true,
                },
              ],
              notificationPreferences: {
                emailAlerts: true,
                serverDowntime: true,
                highResourceUsage: true,
                deploymentStatus: true,
                marketingNewsletter: false,
              },
            };
            this.saveUser(apiUser);
            return apiUser;
          }
        }
      } catch {
        // Fallback to storage
      }
    }
    return this.getStoredUser();
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getStoredUser();
    const updated = { ...current, ...updates };
    this.saveUser(updated);

    const token = localStorage.getItem('cloudpulse_auth_token');
    if (token) {
      try {
        await fetch('/api/v1/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: updated.name,
            workspace_name: updated.workspaceName,
          }),
        });
      } catch {
        // Offline
      }
    }

    return updated;
  }
}

export const userService = new UserService();
