'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Medal,
  Users,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';

interface PerformanceData {
  profile: {
    judge_tier: string;
    judge_rating: number;
    total_verdicts: number;
    rank: number | null;
  };
  tier_info: {
    current_tier: string;
    tier_points: number;
    next_tier_threshold: number;
    tier_achieved_at: string;
    priority_queue_access: boolean;
    bonus_credits_per_verdict: number;
    featured_judge: boolean;
    mentor_status: boolean;
  } | null;
  current_week_stats: {
    verdicts_submitted: number;
    average_user_rating: number;
    helpfulness_score: number;
  };
  recent_ratings: any[];
  leaderboard_position: number | null;
}

const TIER_CONFIG = {
  bronze: { color: '#CD7F32', label: 'Bronze Judge', icon: '🥉' },
  silver: { color: '#C0C0C0', label: 'Silver Judge', icon: '🥈' },
  gold: { color: '#FFD700', label: 'Gold Judge', icon: '🥇' },
  platinum: { color: '#E5E4E2', label: 'Platinum Judge', icon: '💎' },
  diamond: { color: '#B9F2FF', label: 'Diamond Judge', icon: '💎' },
};

export default function JudgePerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/judge/performance');
      if (!response.ok) {
        if (response.status === 403) {
          setError('You need to be a qualified judge to view this page.');
        } else {
          throw new Error('Failed to load performance data');
        }
        return;
      }

      const performanceData = await response.json();
      setData(performanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = '#6366f1' 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No performance data available.</p>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[data.profile.judge_tier as keyof typeof TIER_CONFIG];
  const tierProgress = data.tier_info 
    ? (data.tier_info.tier_points / data.tier_info.next_tier_threshold) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Judge Performance</h1>
          <p className="text-gray-600">Track your progress and see how you&apos;re helping the community</p>
        </div>

        {/* Tier Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{tierConfig.icon}</span>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: tierConfig.color }}>
                  {tierConfig.label}
                </h2>
                <p className="text-gray-600">
                  Rank #{data.leaderboard_position || 'Unranked'} • {data.profile.total_verdicts} verdicts delivered
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {data.profile.judge_rating.toFixed(1)}/5.0
              </div>
              <p className="text-sm text-gray-500">Overall Rating</p>
            </div>
          </div>

          {data.tier_info && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Tier Progress</span>
                <span>{data.tier_info.tier_points} / {data.tier_info.next_tier_threshold} points</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, tierProgress)}%`,
                    backgroundColor: tierConfig.color 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Current: {data.profile.judge_tier}</span>
                <span>Next tier: {tierProgress >= 100 ? 'Max tier reached!' : `${Math.round(100 - tierProgress)}% to go`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="This Week"
            value={data.current_week_stats.verdicts_submitted}
            subtitle="Verdicts submitted"
            icon={MessageSquare}
            color="#10b981"
          />
          
          <StatCard
            title="User Rating"
            value={data.current_week_stats.average_user_rating.toFixed(1)}
            subtitle="Average this week"
            icon={Star}
            color="#f59e0b"
          />
          
          <StatCard
            title="Helpfulness"
            value={data.current_week_stats.helpfulness_score.toFixed(1)}
            subtitle="Score this week"
            icon={ThumbsUp}
            color="#3b82f6"
          />
          
          <StatCard
            title="Total Impact"
            value={data.profile.total_verdicts}
            subtitle="People helped"
            icon={Users}
            color="#8b5cf6"
          />
        </div>

        {/* Tier Benefits */}
        {data.tier_info && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Your Tier Benefits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg ${data.tier_info.priority_queue_access ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                <Clock className="h-5 w-5 mb-2" />
                <p className="text-sm font-medium">Priority Queue</p>
                <p className="text-xs">{data.tier_info.priority_queue_access ? 'Active' : 'Locked'}</p>
              </div>
              
              <div className={`p-3 rounded-lg ${data.tier_info.bonus_credits_per_verdict > 0 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                <Award className="h-5 w-5 mb-2" />
                <p className="text-sm font-medium">Bonus Credits</p>
                <p className="text-xs">+{data.tier_info.bonus_credits_per_verdict} per verdict</p>
              </div>
              
              <div className={`p-3 rounded-lg ${data.tier_info.featured_judge ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                <Medal className="h-5 w-5 mb-2" />
                <p className="text-sm font-medium">Featured Judge</p>
                <p className="text-xs">{data.tier_info.featured_judge ? 'Active' : 'Not Yet'}</p>
              </div>
              
              <div className={`p-3 rounded-lg ${data.tier_info.mentor_status ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                <Trophy className="h-5 w-5 mb-2" />
                <p className="text-sm font-medium">Mentor Status</p>
                <p className="text-xs">{data.tier_info.mentor_status ? 'Active' : 'Not Yet'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Ratings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent User Ratings</h3>
          {data.recent_ratings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No ratings yet. Keep providing great verdicts to receive feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recent_ratings.slice(0, 5).map((rating, index) => (
                <div key={rating.id || index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < rating.overall_rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-medium">{rating.overall_rating}/5</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Helpful:</span>
                      <span className="ml-1 font-medium">{rating.helpfulness_rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Accurate:</span>
                      <span className="ml-1 font-medium">{rating.accuracy_rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Constructive:</span>
                      <span className="ml-1 font-medium">{rating.constructiveness_rating}/5</span>
                    </div>
                  </div>
                  
                  {rating.feedback_text && (
                    <p className="text-gray-700 text-sm italic border-l-4 border-gray-200 pl-3">
                      &quot;{rating.feedback_text}&quot;
                    </p>
                  )}
                  
                  {rating.would_recommend_judge && (
                    <div className="mt-2 flex items-center text-green-600 text-sm">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      <span>Would recommend you to others</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}