'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, Clock, Award, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
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

export default function JudgeDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const judgeRedirectPath = '/judge/qualify';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [queue, setQueue] = useState<QueueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState({
    verdicts_given: 0,
    total_earnings: 0,
    available_for_payout: 0,
    average_quality_score: null as number | null,
    recent_verdicts: 0,
  });

  const fetchData = useCallback(async () => {
    try {
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
            setStats(statsData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (profile?.is_judge) {
        fetchData();
      }
    }, 5000);

    return () => clearInterval(interval);
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${stats.total_earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${stats.available_for_payout?.toFixed(2) || '0.00'} available
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold">
                  {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : '-'}
                </p>
                {stats.average_quality_score && (
                  <p className="text-xs text-gray-500 mt-1">Average rating</p>
                )}
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verdicts Given</p>
                <p className="text-2xl font-bold">{stats.verdicts_given}</p>
                {stats.recent_verdicts > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.recent_verdicts} this week
                  </p>
                )}
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Queue */}
        {!profile?.is_judge ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Become a Judge
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Toggle &quot;Available to Judge&quot; above to start seeing requests and earning money.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Available Requests</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Click on a request to submit your verdict
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  title="Refresh now"
                >
                  <Clock className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Auto-refresh enabled</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">Updates every 5 seconds</span>
              </div>
            </div>
            <div className="p-6">
              {queue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No requests available right now
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    New requests appear here as users submit them. Check back soon!
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>💡 Tip: Keep this page open to see new requests instantly</p>
                    <p>⏱️ Requests typically appear within minutes</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => router.push(`/judge/requests/${request.id}`)}
                      className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold capitalize">
                              {request.category}
                            </p>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {request.media_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {request.context}
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            {request.received_verdict_count}/{request.target_verdict_count} verdicts
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              $0.50
                            </p>
                            <p className="text-xs text-gray-500">Earnings</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Past Verdicts Link */}
        {profile?.is_judge && stats.verdicts_given > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  View Your Past Verdicts
                </h3>
                <p className="text-sm text-gray-600">
                  Review all {stats.verdicts_given} verdict{stats.verdicts_given !== 1 ? 's' : ''} you've submitted
                </p>
              </div>
              <button
                onClick={() => router.push('/judge/my-verdicts')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View All
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
