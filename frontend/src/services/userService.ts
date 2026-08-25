import { UserProfile } from '../types';
import { MOCK_USER } from '../data/mock-user';

const USER_STORAGE_KEY = 'nexus_cloud_user_profile';

class UserService {
  private getStoredUser(): UserProfile {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return MOCK_USER;
  }

  private saveUser(user: UserProfile) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return this.getStoredUser();
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const current = this.getStoredUser();
    const updated = { ...current, ...updates };
    this.saveUser(updated);
    return updated;
  }
}

export const userService = new UserService();
