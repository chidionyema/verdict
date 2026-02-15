'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Profile, VerdictRequest } from '@/lib/database.types';

import {
  Plus,
  Image,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  ArrowRight,
  Gavel,
  RefreshCw,
  Mail,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { UnifiedHeader } from './UnifiedHeader';
import { RoleAwareTabs } from './RoleAwareTabs';
import { InsightsSection } from './InsightsSection';
import { RealEarningsChart } from './RealEarningsChart';
import { useRoleDetection } from '@/hooks/useRoleDetection';
import { JudgeOnboardingWizard, JudgeJourneyProgress } from '@/components/judge/onboarding';

// Import judge dashboard components
import {
  RequestCard,
  QueueLoading,
  EmptyQueue,
  type QueueRequest,
  type JudgeStats,
  type QueueFilter,
  type QueueSort,
  DEFAULT_STATS,
} from '@/components/judge/dashboard';

type TabType = 'requester' | 'judge';

interface UnifiedDashboardProps {
  initialTab?: TabType;
}

export function UnifiedDashboard({ initialTab }: UnifiedDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleMetrics = useRoleDetection();

  // Determine initial tab from URL or role detection
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl || initialTab || 'requester'
  );

  // Requester state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<VerdictRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Judge state
  const [queue, setQueue] = useState<QueueRequest[]>([]);
  const [judgeStats, setJudgeStats] = useState<JudgeStats>(DEFAULT_STATS);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [queueSort, setQueueSort] = useState<QueueSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [queueLoading, setQueueLoading] = useState(false);

  // UI state
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Set active tab based on role detection if not specified
  useEffect(() => {
    if (!tabFromUrl && !initialTab && !roleMetrics.loading) {
      if (roleMetrics.primaryRole === 'judge') {
        setActiveTab('judge');
      }
    }
  }, [roleMetrics.primaryRole, roleMetrics.loading, tabFromUrl, initialTab]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  // Fetch seeker data
  const fetchRequesterData = useCallback(async (signal?: AbortSignal) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Please log in to view your dashboard.');
        return;
      }

      // Fetch profile and other data
      const [profileRes, requestsRes, notificationsRes] = await Promise.all([
        fetch('/api/profile', { signal }),
        fetch('/api/requests', { signal }),
        fetch('/api/notifications?unread_only=true&limit=50', { signal }),
      ]);

      if (profileRes.ok) {
        const { profile: profileData } = await profileRes.json();
        if (profileData) {
          setProfile(profileData as Profile);
        }
      }

      if (requestsRes.ok) {
        const { requests: requestsData } = await requestsRes.json();
        setRequests(requestsData || []);
      }

      if (notificationsRes.ok) {
        const { unread_count } = await notificationsRes.json();
        setUnreadNotifications(unread_count || 0);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Error fetching requester data:', err);
      setError('Failed to load data.');
    }
  }, []);

  // Fetch judge data
  const fetchJudgeData = useCallback(async (signal?: AbortSignal) => {
    setQueueLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        fetch('/api/judge/queue', { signal }),
        fetch('/api/judge/stats', { signal }),
      ]);

      if (queueRes.ok) {
        const { requests } = await queueRes.json();
        setQueue(requests || []);
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setJudgeStats(stats);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Error fetching judge data:', err);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // Initial data fetch with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      await fetchRequesterData(controller.signal);
      if (roleMetrics.isJudge || activeTab === 'judge') {
        await fetchJudgeData(controller.signal);
      }
      setLoading(false);
    };

    fetchAll();

    return () => controller.abort();
  }, [fetchRequesterData, fetchJudgeData, roleMetrics.isJudge, activeTab]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue
      .filter((request) => {
        if (queueFilter !== 'all' && request.category !== queueFilter) return false;
        if (searchQuery && !request.context?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (queueSort) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
            return 0;
        }
      });
  }, [queue, queueFilter, queueSort, searchQuery]);

  // Request stats
  const requestStats = useMemo(() => {
    const active = requests.filter(r => r.status === 'open' || r.status === 'in_progress').length;
    const completed = requests.filter(r => r.status === 'closed').length;
    return { active, completed, total: requests.length };
  }, [requests]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[48px]"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Unified Header */}
        <UnifiedHeader
          credits={profile?.credits || 0}
          unreadNotifications={unreadNotifications}
          displayName={profile?.display_name || undefined}
          onBuyCredits={() => setShowCreditsModal(true)}
          showEconomyExplainer
        />

        {/* Role Tabs */}
        <RoleAwareTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          requesterCount={requestStats.active}
          judgeCount={filteredQueue.length}
        />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'requester' ? (
            <motion.div
              key="requester"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <RequesterContent
                requests={requests}
                stats={requestStats}
                onRefresh={fetchRequesterData}
              />
            </motion.div>
          ) : (
            <motion.div
              key="judge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {!profile?.is_judge ? (
                <JudgeOnboardingSection
                  profile={profile}
                  onComplete={() => {
                    // Refresh data after becoming a judge
                    const controller = new AbortController();
                    fetchRequesterData(controller.signal).then(() =>
                      fetchJudgeData(controller.signal)
                    );
                  }}
                />
              ) : (
                <JudgeContent
                  stats={judgeStats}
                  queue={filteredQueue}
                  queueLoading={queueLoading}
                  filter={queueFilter}
                  sort={queueSort}
                  searchQuery={searchQuery}
                  onFilterChange={setQueueFilter}
                  onSortChange={setQueueSort}
                  onSearchChange={setSearchQuery}
                  onRefresh={fetchJudgeData}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Insights - Below content for less cognitive load */}
        <InsightsSection
          userType={activeTab === 'judge' ? 'judge' : 'requester'}
          maxInsights={3}
        />
      </div>
    </div>
  );
}

