'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, Clock, Award, ArrowRight, ToggleLeft, ToggleRight, TrendingUp, Star, Zap, Filter, Search } from 'lucide-react';
import type { Profile } from '@/lib/database.types';

interface QueueRequest {
  id: string;
  created_at: string;
  category: string;
  subcategory: string | null;
  media_type: string;
  context: string;
  target_verdict_count: number;
  received_verdict_count: number;
}

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function JudgeDashboardPage() {
  const router = useRouter();
  const judgeRedirectPath = '/judge/qualify';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [queue, setQueue] = useState<QueueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'appearance' | 'profile' | 'writing' | 'decision'>('all');
  const [queueSort, setQueueSort] = useState<'newest' | 'oldest' | 'earnings'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    verdicts_given: 0,
    total_earnings: 0,
    available_for_payout: 0,
    average_quality_score: null as number | null,
    recent_verdicts: 0,
    response_time_avg: 0,
    weekly_earnings: 0,
    completion_rate: 0,
  });

  // Filter and sort queue
  const filteredQueue = queue
    .filter(request => {
      // Filter by category
      if (queueFilter !== 'all' && request.category !== queueFilter) return false;
      // Filter by search query
      if (searchQuery && !request.context.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (queueSort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'earnings':
          return 0.6 - 0.5; // Placeholder - would use actual earnings data
        default:
          return 0;
      }
    });

  const fetchData = useCallback(async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null };
        setProfile(profileData);

        // Only fetch queue and stats if judge
        if (profileData?.is_judge) {
          const res = await fetch('/api/judge/queue');
          if (res.ok) {
            const { requests } = await res.json();
            setQueue(requests || []);
          }

          // Fetch judge stats
          const statsRes = await fetch('/api/judge/stats');
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(prev => ({ ...prev, ...statsData }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Set up SSE for real-time updates
    if (typeof window !== 'undefined' && profile?.is_judge) {
      const eventSource = new EventSource('/api/judge/queue/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'requests') {
            setQueue(data.requests || []);
          } else if (data.type === 'connected') {
            console.log('SSE connected:', data.message);
          } else if (data.type === 'heartbeat') {
            // Connection is alive
          } else if (data.type === 'reconnect') {
            console.log('SSE reconnect requested:', data.message);
            eventSource.close();
            // Trigger a manual refetch
            fetchData();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [profile?.is_judge]);

  useEffect(() => {
    // Set up auto-refresh every 5 seconds
    if (profile?.is_judge) {
      const interval = setInterval(() => {
        fetchData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [fetchData, profile?.is_judge]);

  const toggleJudge = async () => {
    if (!profile) return;
    setToggling(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_judge: !profile.is_judge }),
      });

      if (res.ok) {
        const { profile: updated } = await res.json();
        setProfile(updated);

        // Fetch queue if now a judge
        if (updated.is_judge) {
          const queueRes = await fetch('/api/judge/queue');
          if (queueRes.ok) {
            const { requests } = await queueRes.json();
            setQueue(requests || []);
          }
        } else {
          setQueue([]);
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-2" />
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show sign-in prompt
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Become a Judge</h2>
          <p className="text-gray-600 mb-6">
            Sign in or create an account to start judging and earning credits.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('verdict_redirect_to', judgeRedirectPath);
                }
                router.push(`/auth/signup?redirect=${encodeURIComponent(judgeRedirectPath)}`);
              }}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Sign Up to Judge
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('verdict_redirect_to', judgeRedirectPath);
                }
                router.push(`/auth/login?redirect=${encodeURIComponent(judgeRedirectPath)}`);
              }}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not qualified as a judge, show qualification prompt
  if (!profile.is_judge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg">
          <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Award className="h-10 w-10 text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Become a Qualified Judge</h2>
          <p className="text-gray-600 mb-6">
            To maintain quality standards, all judges must complete a brief qualification process. 
            This ensures you understand our guidelines and can provide valuable feedback.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Learn quality feedback guidelines</li>
              <li>• Quick 4-question quiz (75% to pass)</li>
              <li>• Takes about 5 minutes</li>
              <li>• Start earning immediately after</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/judge/qualify')}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
            >
              Start Qualification
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judge Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Earn money by giving honest feedback
            </p>
          </div>
          <button
            onClick={toggleJudge}
            disabled={toggling}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition cursor-pointer ${
              profile?.is_judge
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {profile?.is_judge ? (
              <>
                <ToggleRight className="h-5 w-5 mr-2" />
                Available to Judge
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 mr-2" />
                Not Available
              </>
            )}
          </button>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+${stats.weekly_earnings.toFixed(2)} this week</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Total Earnings</p>
              <p className="text-2xl font-bold text-green-900">${stats.total_earnings.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">
                ${stats.available_for_payout?.toFixed(2) || '0.00'} available for payout
              </p>
            </div>
          </div>

          {/* Verdicts Given */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-blue-600 text-sm">
                  <Zap className="h-4 w-4 mr-1" />
                  <span>{stats.completion_rate.toFixed(0)}% completion</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Verdicts Given</p>
              <p className="text-2xl font-bold text-blue-900">{stats.verdicts_given}</p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.recent_verdicts} in the last 7 days
              </p>
            </div>
          </div>

          {/* Quality Score */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-purple-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Excellent</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-700">Quality Score</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.average_quality_score ? `${stats.average_quality_score.toFixed(1)}/10` : 'N/A'}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Based on {stats.verdicts_given} verdicts
              </p>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-orange-600 text-sm">
                  <Zap className="h-4 w-4 mr-1" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-700">Avg Response Time</p>
              <p className="text-2xl font-bold text-orange-900">
                {stats.response_time_avg ? `${Math.round(stats.response_time_avg)}m` : 'N/A'}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Target: Under 30 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        {!profile?.is_judge ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Become a Judge
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Toggle "Available to Judge" above to start seeing requests and earning money.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Available Requests</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Requests that are ready for you to claim and answer. Most verdicts pay about $0.45–$0.55 and take 3–5 minutes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    {queue.length === 0
                      ? '0 requests available'
                      : `${filteredQueue.length} of ${queue.length} request${queue.length > 1 ? 's' : ''} shown`}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live updates</span>
                  </div>
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    <Clock className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={queueFilter}
                    onChange={(e) => setQueueFilter(e.target.value as any)}
                    className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="appearance">Appearance</option>
                    <option value="profile">Profile</option>
                    <option value="writing">Writing</option>
                    <option value="decision">Decision</option>
                  </select>
                </div>

                <select
                  value={queueSort}
                  onChange={(e) => setQueueSort(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="earnings">Highest Earnings</option>
                </select>
              </div>
            </div>

            <div className="p-6">
              {/* Next best request spotlight */}
              {filteredQueue.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                      Next best request for you
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {filteredQueue[0].category.charAt(0).toUpperCase() + filteredQueue[0].category.slice(1)} · {filteredQueue[0].media_type}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {filteredQueue[0].context}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Earn about <span className="font-semibold text-green-700">$0.55</span> in ~3–5 minutes.
                    </p>
                  </div>
                  <div className="flex md:flex-col items-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition min-w-[160px]"
                      onClick={() => router.push(`/judge/requests/${filteredQueue[0].id}`)}
                    >
                      Start now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                    <p className="text-[11px] text-gray-500 md:text-right">
                      Or pick any request from the list below.
                    </p>
                  </div>
                </div>
              )}

              {queue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No requests available right now
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Keep this tab open — new requests will appear automatically, and we&apos;ll highlight them for you.
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>💡 Tip: Keep this page open to see new requests instantly</p>
                    <p>⏱️ Requests typically appear within minutes</p>
                  </div>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No requests match your filters
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filter settings
                  </p>
                  <button
                    onClick={() => {
                      setQueueFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQueue.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-xl p-4 md:p-5 hover:border-indigo-500 transition group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-semibold capitalize text-gray-900">
                              {request.category}
                            </p>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {request.media_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                            {request.context}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Click &quot;Open request&quot; to review and submit your verdict (text and optional voice note).
                          </p>
                        </div>
                        <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-[140px]">
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-semibold text-green-600 leading-tight">
                              $0.55
                            </p>
                            <p className="text-xs text-gray-500">
                              Potential earnings
                            </p>
                          </div>
                          <button
                            type="button"
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition min-h-[40px]"
                            onClick={() => router.push(`/judge/requests/${request.id}`)}
                          >
                            Open request
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Verdicts Link */}
        {profile?.is_judge && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {stats.verdicts_given > 0 ? 'View Your Past Verdicts' : 'My Verdicts'}
              </h3>
              <p className="text-sm text-gray-600">
                {stats.verdicts_given > 0 
                  ? `Review all ${stats.verdicts_given} verdict${stats.verdicts_given !== 1 ? 's' : ''} you've submitted`
                  : 'Your submitted verdicts will appear here'
                }
              </p>
            </div>
            <button
              onClick={() => router.push('/judge/my-verdicts')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {stats.verdicts_given > 0 ? 'View All' : 'View Verdicts'}
            </button>
            </div>
          </div>
        )}

        {/* Tips */}
        {profile?.is_judge && (
          <div className="mt-8 bg-indigo-50 rounded-lg p-6">
            <h3 className="font-semibold text-indigo-900 mb-3">
              Tips for Quality Verdicts
            </h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li>- Be specific and constructive in your feedback</li>
              <li>- Consider the context provided by the seeker</li>
              <li>- Give honest but respectful opinions</li>
              <li>- Write at least 50 characters of meaningful feedback</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
