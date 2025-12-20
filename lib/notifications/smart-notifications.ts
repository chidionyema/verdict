/**
 * Smart Notification Manager
 * Reduces notification fatigue by intelligently managing when and how users are notified
 */

import { createClient } from '@/lib/supabase/client';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string;   // HH:MM format
  timezone: string;
  last_notification_at: string | null;
  notification_count_today: number;
  daily_limit: number;
  categories: {
    new_responses: boolean;
    credits_earned: boolean;
    request_updates: boolean;
    system_alerts: boolean;
    promotional: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationContext {
  type: 'new_response' | 'credits_earned' | 'request_complete' | 'system_alert' | 'promotional';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

class SmartNotificationManager {
  private supabase = createClient();

  /**
   * Get user's notification preferences, creating defaults if none exist
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create default preferences
        return await this.createDefaultPreferences(userId);
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Create default notification preferences for a new user
   */
  async createDefaultPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const defaultPreferences = {
        user_id: userId,
        email_enabled: true,
        push_enabled: false,
        digest_frequency: 'daily' as const,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        last_notification_at: null,
        notification_count_today: 0,
        daily_limit: 5, // Conservative default
        categories: {
          new_responses: true,
          credits_earned: true,
          request_updates: true,
          system_alerts: true,
          promotional: false // Opt-in for promotional
        }
      };

      const { data, error } = await (this.supabase
        .from('notification_preferences')
        .insert as any)(defaultPreferences)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  /**
   * Determine if a notification should be sent based on smart rules
   */
  async shouldSendNotification(context: NotificationContext): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(context.userId);
      if (!preferences) return false;

      // Check if notification category is enabled
      const categoryMap: Record<string, keyof NotificationPreferences['categories']> = {
        'new_response': 'new_responses',
        'credits_earned': 'credits_earned',
        'request_complete': 'request_updates',
        'system_alert': 'system_alerts',
        'promotional': 'promotional'
      };

      const categoryKey = categoryMap[context.type];
      if (categoryKey && !preferences.categories[categoryKey]) {
        return false; // Category disabled
      }

      // Check daily limit (except for urgent notifications)
      if (context.priority !== 'urgent' && preferences.notification_count_today >= preferences.daily_limit) {
        return false; // Daily limit reached
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Only allow urgent notifications during quiet hours
        return context.priority === 'urgent';
      }

      // Check recent notification throttling
      if (preferences.last_notification_at && context.priority !== 'urgent') {
        const lastNotification = new Date(preferences.last_notification_at);
        const now = new Date();
        const timeSinceLastMs = now.getTime() - lastNotification.getTime();
        
        // Throttle based on priority
        const throttleMinutes = {
          low: 60,     // 1 hour
          medium: 30,  // 30 minutes  
          high: 5      // 5 minutes
        };

        const requiredCooldownMs = throttleMinutes[context.priority] * 60 * 1000;
        if (timeSinceLastMs < requiredCooldownMs) {
          return false; // Still in cooldown period
        }
      }

      // Check if user has been too active recently (prevent spam during active use)
      if (await this.isUserActiveRecently(context.userId)) {
        // Skip non-urgent notifications if user is actively using the app
        return context.priority === 'urgent';
      }

      return true;
    } catch (error) {
      console.error('Error in shouldSendNotification:', error);
      return false;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    try {
      const now = new Date();
      const userTz = preferences.timezone || 'UTC';
      
      // Convert to user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
      const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startMinutes > endMinutes) {
        return currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes;
      } else {
        return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Check if user has been active in the app recently
   */
  private async isUserActiveRecently(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', userId)
        .single();

      if (!(profile as any)?.last_seen_at) return false;

      const lastSeen = new Date((profile as any).last_seen_at);
      const now = new Date();
      const timeSinceLastActiveMs = now.getTime() - lastSeen.getTime();
      
      // Consider user "active" if they were seen in the last 10 minutes
      return timeSinceLastActiveMs < 10 * 60 * 1000;
    } catch (error) {
      console.error('Error checking user activity:', error);
      return false;
    }
  }

  /**
   * Record that a notification was sent to update counters
   */
  async recordNotificationSent(userId: string): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get current preferences
      const preferences = await this.getNotificationPreferences(userId);
      if (!preferences) return;

      // Reset daily count if it's a new day
      const lastNotificationDate = preferences.last_notification_at 
        ? new Date(preferences.last_notification_at)
        : new Date(0);
      
      const isNewDay = lastNotificationDate < today;
      const newCount = isNewDay ? 1 : preferences.notification_count_today + 1;

      // Update preferences
      await (this.supabase
        .from('notification_preferences')
        .update as any)({
          last_notification_at: now.toISOString(),
          notification_count_today: newCount,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { error } = await (this.supabase
        .from('notification_preferences')
        .update as any)({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Get notification summary for user dashboard
   */
  async getNotificationSummary(userId: string): Promise<{
    totalToday: number;
    dailyLimit: number;
    inQuietHours: boolean;
    nextNotificationAllowedAt: Date | null;
  }> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      if (!preferences) {
        return {
          totalToday: 0,
          dailyLimit: 5,
          inQuietHours: false,
          nextNotificationAllowedAt: null
        };
      }

      let nextAllowedAt: Date | null = null;
      if (preferences.last_notification_at) {
        const lastNotification = new Date(preferences.last_notification_at);
        // Assume medium priority cooldown (30 minutes)
        nextAllowedAt = new Date(lastNotification.getTime() + 30 * 60 * 1000);
      }

      return {
        totalToday: preferences.notification_count_today,
        dailyLimit: preferences.daily_limit,
        inQuietHours: this.isInQuietHours(preferences),
        nextNotificationAllowedAt: nextAllowedAt
      };
    } catch (error) {
      console.error('Error getting notification summary:', error);
      return {
        totalToday: 0,
        dailyLimit: 5,
        inQuietHours: false,
        nextNotificationAllowedAt: null
      };
    }
  }
}

export const smartNotificationManager = new SmartNotificationManager();

// Helper function for easy integration
export async function shouldNotify(context: NotificationContext): Promise<boolean> {
  return await smartNotificationManager.shouldSendNotification(context);
}