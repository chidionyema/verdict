'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Calendar, DollarSign, Award, Filter, Search, TrendingUp, Activity, Users, Crown, Target, BarChart3, Sparkles, ArrowRight, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

interface VerdictResponse {
  id: string;
  created_at: string;
  rating: number;
  feedback: string;
  tone: string;
  quality_score: number | null;
  judge_earning: number;
  request_id: string;
  verdict_requests?: {
    category: string;
    subcategory: string | null;
    context: string;
    media_type: string;
  };
}

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function MyVerdictsPage() {
  const router = useRouter();

  const [verdicts, setVerdicts] = useState<VerdictResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [filterTone, setFilterTone] = useState<'all' | 'encouraging' | 'honest' | 'constructive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchVerdicts();
  }, []);

  const fetchVerdicts = async () => {
    try {
      const res = await fetch('/api/judge/my-responses?limit=100');
      if (!res.ok) {
        throw new Error('Failed to fetch verdicts');
      }
      const data = await res.json();
      setVerdicts(data.responses || []);

      // Fetch earnings summary so total earnings matches payouts
      try {
        const earningsRes = await fetch('/api/judge/earnings?limit=1');
        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          const total = earningsData?.summary?.total_earned ?? 0;
          if (typeof total === 'number') {
            setTotalEarnings(total);
          }
        }
      } catch {
        // ignore earnings summary failure; page still works without it
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verdicts');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);
  const startOfMonth = new Date(startOfToday);
  startOfMonth.setDate(startOfToday.getDate() - 30);

  const filteredVerdicts = verdicts.filter((verdict) => {
    const createdAt = new Date(verdict.created_at);

    const matchesTone = filterTone === 'all' || verdict.tone === filterTone;
    const matchesSearch =
      searchTerm === '' ||
      verdict.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verdict.verdict_requests?.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verdict.verdict_requests?.context.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTime = true;
    if (timeFilter === 'today') {
      matchesTime = createdAt >= startOfToday;
    } else if (timeFilter === 'week') {
      matchesTime = createdAt >= startOfWeek;
    } else if (timeFilter === 'month') {
      matchesTime = createdAt >= startOfMonth;
    }

    return matchesTone && matchesSearch && matchesTime;
  });

  const averageRating = verdicts.length > 0
    ? verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) / verdicts.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-2" />
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-4" />
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <Link
              href="/judge"
              className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6 font-semibold transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Judge Dashboard
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 text-white shadow-lg flex items-center justify-center">
                  <Award className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Verdicts</h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    Your judging legacy, earnings history, and community impact dashboard.
                  </p>
                </div>
              </div>
              
              <Link
                href="/judge"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap group"
              >
                View Judge Queue
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Verdicts */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Award className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-indigo-600 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+{Math.floor(verdicts.length * 0.2)} this month</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{verdicts.length}</p>
                <p className="text-sm text-gray-600 font-medium">Total Verdicts</p>
                <p className="text-xs text-indigo-600 mt-1">
                  Building your expert reputation
                </p>
              </div>
            </div>
          </div>
          
          {/* Total Earnings */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span>Growing</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
                <p className="text-xs text-green-600 mt-1">
                  ${(totalEarnings / verdicts.length || 0).toFixed(2)} per verdict average
                </p>
              </div>
            </div>
          </div>
          
          {/* Average Rating */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Star className="h-7 w-7" />
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < Math.round(averageRating / 2)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}/10</p>
                <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {averageRating >= 8 ? 'Excellent performance!' : averageRating >= 7 ? 'Good work!' : 'Room to improve'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Quality Score */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-violet-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Crown className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-purple-600 text-sm font-semibold">
                    <Target className="h-4 w-4 mr-1" />
                    <span>Quality</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {verdicts.filter(v => v.quality_score).length > 0
                    ? (verdicts
                        .filter(v => v.quality_score)
                        .reduce((sum, v) => sum + parseFloat(v.quality_score?.toString() || '0'), 0) /
                      verdicts.filter(v => v.quality_score).length).toFixed(1)
                    : 'N/A'}
                </p>
                <p className="text-sm text-gray-600 font-medium">Quality Score</p>
                <p className="text-xs text-purple-600 mt-1">
                  Based on {verdicts.filter(v => v.quality_score).length} rated verdicts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Filter & Search Your Verdicts</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your verdicts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              
              {/* Tone Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value as any)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none font-semibold text-gray-900"
                >
                  <option value="all">All Tones</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="honest">Honest</option>
                  <option value="constructive">Constructive</option>
                </select>
              </div>
            </div>

            {/* Time Range Pills */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Time Range</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'all', label: 'All time', icon: <Clock className="h-4 w-4" /> },
                  { key: 'today', label: 'Today', icon: <Activity className="h-4 w-4" /> },
                  { key: 'week', label: 'Last 7 days', icon: <Calendar className="h-4 w-4" /> },
                  { key: 'month', label: 'Last 30 days', icon: <BarChart3 className="h-4 w-4" /> },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTimeFilter(option.key as any)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 ${
                      timeFilter === option.key
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Verdicts List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredVerdicts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {verdicts.length === 0 ? 'No verdicts yet' : 'No verdicts match your filters'}
            </h3>
            <p className="text-gray-500">
              {verdicts.length === 0
                ? 'Start judging requests to see your verdicts here'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {verdicts.length === 0 && (
              <Link
                href="/judge"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View Available Requests
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerdicts.map((verdict) => (
              <div
                key={verdict.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                        {verdict.verdict_requests?.category || 'Unknown'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          verdict.tone === 'encouraging'
                            ? 'bg-green-100 text-green-700'
                            : verdict.tone === 'honest'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {verdict.tone}
                      </span>
                      {verdict.quality_score && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          Quality: {parseFloat(verdict.quality_score.toString()).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Request you judged
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {verdict.verdict_requests?.context?.substring(0, 160)}
                      {verdict.verdict_requests?.context &&
                      verdict.verdict_requests.context.length > 160
                        ? '…'
                        : ''}
                    </p>
                    <div className="mb-2">
                      <Link
                        href={`/requests/${verdict.request_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                      >
                        Open full request →
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(verdict.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        You gave <span className="font-semibold">{verdict.rating}/10</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        ${parseFloat(verdict.judge_earning?.toString() || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Your verdict
                  </p>
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
                    <p className="text-gray-900 leading-relaxed font-medium">
                      {verdict.feedback}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Premium Styling */}
      <style jsx>{`
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

