'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
  Clock,
  MessageSquare,
  TrendingUp,
  Gift,
  Users,
  Settings,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { TouchToggle } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
  };
}

interface NotificationPreferencesData {
  globalEnabled: boolean;
  pauseUntil: string | null;
  categories: NotificationCategory[];
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  marketingEnabled: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
  initialData?: Partial<NotificationPreferencesData>;
  onSave?: (data: NotificationPreferencesData) => Promise<void>;
  compact?: boolean;
}

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'verdicts',
    label: 'New Verdicts',
    description: 'When someone completes a verdict on your request',
    icon: MessageSquare,
    enabled: true,
    channels: { email: true, push: true },
  },
  {
    id: 'requests',
    label: 'Request Updates',
    description: 'Status changes for your requests',
    icon: TrendingUp,
    enabled: true,
    channels: { email: true, push: true },
  },
  {
    id: 'credits',
    label: 'Credits & Earnings',
    description: 'When you earn or spend credits',
    icon: Gift,
    enabled: true,
    channels: { email: false, push: true },
  },
  {
    id: 'community',
    label: 'Community Activity',
    description: 'New requests matching your interests',
    icon: Users,
    enabled: false,
    channels: { email: false, push: false },
  },
  {
    id: 'achievements',
    label: 'Achievements & Milestones',
    description: 'When you unlock achievements or reach milestones',
    icon: TrendingUp,
    enabled: true,
    channels: { email: false, push: true },
  },
];

const DEFAULT_DATA: NotificationPreferencesData = {
  globalEnabled: true,
  pauseUntil: null,
  categories: DEFAULT_CATEGORIES,
  digestFrequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  marketingEnabled: false,
};

