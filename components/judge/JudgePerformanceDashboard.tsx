'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Award, 
  Target,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface JudgePerformanceData {
  judgeId: string;
  judgeName: string;
  totalJudgments: number;
  totalRatings: number;
  averageRating: number;
  currentStreak: number;
  tier: string;
  qualityPercentage: number;
  recentRatings: number;
  recentAvgRating: number;
  ratingDistribution: {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
  recentFeedback: Array<{
    id: string;
    rating: number;
    comment?: string;
    requestTitle: string;
    timestamp: string;
  }>;
}

interface JudgePerformanceDashboardProps {
  judgeId: string;
  className?: string;
}

export function JudgePerformanceDashboard({ 
  judgeId, 
  className = '' 
}: JudgePerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<JudgePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadPerformanceData();
  }, [judgeId, timeframe]);

  const loadPerformanceData = async () => {
    try {
      const response = await fetch(`/api/judge/performance?judgeId=${judgeId}&timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <p className="text-gray-500 text-center">No performance data available</p>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-green-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 3.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPerformanceInsight = (data: JudgePerformanceData) => {
    const { averageRating, recentAvgRating, qualityPercentage, totalRatings } = data;
    
    if (totalRatings === 0) {
      return {
        type: 'info',
        icon: MessageSquare,
        title: 'Get started!',
        message: 'Complete more judgments to see your performance feedback.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }

    if (averageRating >= 4.5 && qualityPercentage >= 80) {
      return {
        type: 'excellent',
        icon: Award,
        title: 'Excellent work!',
        message: 'Your feedback quality is outstanding. Keep it up!',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }

    if (recentAvgRating > averageRating + 0.5) {
      return {
        type: 'improving',
        icon: TrendingUp,
        title: 'Great improvement!',
        message: 'Your recent feedback is getting better ratings.',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      };
    }

    if (averageRating < 3.0 || qualityPercentage < 60) {
      return {
        type: 'needs-improvement',
        icon: AlertTriangle,
        title: 'Room for improvement',
        message: 'Focus on providing more detailed, helpful feedback.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }

    return {
      type: 'good',
      icon: ThumbsUp,
      title: 'Good progress!',
      message: 'Your feedback is helping requesters. Keep improving!',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    };
  };

  const insight = getPerformanceInsight(performanceData);
  const IconComponent = insight.icon;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Feedback Performance</h3>
            <p className="text-sm text-gray-500">See how requesters rate your feedback</p>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="week">Past week</option>
            <option value="month">Past month</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                {performanceData.averageRating.toFixed(1)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Average rating</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {performanceData.totalRatings}
            </div>
            <div className="text-xs text-gray-500">Total ratings</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {performanceData.qualityPercentage}%
            </div>
            <div className="text-xs text-gray-500">Quality score</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {performanceData.currentStreak}
            </div>
            <div className="text-xs text-gray-500">Day streak</div>
          </div>
        </div>

        {/* Performance Insight */}
        <div className={`p-4 rounded-lg ${insight.bgColor} mb-6`}>
          <div className="flex items-center gap-3">
            <IconComponent className={`h-5 w-5 ${insight.color}`} />
            <div>
              <h4 className={`font-medium ${insight.color}`}>{insight.title}</h4>
              <p className="text-sm text-gray-700">{insight.message}</p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {performanceData.totalRatings > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Rating Distribution
            </h4>
            <div className="space-y-2">
              {[
                { stars: 5, count: performanceData.ratingDistribution.fiveStars, color: 'bg-green-500' },
                { stars: 4, count: performanceData.ratingDistribution.fourStars, color: 'bg-green-400' },
                { stars: 3, count: performanceData.ratingDistribution.threeStars, color: 'bg-yellow-400' },
                { stars: 2, count: performanceData.ratingDistribution.twoStars, color: 'bg-orange-400' },
                { stars: 1, count: performanceData.ratingDistribution.oneStar, color: 'bg-red-400' }
              ].map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating.stars}</span>
                    <Star className="h-3 w-3 text-yellow-500" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${rating.color}`}
                      style={{
                        width: `${(rating.count / performanceData.totalRatings) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{rating.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {performanceData.recentFeedback.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Feedback on Your Reviews
            </h4>
            <div className="space-y-3">
              {performanceData.recentFeedback.slice(0, 3).map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= feedback.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {feedback.requestTitle}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(feedback.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}