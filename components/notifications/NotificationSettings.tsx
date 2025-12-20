'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Volume2, VolumeX, Settings } from 'lucide-react';
import { smartNotificationManager, type NotificationPreferences } from '@/lib/notifications/smart-notifications';
import { createClient } from '@/lib/supabase/client';

interface NotificationSettingsProps {
  userId: string;
  compact?: boolean;
  onClose?: () => void;
}

export function NotificationSettings({ userId, compact = false, onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadPreferences();
    loadSummary();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const prefs = await smartNotificationManager.getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await smartNotificationManager.getNotificationSummary(userId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load notification summary:', error);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const success = await smartNotificationManager.updatePreferences(userId, updates);
      if (success) {
        setPreferences({ ...preferences, ...updates });
        await loadSummary(); // Refresh summary
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: keyof NotificationPreferences['categories']) => {
    if (!preferences) return;
    
    updatePreferences({
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category]
      }
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-6">
        <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Failed to load notification settings</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-sm">Notifications</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          )}
        </div>
        
        {summary && (
          <div className="text-xs text-gray-600 mb-3 space-y-1">
            <div>Today: {summary.totalToday}/{summary.dailyLimit}</div>
            {summary.inQuietHours && (
              <div className="flex items-center gap-1 text-orange-600">
                <VolumeX className="h-3 w-3" />
                <span>Quiet hours active</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm">Email notifications</span>
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => updatePreferences({ email_enabled: e.target.checked })}
              className="rounded border-gray-300"
              disabled={saving}
            />
          </label>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Frequency</label>
            <select
              value={preferences.digest_frequency}
              onChange={(e) => updatePreferences({ digest_frequency: e.target.value as any })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              disabled={saving}
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Bell className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notification Settings</h3>
            <p className="text-sm text-gray-600">Control how and when you're notified</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Today's Activity</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Notifications sent:</span>
              <span className="ml-2 font-medium">{summary.totalToday}/{summary.dailyLimit}</span>
            </div>
            <div className="flex items-center gap-2">
              {summary.inQuietHours ? (
                <>
                  <VolumeX className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600">Quiet hours active</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Notifications enabled</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Settings */}
      <div className="space-y-6">
        {/* General toggles */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">General</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Email notifications</span>
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => updatePreferences({ email_enabled: e.target.checked })}
                className="rounded border-gray-300"
                disabled={saving}
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>Push notifications</span>
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) => updatePreferences({ push_enabled: e.target.checked })}
                className="rounded border-gray-300"
                disabled={saving}
              />
            </label>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Frequency</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Digest frequency</label>
              <select
                value={preferences.digest_frequency}
                onChange={(e) => updatePreferences({ digest_frequency: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={saving}
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Daily limit</label>
              <select
                value={preferences.daily_limit}
                onChange={(e) => updatePreferences({ daily_limit: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={saving}
              >
                <option value={3}>3 per day</option>
                <option value={5}>5 per day</option>
                <option value={10}>10 per day</option>
                <option value={20}>20 per day</option>
                <option value={999}>Unlimited</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Quiet Hours
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start</label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End</label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={saving}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Only urgent notifications will be sent during quiet hours
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
          <div className="space-y-3">
            {Object.entries(preferences.categories).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="capitalize">{key.replace('_', ' ')}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleCategory(key as any)}
                  className="rounded border-gray-300"
                  disabled={saving}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {saving && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            Saving preferences...
          </div>
        </div>
      )}
    </div>
  );
}