'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  Edit3,
  ArrowRight,
  Clock,
  CheckCircle,
  Zap,
  TrendingUp,
  Sparkles,
  Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { triggerHaptic } from '@/components/ui/Confetti';

interface UnifiedActivityWidgetProps {
  userId: string;
  className?: string;
}

interface ActivityData {
  // Seeker stats
  activeRequests: number;
  pendingVerdicts: number;
  completedRequests: number;
  totalVerdicts: number;

  // Judge stats
  reviewsToday: number;
  reviewsThisWeek: number;
  creditsEarned: number;
  currentStreak: number;

  // Credits
  availableCredits: number;
}

export function UnifiedActivityWidget({ userId, className = '' }: UnifiedActivityWidgetProps) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'seeker' | 'reviewer'>('overview');

  useEffect(() => {
    loadActivityData();
  }, [userId]);

  const loadActivityData = async () => {
    try {
      const supabase = createClient();

      // Fetch all data in parallel
      const [profileRes, requestsRes, verdictsRes] = await Promise.all([
        supabase.from('profiles').select('credits').eq('id', userId).single(),
        (supabase as any)
          .from('verdict_requests')
          .select('id, status, received_verdict_count, target_verdict_count')
          .eq('user_id', userId),
        (supabase as any)
          .from('verdict_responses')
          .select('id, created_at')
          .eq('judge_id', userId),
      ]);

      const profile = profileRes.data;
      const requests: any[] = requestsRes.data || [];
      const verdicts: any[] = verdictsRes.data || [];

      // Calculate seeker stats
      const activeRequests = requests.filter(
        (r) => r.status === 'open' || r.status === 'in_progress'
      ).length;
      const completedRequests = requests.filter((r) => r.status === 'closed').length;
      const pendingVerdicts = requests
        .filter((r) => r.status === 'open' || r.status === 'in_progress')
        .reduce((sum, r) => sum + (r.target_verdict_count - r.received_verdict_count), 0);
      const totalVerdicts = requests.reduce((sum, r) => sum + r.received_verdict_count, 0);

      // Calculate judge stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const reviewsToday = verdicts.filter(
        (v) => new Date(v.created_at) >= todayStart
      ).length;
      const reviewsThisWeek = verdicts.filter(
        (v) => new Date(v.created_at) >= weekStart
      ).length;
      const creditsEarned = Math.floor(verdicts.length / 3);

      setData({
        activeRequests,
        pendingVerdicts,
        completedRequests,
        totalVerdicts,
        reviewsToday,
        reviewsThisWeek,
        creditsEarned,
        currentStreak: 0, // Would need to calculate from verdict dates
        availableCredits: (profile as any)?.credits || 0,
      });
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Progress toward next credit
  const reviewProgress = data.reviewsThisWeek % 3;
  const reviewsToNextCredit = 3 - reviewProgress;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with tabs */}
      <div className="border-b border-gray-100">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'seeker', label: 'My Requests', icon: Edit3 },
            { id: 'reviewer', label: 'My Reviews', icon: Eye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Credit balance - hero */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Available Credits</p>
                  <p className="text-3xl font-bold text-indigo-900">{data.availableCredits}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    Submit
                  </Link>
                  <Link
                    href="/feed"
                    className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition"
                  >
                    Earn More
                  </Link>
                </div>
              </div>

              {/* Progress to next credit */}
              {data.availableCredits === 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-indigo-700">Progress to next credit</span>
                    <span className="font-medium text-indigo-900">
                      {reviewProgress}/3 reviews
                    </span>
                  </div>
                  <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${(reviewProgress / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">
                    {reviewsToNextCredit} more review{reviewsToNextCredit > 1 ? 's' : ''} to earn a free credit
                  </p>
                </div>
              )}
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.activeRequests}</p>
                <p className="text-xs text-gray-500">Active Requests</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.pendingVerdicts}</p>
                <p className="text-xs text-gray-500">Pending Verdicts</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.reviewsToday}</p>
                <p className="text-xs text-gray-500">Reviews Today</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.creditsEarned}</p>
                <p className="text-xs text-gray-500">Credits Earned</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seeker' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">In Progress</span>
                </div>
                <p className="text-3xl font-bold text-yellow-900">{data.activeRequests}</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {data.pendingVerdicts} verdicts incoming
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Completed</span>
                </div>
                <p className="text-3xl font-bold text-green-900">{data.completedRequests}</p>
                <p className="text-xs text-green-700 mt-1">
                  {data.totalVerdicts} total verdicts
                </p>
              </div>
            </div>

            <Link
              href="/my-requests"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
            >
              <span className="font-medium text-gray-900">View all requests</span>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        )}

        {activeTab === 'reviewer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-800">This Week</span>
                </div>
                <p className="text-3xl font-bold text-indigo-900">{data.reviewsThisWeek}</p>
                <p className="text-xs text-indigo-700 mt-1">reviews completed</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Total Earned</span>
                </div>
                <p className="text-3xl font-bold text-amber-900">{data.creditsEarned}</p>
                <p className="text-xs text-amber-700 mt-1">credits from reviews</p>
              </div>
            </div>

            <Link
              href="/feed"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-medium"
            >
              <Eye className="h-5 w-5" />
              Start Reviewing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
