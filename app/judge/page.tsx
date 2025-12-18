'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  DollarSign, 
  Clock, 
  Award, 
  ArrowRight, 
  ToggleLeft, 
  ToggleRight, 
  TrendingUp, 
  Star, 
  Zap, 
  Filter, 
  Search,
  Flame,
  Trophy,
  Target,
  Gift,
  Calendar,
  Activity,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Crown,
  Medal,
  Coins,
  BarChart3,
  MessageSquare,
  Eye,
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Heart,
  Users
} from 'lucide-react';
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
  request_tier?: 'community' | 'standard' | 'pro';
  expert_only?: boolean;
  priority?: number;
  routing_strategy?: 'expert_only' | 'mixed' | 'community';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward?: string;
}

interface ActivityItem {
  id: string;
  type: 'verdict' | 'bonus' | 'milestone' | 'level_up';
  title: string;
  amount?: number;
  timestamp: string;
  icon: React.ReactNode;
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
  const [isExpert, setIsExpert] = useState(false);
  const [expertInfo, setExpertInfo] = useState<{ industry?: string; title?: string } | null>(null);
  const [queueType, setQueueType] = useState<'expert' | 'community'>('community');
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
    streak_days: 0,
    next_level_progress: 0,
    daily_earnings: 0,
    monthly_earnings: 0,
    best_category: 'appearance',
    verdicts_today: 0,
    earnings_trend: 'up' as 'up' | 'down' | 'stable',
  });
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [earningsData, setEarningsData] = useState<Array<{ date: string; amount: number }>>([]);

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

  const fetchData = async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get profile with timeout
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null; error: any };
          
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setLoading(false);
          return;
        }
        
        setProfile(profileData);

        // Only fetch queue and stats if judge
        if (profileData?.is_judge) {
          try {
            const res = await fetch('/api/judge/queue', { 
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (res.ok) {
              const { requests, isExpert: isExpertResponse, expertInfo: expertInfoResponse, queueType: queueTypeResponse } = await res.json();
              setQueue(requests || []);
              setIsExpert(isExpertResponse || false);
              setExpertInfo(expertInfoResponse || null);
              setQueueType(queueTypeResponse || 'community');
            } else {
              console.error('Queue fetch failed:', res.status, res.statusText);
            }
          } catch (queueError) {
            console.error('Queue fetch error:', queueError);
          }

          try {
            const statsRes = await fetch('/api/judge/stats', { 
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats(prev => ({ ...prev, ...statsData }));
            } else {
              console.error('Stats fetch failed:', statsRes.status, statsRes.statusText);
            }
          } catch (statsError) {
            console.error('Stats fetch error:', statsError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Temporarily disabled SSE to debug loading issues
  /*
  useEffect(() => {
    // Set up SSE for real-time updates
    if (typeof window !== 'undefined' && profile?.is_judge) {
      let eventSource: EventSource;
      
      try {
        eventSource = new EventSource('/api/judge/queue/stream');
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'requests') {
              setQueue(data.requests || []);
              // Update expert info if available in stream
              if (data.isExpert !== undefined) {
                setIsExpert(data.isExpert);
                setExpertInfo(data.expertInfo || null);
                setQueueType(data.queueType || 'community');
              }
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
          if (eventSource) {
            eventSource.close();
          }
        };

        return () => {
          if (eventSource) {
            eventSource.close();
          }
        };
      } catch (error) {
        console.error('Error creating SSE connection:', error);
      }
    }
  }, [profile?.is_judge]);
  */

  useEffect(() => {
    // Set up auto-refresh every 30 seconds (less aggressive)
    if (profile?.is_judge) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [profile?.is_judge]);

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

  const getJudgeLevel = () => {
    const verdicts = stats.verdicts_given || 0;
    const quality = stats.average_quality_score || 0;

    if (verdicts >= 500 && quality >= 9) return { name: 'Master Judge', level: 5, icon: <Crown className="h-5 w-5" />, color: 'from-yellow-500 to-amber-500' };
    if (verdicts >= 200 && quality >= 8.5) return { name: 'Expert Judge', level: 4, icon: <Trophy className="h-5 w-5" />, color: 'from-purple-500 to-violet-500' };
    if (verdicts >= 100 && quality >= 8.5) return { name: 'Trusted Judge', level: 3, icon: <Medal className="h-5 w-5" />, color: 'from-indigo-500 to-blue-500' };
    if (verdicts >= 30 && quality >= 8) return { name: 'Rising Judge', level: 2, icon: <Star className="h-5 w-5" />, color: 'from-green-500 to-emerald-500' };
    if (verdicts >= 5) return { name: 'Getting Started', level: 1, icon: <Sparkles className="h-5 w-5" />, color: 'from-gray-500 to-slate-500' };
    return { name: 'New Judge', level: 0, icon: <Award className="h-5 w-5" />, color: 'from-gray-400 to-gray-500' };
  };

  const getAchievements = (): Achievement[] => [
    {
      id: 'first_verdict',
      title: 'First Verdict',
      description: 'Submit your first verdict',
      icon: <CheckCircle2 className="h-5 w-5" />,
      progress: Math.min(stats.verdicts_given, 1),
      maxProgress: 1,
      unlocked: stats.verdicts_given >= 1,
      reward: '$0.50 bonus'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Respond in under 5 minutes',
      icon: <Timer className="h-5 w-5" />,
      progress: stats.response_time_avg && stats.response_time_avg < 5 ? 1 : 0,
      maxProgress: 1,
      unlocked: stats.response_time_avg !== null && stats.response_time_avg < 5,
      reward: 'Speed Bonus Unlocked'
    },
    {
      id: 'week_streak',
      title: '7-Day Streak',
      description: 'Judge every day for a week',
      icon: <Flame className="h-5 w-5" />,
      progress: Math.min(stats.streak_days, 7),
      maxProgress: 7,
      unlocked: stats.streak_days >= 7,
      reward: '$5.00 bonus'
    },
    {
      id: 'quality_champion',
      title: 'Quality Champion',
      description: 'Maintain 9.0+ quality score',
      icon: <Trophy className="h-5 w-5" />,
      progress: stats.average_quality_score && stats.average_quality_score >= 9 ? 1 : 0,
      maxProgress: 1,
      unlocked: stats.average_quality_score !== null && stats.average_quality_score >= 9,
      reward: 'Premium Requests'
    },
    {
      id: 'century',
      title: 'Century',
      description: 'Complete 100 verdicts',
      icon: <Target className="h-5 w-5" />,
      progress: Math.min(stats.verdicts_given, 100),
      maxProgress: 100,
      unlocked: stats.verdicts_given >= 100,
      reward: '$10.00 bonus'
    }
  ];

  // Mock earnings data for chart
  useEffect(() => {
    const generateEarningsData = () => {
      const data = [];
      const days = selectedTimeframe === 'daily' ? 24 : selectedTimeframe === 'weekly' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        if (selectedTimeframe === 'daily') {
          date.setHours(date.getHours() - i);
        } else {
          date.setDate(date.getDate() - i);
        }
        data.push({
          date: date.toISOString(),
          amount: Math.random() * 10 + 5 + (days - i) * 0.5
        });
      }
      setEarningsData(data);
    };
    generateEarningsData();
  }, [selectedTimeframe]);

  const judgeLevel = getJudgeLevel();
  const achievements = getAchievements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Premium Header with Level Progress */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${judgeLevel.color} p-3 text-white shadow-lg animate-pulse`}>
                  {judgeLevel.icon}
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">Judge Dashboard</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${judgeLevel.color} text-white text-sm font-semibold shadow-lg`}>
                      {judgeLevel.icon}
                      <span>{judgeLevel.name}</span>
                      <span className="text-white/80">• Level {judgeLevel.level}</span>
                    </span>
                    {stats.streak_days > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-semibold shadow-lg animate-pulse">
                        <Flame className="h-4 w-4" />
                        {stats.streak_days} day streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Level Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Level {judgeLevel.level} Progress</span>
                  <span className="text-indigo-600 font-bold">{stats.next_level_progress}% to Level {judgeLevel.level + 1}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full bg-gradient-to-r ${judgeLevel.color} shadow-lg transition-all duration-1000 ease-out relative overflow-hidden`}
                    style={{ width: `${stats.next_level_progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="relative bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Trophy className="h-5 w-5 inline mr-2" />
                Achievements
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce">
                  {achievements.filter(a => !a.unlocked).length}
                </span>
              </button>
              
              <button
                onClick={toggleJudge}
                disabled={toggling}
                className={`relative flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                  profile?.is_judge
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
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
                {profile?.is_judge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAchievements(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Trophy className="h-8 w-8" />
                  Your Achievements
                </h2>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-lg'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-semibold">
                                {achievement.progress} / {achievement.maxProgress}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  achievement.unlocked
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                    : 'bg-gray-400'
                                }`}
                                style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                              />
                            </div>
                          </div>
                          {achievement.reward && (
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              achievement.unlocked
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Gift className="h-3 w-3" />
                              {achievement.reward}
                            </div>
                          )}
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Stats Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Earnings Overview with Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  Earnings Overview
                </h3>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedTimeframe === timeframe
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      stats.earnings_trend === 'up' ? 'text-green-600' : stats.earnings_trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stats.earnings_trend === 'up' ? <ChevronUp className="h-3 w-3" /> : stats.earnings_trend === 'down' ? <ChevronDown className="h-3 w-3" /> : null}
                      {stats.earnings_trend === 'up' ? '+12%' : stats.earnings_trend === 'down' ? '-5%' : '0%'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.total_earnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Total Earnings</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats[selectedTimeframe === 'daily' ? 'daily_earnings' : selectedTimeframe === 'weekly' ? 'weekly_earnings' : 'monthly_earnings'].toFixed(2)}</p>
                  <p className="text-xs text-gray-600">This {selectedTimeframe.replace('ly', '')}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.available_for_payout.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Ready to Payout</p>
                </div>
              </div>
              
              {/* Earnings Chart */}
              <div className="h-48 flex items-end gap-1">
                {earningsData.map((data, index) => {
                  const maxAmount = Math.max(...earningsData.map(d => d.amount));
                  const height = (data.amount / maxAmount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group cursor-pointer"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${data.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                Request Payout →
              </button>
            </div>
          </div>
          
          {/* Quick Stats & Achievements Progress */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Today's Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verdicts Today</span>
                  <span className="text-lg font-bold text-gray-900">{stats.verdicts_today}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : 'N/A'}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            stats.average_quality_score && i < Math.round(stats.average_quality_score / 2)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.response_time_avg ? `${Math.round(stats.response_time_avg)}m` : 'N/A'}
                    </span>
                    {stats.response_time_avg && stats.response_time_avg < 10 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        FAST!
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Category</span>
                  <span className="text-sm font-semibold text-indigo-600 capitalize">
                    {stats.best_category}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Next Milestone */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full filter blur-2xl" />
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Next Milestone
                </h3>
                
                <div className="mb-3">
                  <p className="text-sm opacity-90 mb-1">Complete 10 more verdicts to unlock</p>
                  <p className="text-xl font-bold">Premium Request Access</p>
                </div>
                
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/90 rounded-full transition-all duration-1000"
                    style={{ width: '75%' }}
                  />
                </div>
                <p className="text-xs mt-2 opacity-80">75% complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        {!profile?.is_judge ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Start Earning?
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Toggle "Available to Judge" above to start seeing requests and earning money. Join our community of thoughtful reviewers!
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span>~$0.55 per verdict</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>3-5 minutes each</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span>Build your reputation</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Advanced Filtering UI */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
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
                  </div>
                  <p className="text-gray-600 mt-1">
                    {isExpert 
                      ? `Expert-matched requests for ${expertInfo?.industry || 'your field'}. Higher rewards for Pro tier requests.`
                      : "Choose requests that match your expertise. Quality responses earn better ratings."
                    }
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
                      : `${filteredQueue.length} of ${queue.length} requests`}
                  </span>
                  <button
                    onClick={fetchData}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
              
              {/* Visual Category Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { value: 'all', label: 'All Categories', icon: <Sparkles className="h-5 w-5" />, color: 'from-gray-500 to-slate-500' },
                  { value: 'appearance', label: 'Appearance', icon: <Eye className="h-5 w-5" />, color: 'from-pink-500 to-rose-500' },
                  { value: 'profile', label: 'Profile', icon: <Heart className="h-5 w-5" />, color: 'from-red-500 to-pink-500' },
                  { value: 'writing', label: 'Writing', icon: <MessageSquare className="h-5 w-5" />, color: 'from-blue-500 to-cyan-500' },
                  { value: 'decision', label: 'Decision', icon: <Target className="h-5 w-5" />, color: 'from-green-500 to-emerald-500' },
                ].map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setQueueFilter(category.value as any)}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                      queueFilter === category.value
                        ? 'border-transparent shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {queueFilter === category.value && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 rounded-2xl`} />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        queueFilter === category.value
                          ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.icon}
                      </div>
                      <span className={`text-sm font-medium ${
                        queueFilter === category.value ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {category.label}
                      </span>
                    </div>
                  </button>
                ))}
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
                  onChange={(e) => setQueueSort(e.target.value as any)}
                  className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="earnings">Highest Earnings</option>
                </select>
              </div>
            </div>
            
            {/* Request Cards */}
            <div className="space-y-4">
              {/* Premium Request Spotlight */}
              {filteredQueue.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl shadow-xl">
                  <div className="bg-white rounded-[22px] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <Sparkles className="h-3.5 w-3.5" />
                            BEST MATCH FOR YOU
                          </span>
                          {filteredQueue[0].request_tier === 'pro' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                              <Crown className="h-3.5 w-3.5" />
                              PRO TIER
                            </span>
                          )}
                          {filteredQueue[0].request_tier === 'standard' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                              <Star className="h-3.5 w-3.5" />
                              STANDARD
                            </span>
                          )}
                          {(filteredQueue[0].request_tier === 'pro' || filteredQueue[0].request_tier === 'standard') && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                              <Coins className="h-3.5 w-3.5" />
                              HIGH EARNING
                            </span>
                          )}
                          {filteredQueue[0].expert_only && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
                              <Medal className="h-3.5 w-3.5" />
                              EXPERT ONLY
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 capitalize">
                            {filteredQueue[0].category} Request
                          </h3>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {filteredQueue[0].media_type}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {filteredQueue[0].context}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              Earn ${filteredQueue[0].request_tier === 'pro' ? '2.00' : 
                                   filteredQueue[0].request_tier === 'standard' ? '1.00' : '0.60'}
                              {filteredQueue[0].request_tier === 'pro' && (
                                <span className="text-purple-600 ml-1">+bonus</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">~3-5 minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-600">{filteredQueue[0].received_verdict_count}/{filteredQueue[0].target_verdict_count} verdicts</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => router.push(`/judge/requests/${filteredQueue[0].id}`)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 min-w-[200px] group"
                      >
                        Start Now
                        <ArrowRight className="h-5 w-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Request Cards */}
              {queue.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Clock className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Waiting for new requests...
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Keep this tab open — new requests will appear automatically with a notification.
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span>Auto-refresh enabled</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Timer className="h-4 w-4 text-green-600" />
                      <span>Usually within 2-5 min</span>
                    </div>
                  </div>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No matching requests
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Try adjusting your filters or search terms to see more requests
                  </p>
                  <button
                    onClick={() => {
                      setQueueFilter('all');
                      setSearchQuery('');
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredQueue.slice(filteredQueue.length > 0 ? 1 : 0).map((request) => {
                    const categoryConfig = {
                      appearance: { icon: <Eye className="h-5 w-5" />, color: 'from-pink-500 to-rose-500' },
                      profile: { icon: <Heart className="h-5 w-5" />, color: 'from-red-500 to-pink-500' },
                      writing: { icon: <MessageSquare className="h-5 w-5" />, color: 'from-blue-500 to-cyan-500' },
                      decision: { icon: <Target className="h-5 w-5" />, color: 'from-green-500 to-emerald-500' },
                    }[request.category] || { icon: <Sparkles className="h-5 w-5" />, color: 'from-gray-500 to-slate-500' };
                    
                    return (
                      <div
                        key={request.id}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryConfig.color} rounded-full mix-blend-multiply filter blur-3xl opacity-5 group-hover:opacity-10 transition-opacity`} />
                        
                        <div className="relative z-10">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center shadow-lg`}>
                              {categoryConfig.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 capitalize">
                                  {request.category}
                                </h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                  {request.media_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {request.received_verdict_count}/{request.target_verdict_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                            {request.context}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-lg font-bold text-green-700">$0.55</span>
                              <span className="text-xs text-gray-500">~3-5 min</span>
                            </div>
                            
                            <button
                              onClick={() => router.push(`/judge/requests/${request.id}`)}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group/btn"
                            >
                              Start Verdict
                              <ArrowRight className="h-4 w-4 inline ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Verdicts & Performance Summary */}
        {profile?.is_judge && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* My Verdicts */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {stats.verdicts_given > 0 ? 'Your Verdict History' : 'My Verdicts'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stats.verdicts_given > 0 
                          ? `${stats.verdicts_given} verdict${stats.verdicts_given !== 1 ? 's' : ''} completed`
                          : 'Track your submissions and ratings'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/judge/my-verdicts')}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
                  >
                    {stats.verdicts_given > 0 ? 'View All' : 'View Verdicts'}
                    <ArrowRight className="h-4 w-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                {stats.verdicts_given > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.verdicts_given}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.recent_verdicts}</div>
                      <div className="text-xs text-gray-500">This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Rating</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pro Tips */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full filter blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">
                    Pro Tips for Higher Ratings
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
                    <p className="text-sm text-white/90">
                      Be specific and constructive - avoid generic feedback
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
                    <p className="text-sm text-white/90">
                      Reference the context and show you understand their situation
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
                    <p className="text-sm text-white/90">
                      Give actionable advice, not just opinions
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
                    <p className="text-sm text-white/90">
                      Aim for 100+ characters for detailed, helpful responses
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-xs text-white/80">
                    💡 High-quality verdicts unlock premium requests with higher pay!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Styling & Animations */}
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
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
