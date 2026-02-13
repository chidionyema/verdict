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
} from 'lucide-react';

import { UnifiedHeader } from './UnifiedHeader';
import { RoleAwareTabs } from './RoleAwareTabs';
import { InsightsSection } from './InsightsSection';
import { RealEarningsChart } from './RealEarningsChart';
import { EconomyExplainer } from './EconomyExplainer';
import { useRoleDetection } from '@/hooks/useRoleDetection';

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

      // Fetch profile separately to handle types correctly
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const [requestsRes, notificationsRes] = await Promise.all([
        fetch('/api/requests', { signal }),
        fetch('/api/notifications?unread_only=true&limit=50', { signal }),
      ]);

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
        />

        {/* Smart Insights */}
        <InsightsSection
          userType={activeTab === 'judge' ? 'judge' : 'requester'}
          maxInsights={3}
        />

        {/* Economy Explainer */}
        <div className="flex justify-center">
          <EconomyExplainer credits={profile?.credits || 0} />
        </div>

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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
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

// Judge Content Component
function JudgeContent({
  stats,
  queue,
  queueLoading,
  filter,
  sort,
  searchQuery,
  onFilterChange,
  onSortChange,
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
  return (
    <div className="space-y-6">
      {/* Earnings Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RealEarningsChart
          className="lg:col-span-2"
          availableForPayout={stats.available_for_payout}
        />

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Today's Progress</h3>
          <div className="space-y-3">
            <QuickStat label="Verdicts Today" value={stats.verdicts_today} />
            <QuickStat label="Daily Earnings" value={`$${stats.daily_earnings.toFixed(2)}`} />
            <QuickStat label="Quality Score" value={stats.average_quality_score?.toFixed(1) || '-'} suffix="/10" />
            <QuickStat label="Streak" value={`${stats.streak_days} days`} />
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Available Queue</h3>
          <button
            onClick={onRefresh}
            disabled={queueLoading}
            aria-label="Refresh queue"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
          >
            <RefreshCw className={`h-5 w-5 ${queueLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Simple inline filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as QueueFilter)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="appearance">Appearance</option>
            <option value="profile">Profile</option>
            <option value="writing">Writing</option>
            <option value="decision">Decision</option>
          </select>
        </div>

        {queueLoading ? (
          <QueueLoading />
        ) : queue.length === 0 ? (
          <EmptyQueue onRefresh={onRefresh} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {queue.slice(0, 6).map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}

        {/* Always show link to full judge dashboard */}
        <div className="text-center mt-6 space-y-2">
          {queue.length > 6 && (
            <Link
              href="/judge"
              className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            >
              View full queue ({queue.length} available)
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <div>
            <Link
              href="/judge"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            >
              Open full judge dashboard for earnings, progression & more
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    gray: 'from-gray-50 to-slate-50 border-gray-200',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-2xl p-4`}>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function QuickStat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-semibold text-gray-900">
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
        <div className="bg-white/80 rounded-3xl h-24 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-white/80 rounded-2xl h-12 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
