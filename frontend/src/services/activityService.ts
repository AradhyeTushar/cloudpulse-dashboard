import { ActivityItem } from '../types';
import { MOCK_ACTIVITIES } from '../data/mock-activity';

const ACTIVITY_STORAGE_KEY = 'nexus_cloud_activities';

class ActivityService {
  private getStoredActivities(): ActivityItem[] {
    try {
      const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return MOCK_ACTIVITIES;
  }

  private saveActivities(activities: ActivityItem[]) {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch {
      // Ignore
    }
  }

  async getActivities(): Promise<ActivityItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.getStoredActivities();
  }

  async addActivity(title: string, description: string, status: ActivityItem['status'] = 'info', targetType: ActivityItem['targetType'] = 'vps', targetId?: string): Promise<ActivityItem> {
    const activities = this.getStoredActivities();
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      description,
      targetType,
      targetId,
      status,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now'
    };
    const updated = [newAct, ...activities];
    this.saveActivities(updated);
    return newAct;
  }
}

export const activityService = new ActivityService();