export function NotificationPreferences({ userId, initialData, onSave, compact = false }: NotificationPreferencesProps) {
  const [data, setData] = useState<NotificationPreferencesData>({
    ...DEFAULT_DATA,
    ...initialData,
    categories: initialData?.categories || DEFAULT_CATEGORIES,
  });
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [data]);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      ),
    }));
  };

  const toggleCategoryChannel = (categoryId: string, channel: 'email' | 'push') => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, channels: { ...cat.channels, [channel]: !cat.channels[channel] } }
          : cat
      ),
    }));
  };

  const pauseNotifications = (hours: number) => {
    const pauseUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setData(prev => ({ ...prev, pauseUntil }));
    setShowPauseModal(false);
  };

  const resumeNotifications = () => {
    setData(prev => ({ ...prev, pauseUntil: null }));
  };

  const isPaused = data.pauseUntil && new Date(data.pauseUntil) > new Date();

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-gray-900">Notifications</span>
          </div>
          <TouchToggle
            checked={data.globalEnabled && !isPaused}
            onChange={(checked) => setData(prev => ({ ...prev, globalEnabled: checked }))}
          />
        </div>

        {isPaused && (
          <div className="flex items-center justify-between bg-amber-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Pause className="h-4 w-4" />
              <span className="text-sm">Paused until {new Date(data.pauseUntil!).toLocaleTimeString()}</span>
            </div>
            <button
              onClick={resumeNotifications}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              Resume
            </button>
          </div>
        )}

        <div className="space-y-2">
          <select
            value={data.digestFrequency}
            onChange={(e) => setData(prev => ({ ...prev, digestFrequency: e.target.value as any }))}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="immediate">Immediate notifications</option>
            <option value="hourly">Hourly digest</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Control how and when you're notified</p>
            </div>
          </div>

          {/* Global toggle */}
          <div className="flex items-center gap-4">
            {isPaused && (
              <Badge className="bg-amber-100 text-amber-800">Paused</Badge>
            )}
            <TouchToggle
              checked={data.globalEnabled && !isPaused}
              onChange={(checked) => setData(prev => ({ ...prev, globalEnabled: checked }))}
              label={data.globalEnabled && !isPaused ? 'On' : 'Off'}
            />
          </div>
        </div>
      </div>

      {/* Pause Banner */}
      {isPaused && (
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pause className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Notifications paused</p>
                <p className="text-sm text-amber-600">
                  Until {new Date(data.pauseUntil!).toLocaleString()}
                </p>
              </div>
            </div>
            <TouchButton
              onClick={resumeNotifications}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </TouchButton>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isPaused && data.globalEnabled && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <TouchButton
              onClick={() => setShowPauseModal(true)}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause notifications
            </TouchButton>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="font-medium text-gray-900 mb-4">Notification Types</h4>
        <div className="space-y-4">
          {data.categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`border rounded-xl p-4 transition ${
                  category.enabled
                    ? 'border-indigo-200 bg-indigo-50/50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      category.enabled ? 'bg-indigo-100' : 'bg-gray-200'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        category.enabled ? 'text-indigo-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{category.label}</h5>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <TouchToggle
                    checked={category.enabled}
                    onChange={() => toggleCategory(category.id)}
                  />
                </div>

                {/* Channel toggles */}
                {category.enabled && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.channels.email}
                        onChange={() => toggleCategoryChannel(category.id, 'email')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.channels.push}
                        onChange={() => toggleCategoryChannel(category.id, 'push')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Push</span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">Advanced Settings</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Digest frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Digest Frequency
                  </label>
                  <select
                    value={data.digestFrequency}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      digestFrequency: e.target.value as any
                    }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="immediate">Send immediately</option>
                    <option value="hourly">Hourly digest</option>
                    <option value="daily">Daily digest (9am)</option>
                    <option value="weekly">Weekly digest (Monday)</option>
                    <option value="never">Never send emails</option>
                  </select>
                </div>

                {/* Quiet hours */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Quiet Hours</span>
                    </div>
                    <TouchToggle
                      checked={data.quietHours.enabled}
                      onChange={(checked) => setData(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled: checked }
                      }))}
                    />
                  </div>
                  {data.quietHours.enabled && (
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start</label>
                        <input
                          type="time"
                          value={data.quietHours.start}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, start: e.target.value }
                          }))}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End</label>
                        <input
                          type="time"
                          value={data.quietHours.end}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, end: e.target.value }
                          }))}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Only urgent notifications will be sent during quiet hours
                  </p>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h5 className="font-medium text-gray-900">Marketing & Updates</h5>
                    <p className="text-sm text-gray-500">
                      New features, tips, and community highlights
                    </p>
                  </div>
                  <TouchToggle
                    checked={data.marketingEnabled}
                    onChange={(checked) => setData(prev => ({
                      ...prev,
                      marketingEnabled: checked
                    }))}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save button */}
      <div className="p-6 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <TouchButton
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </TouchButton>
        </div>
      </div>

      {/* Pause Modal */}
      <AnimatePresence>
        {showPauseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPauseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <VolumeX className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pause Notifications</h3>
                <p className="text-gray-600">How long would you like to pause?</p>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  { hours: 1, label: '1 hour' },
                  { hours: 4, label: '4 hours' },
                  { hours: 8, label: '8 hours' },
                  { hours: 24, label: '1 day' },
                  { hours: 168, label: '1 week' },
                ].map(option => (
                  <button
                    key={option.hours}
                    onClick={() => pauseNotifications(option.hours)}
                    className="w-full px-4 py-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <TouchButton
                variant="outline"
                className="w-full"
                onClick={() => setShowPauseModal(false)}
              >
                Cancel
              </TouchButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick notification toggle for header/nav
export function QuickNotificationToggle({ enabled, onToggle }: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition ${
        enabled
          ? 'text-indigo-600 hover:bg-indigo-50'
          : 'text-gray-400 hover:bg-gray-100'
      }`}
      title={enabled ? 'Notifications on' : 'Notifications off'}
    >
      {enabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </button>
  );
}
