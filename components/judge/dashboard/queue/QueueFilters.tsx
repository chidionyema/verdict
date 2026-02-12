'use client';

import {
  MessageSquare,
  Crown,
  Target,
  HelpCircle,
  Info,
  XCircle,
  Users,
  Clock,
  Sparkles,
  Eye,
  Heart,
  Search,
} from 'lucide-react';
import type { QueueFilter, QueueSort, QueueRequest } from '../types';
import { getJudgeEarningForTier } from '../constants';

interface QueueFiltersProps {
  isExpert: boolean;
  expertInfo: { industry?: string; title?: string } | null;
  queueType: 'expert' | 'community';
  queueFilter: QueueFilter;
  setQueueFilter: (filter: QueueFilter) => void;
  queueSort: QueueSort;
  setQueueSort: (sort: QueueSort) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showQueueInfo: boolean;
  setShowQueueInfo: (show: boolean) => void;
  queue: QueueRequest[];
  filteredQueueLength: number;
  onRefresh: () => void;
}

const CATEGORY_FILTERS = [
  { value: 'all' as const, label: 'All Categories', icon: Sparkles, color: 'from-gray-500 to-slate-500' },
  { value: 'appearance' as const, label: 'Appearance', icon: Eye, color: 'from-pink-500 to-rose-500' },
  { value: 'profile' as const, label: 'Profile', icon: Heart, color: 'from-red-500 to-pink-500' },
  { value: 'writing' as const, label: 'Writing', icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
  { value: 'decision' as const, label: 'Decision', icon: Target, color: 'from-green-500 to-emerald-500' },
];

export function QueueFilters({
  isExpert,
  expertInfo,
  queueType,
  queueFilter,
  setQueueFilter,
  queueSort,
  setQueueSort,
  searchQuery,
  setSearchQuery,
  showQueueInfo,
  setShowQueueInfo,
  queue,
  filteredQueueLength,
  onRefresh,
}: QueueFiltersProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-indigo-600" />
              Available Requests
            </h2>
            {isExpert && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full shadow-lg">
                <Crown className="h-4 w-4" />
                Expert Queue
              </span>
            )}
            {queueType === 'expert' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <Target className="h-3.5 w-3.5" />
                Priority Matching
              </span>
            )}
            {/* Queue Type Info Button */}
            <div className="relative">
              <button
                onClick={() => setShowQueueInfo(!showQueueInfo)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                aria-label="Learn about queue types"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Queue Info Tooltip */}
              {showQueueInfo && (
                <div className="absolute left-0 top-10 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-600" />
                      Queue Types Explained
                    </h4>
                    <button
                      onClick={() => setShowQueueInfo(false)}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      <XCircle className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-900 text-sm">Community Queue</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Standard requests from regular users. Open to all qualified judges. Earn $
                        {getJudgeEarningForTier('community')} per verdict.
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-purple-900 text-sm">Expert Queue</span>
                      </div>
                      <p className="text-xs text-purple-700">
                        Premium requests matched to your verified expertise. Higher payouts ($
                        {getJudgeEarningForTier('expert')}+) for specialized feedback.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <strong>Unlock expert queue:</strong> Complete 100+ verdicts with 8.5+
                        quality rating, or verify your professional credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-1">
            {isExpert
              ? `Expert-matched requests for ${expertInfo?.industry || 'your field'}. Higher rewards for Pro tier requests.`
              : 'Choose requests that match your expertise. Quality responses earn better ratings.'}
          </p>
          {isExpert && expertInfo && (
            <p className="text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-lg mt-2 inline-block">
              Verified as: {expertInfo.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live Updates</span>
          </div>
          <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-xl">
            {queue.length === 0
              ? 'No requests available'
              : `${filteredQueueLength} of ${queue.length} requests`}
          </span>
          <button
            onClick={onRefresh}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Visual Category Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {CATEGORY_FILTERS.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.value}
              onClick={() => setQueueFilter(category.value)}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                queueFilter === category.value
                  ? 'border-transparent shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {queueFilter === category.value && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 rounded-2xl`}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    queueFilter === category.value
                      ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    queueFilter === category.value ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {category.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <select
          value={queueSort}
          onChange={(e) => setQueueSort(e.target.value as QueueSort)}
          className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none font-medium"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="earnings">Highest Earnings</option>
        </select>
      </div>
    </div>
  );
}