// Requester Content Component
function RequesterContent({
  requests,
  stats,
  onRefresh,
}: {
  requests: VerdictRequest[];
  stats: { active: number; completed: number; total: number };
  onRefresh: () => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No requests yet</h2>
        <p className="text-gray-600 mb-6">
          Submit your first request to get feedback from real people.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[48px] active:scale-[0.98] transition-transform"
        >
          <Plus className="h-5 w-5" />
          Create Your First Request
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active" value={stats.active} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Total" value={stats.total} color="gray" />
      </div>

      {/* Request Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.slice(0, 9).map((request) => (
          <RequestPreviewCard key={request.id} request={request} />
        ))}
      </div>

      {requests.length > 9 && (
        <div className="text-center">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
          >
            View all {requests.length} requests
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// Judge Content Component - Queue-first design
function JudgeContent({
  stats,
  queue,
  queueLoading,
  filter,
  searchQuery,
  onFilterChange,
  onSearchChange,
  onRefresh,
}: {
  stats: JudgeStats;
  queue: QueueRequest[];
  queueLoading: boolean;
  filter: QueueFilter;
  sort: QueueSort;
  searchQuery: string;
  onFilterChange: (f: QueueFilter) => void;
  onSortChange: (s: QueueSort) => void;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
}) {
  const [showEarnings, setShowEarnings] = useState(false);
  const featuredRequest = queue[0];
  const remainingQueue = queue.slice(1, 7);

  return (
    <div className="space-y-4">
      {/* Compact Stats Bar - Always visible */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Key Stats Row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Gavel className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.verdicts_today}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.streak_days}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">$</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">${stats.daily_earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Earned Today</p>
              </div>
            </div>
          </div>

          {/* Earnings Toggle */}
          <button
            onClick={() => setShowEarnings(!showEarnings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            {showEarnings ? 'Hide' : 'View'} Earnings
            <ArrowRight className={`h-4 w-4 transition-transform ${showEarnings ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Collapsible Earnings Chart */}
        <AnimatePresence>
          {showEarnings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-100">
                <RealEarningsChart availableForPayout={stats.available_for_payout} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Queue Hero Section - Primary Focus */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
        {/* Queue Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Ready to Judge</h2>
              {queue.length > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  {queue.length} available
                </span>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={queueLoading}
              aria-label="Refresh queue"
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw className={`h-5 w-5 ${queueLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'appearance', 'profile', 'writing', 'decision'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onFilterChange(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Queue Content */}
        <div className="p-6">
          {queueLoading ? (
            <QueueLoading />
          ) : queue.length === 0 ? (
            <EmptyQueue onRefresh={onRefresh} totalVerdicts={stats.verdicts_given} />
          ) : (
            <div className="space-y-4">
              {/* Featured Request - First in queue gets prominence */}
              {featuredRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FeaturedRequestCard request={featuredRequest} />
                </motion.div>
              )}

              {/* Remaining Queue Grid */}
              {remainingQueue.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {remainingQueue.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}

              {/* View More */}
              {queue.length > 7 && (
                <div className="text-center pt-4">
                  <Link
                    href="/judge"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    View All {queue.length} Requests
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Community Feed Quick Access */}
      <Link
        href="/feed"
        className="block bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-indigo-100 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Community Feed</h3>
              <p className="text-sm text-gray-600">See what others are getting feedback on</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}

// Featured Request Card - Larger, more prominent for first queue item
function FeaturedRequestCard({ request }: { request: QueueRequest }) {
  const router = useRouter();

  const handleClick = () => {
    if (request.request_type === 'comparison') {
      router.push(`/judge/comparisons/${request.id}`);
    } else if (request.request_type === 'split_test') {
      router.push(`/judge/split-tests/${request.id}`);
    } else {
      router.push(`/judge/requests/${request.id}`);
    }
  };

  const categoryIcons: Record<string, typeof Eye> = {
    appearance: Eye,
    profile: Eye,
    writing: FileText,
    decision: CheckCircle,
  };
  const CategoryIcon = categoryIcons[request.category] || Eye;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CategoryIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Up Next</span>
                {request.request_tier === 'pro' && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Premium</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 capitalize">{request.category}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">${request.request_tier === 'pro' ? '2.00' : request.request_tier === 'standard' ? '1.20' : '0.60'}</p>
            <p className="text-xs text-gray-500">Earn</p>
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-2">{request.context}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              {request.received_verdict_count}/{request.target_verdict_count} verdicts
            </span>
          </div>
          <button
            onClick={handleClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Start Judging
            <ArrowRight className="h-4 w-4 inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components - Unified styling
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-600',
    green: 'from-green-50 to-emerald-50 border-green-200 text-green-600',
    gray: 'from-gray-50 to-slate-50 border-gray-200 text-gray-600',
  };

  const config = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <div className={`bg-gradient-to-br ${config} border rounded-2xl p-4`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function QuickStat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-semibold text-gray-900 tabular-nums">
        {value}{suffix}
      </span>
    </div>
  );
}

function RequestPreviewCard({ request }: { request: VerdictRequest }) {
  const progress = (request.received_verdict_count / request.target_verdict_count) * 100;

  return (
    <Link
      href={`/requests/${request.id}`}
      className="block bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 min-h-[120px] hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
          {request.media_type === 'photo' ? (
            <Image className="h-6 w-6 text-gray-400" />
          ) : (
            <FileText className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {request.context?.slice(0, 50) || 'No context'}
          </p>
          <p className="text-sm text-gray-500 capitalize">{request.category}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">
            {request.received_verdict_count}/{request.target_verdict_count} verdicts
          </span>
          <StatusBadge status={request.status} />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    closed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Complete' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  };

  const { bg, text, label } = config[status as keyof typeof config] || config.open;

  return (
    <span className={`px-2 py-0.5 ${bg} ${text} text-xs font-medium rounded-full`}>
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header skeleton - matches UnifiedHeader height */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 w-32 bg-indigo-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="h-14 bg-white/80 rounded-2xl animate-pulse" />
        {/* Content skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-1/3 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Judge Onboarding Section - Inline wizard for becoming a judge
function JudgeOnboardingSection({
  profile,
  onComplete,
}: {
  profile: Profile | null;
  onComplete: () => void;
}) {
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const needsEmailVerification = !(profile as any)?.email_verified;

  const resendVerificationEmail = async () => {
    if (!profile?.email) return;
    setSendingVerification(true);
    setVerificationError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: profile.email,
      });
      if (error) throw error;
      setVerificationSent(true);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
      {/* Email verification prompt if needed */}
      {needsEmailVerification && (
        <div className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Mail className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">
                  Verify your email first
                </h3>
                <p className="text-amber-800 text-sm mb-4">
                  Check your inbox for a verification link. This helps us ensure quality judges.
                </p>
                {verificationSent ? (
                  <p className="text-green-700 text-sm font-medium">
                    Verification email sent! Check your inbox.
                  </p>
                ) : (
                  <button
                    onClick={resendVerificationEmail}
                    disabled={sendingVerification}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {sendingVerification ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </button>
                )}
                {verificationError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {verificationError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline onboarding wizard */}
      {!needsEmailVerification && (
        <JudgeOnboardingWizard onComplete={onComplete} />
      )}
    </div>
  );
}
