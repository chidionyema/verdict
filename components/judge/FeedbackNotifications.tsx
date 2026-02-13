'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  Star,
  TrendingUp,
  X,
  Award,
  Sparkles,
  Heart,
  ChevronRight,
} from 'lucide-react';

interface FeedbackNotification {
  id: string;
  type: 'helpful_vote' | 'quality_star' | 'weekly_summary' | 'improvement_tip';
  title: string;
  message: string;
  timestamp?: string;
  data?: {
    count?: number;
    category?: string;
    rating?: number;
  };
}

interface FeedbackNotificationsProps {
  notifications: FeedbackNotification[];
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * Shows feedback loop notifications to judges
 * "Your verdict was helpful!" when voted up
 * Weekly summaries of impact
 * Quality tips for improvement
 */
export function FeedbackNotifications({
  notifications,
  onDismiss,
  className = '',
}: FeedbackNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<FeedbackNotification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, 3)); // Show max 3 at once
  }, [notifications]);

  const getNotificationConfig = (type: FeedbackNotification['type']) => {
    switch (type) {
      case 'helpful_vote':
        return {
          icon: ThumbsUp,
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
        };
      case 'quality_star':
        return {
          icon: Star,
          gradient: 'from-yellow-500 to-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
        };
      case 'weekly_summary':
        return {
          icon: TrendingUp,
          gradient: 'from-indigo-500 to-purple-500',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          iconColor: 'text-indigo-600',
        };
      case 'improvement_tip':
        return {
          icon: Sparkles,
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
        };
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => {
          const config = getNotificationConfig(notification.type);
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 relative overflow-hidden`}
            >
              {/* Gradient accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />

              <div className="flex items-start gap-3 pl-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>

                  {/* Additional data display */}
                  {notification.data && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {notification.data.count !== undefined && (
                        <span className={`text-xs font-medium ${config.iconColor} bg-white/80 px-2 py-0.5 rounded-full`}>
                          {notification.data.count} {notification.data.count === 1 ? 'person' : 'people'}
                        </span>
                      )}
                      {notification.data.category && (
                        <span className="text-xs font-medium text-gray-500 bg-white/80 px-2 py-0.5 rounded-full capitalize">
                          {notification.data.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onDismiss(notification.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Weekly impact summary banner
 */
interface WeeklyImpactBannerProps {
  helpfulVotes: number;
  verdictsGiven: number;
  topCategory?: string;
  onDismiss: () => void;
  className?: string;
}

export function WeeklyImpactBanner({
  helpfulVotes,
  verdictsGiven,
  topCategory,
  onDismiss,
  className = '',
}: WeeklyImpactBannerProps) {
  if (helpfulVotes === 0 && verdictsGiven === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden ${className}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
      </div>

      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-6 w-6" />
          <h3 className="text-lg font-bold">Your Weekly Impact</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{verdictsGiven}</p>
            <p className="text-xs text-white/80">Verdicts given</p>
          </div>
          <div className="text-center border-x border-white/20">
            <p className="text-3xl font-bold">{helpfulVotes}</p>
            <p className="text-xs text-white/80">Helpful votes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Heart className="h-5 w-5" />
              <span className="text-lg font-bold capitalize">{topCategory || 'All'}</span>
            </div>
            <p className="text-xs text-white/80">Top category</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/90 text-center">
          {helpfulVotes > 0 ? (
            <>
              <strong>{helpfulVotes} {helpfulVotes === 1 ? 'person' : 'people'}</strong> found your feedback valuable this week!
            </>
          ) : (
            <>Keep giving great verdicts - your impact adds up!</>
          )}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Quality score explanation component
 */
interface QualityScoreExplanationProps {
  currentScore: number | null;
  previousScore?: number | null;
  factors?: {
    clarity: number;
    helpfulness: number;
    actionability: number;
    thoroughness: number;
  };
  className?: string;
}

export function QualityScoreExplanation({
  currentScore,
  previousScore,
  factors,
  className = '',
}: QualityScoreExplanationProps) {
  const getScoreTrend = () => {
    if (!currentScore || !previousScore) return null;
    const diff = currentScore - previousScore;
    if (diff > 0.1) return { direction: 'up', value: diff };
    if (diff < -0.1) return { direction: 'down', value: Math.abs(diff) };
    return { direction: 'stable', value: 0 };
  };

  const trend = getScoreTrend();

  const getImprovementTips = () => {
    if (!factors) return [];
    const tips = [];
    if (factors.clarity < 8) tips.push('Be more specific in your recommendations');
    if (factors.helpfulness < 8) tips.push('Focus on actionable suggestions');
    if (factors.actionability < 8) tips.push('Include concrete next steps');
    if (factors.thoroughness < 8) tips.push('Address all aspects of the request');
    return tips.slice(0, 2); // Max 2 tips
  };

  const tips = getImprovementTips();

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Quality Score Breakdown
        </h3>
        {trend && (
          <span className={`text-sm font-medium flex items-center gap-1 ${
            trend.direction === 'up' ? 'text-green-600' :
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {trend.value.toFixed(1)}
          </span>
        )}
      </div>

      {/* Current Score */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">
            {currentScore ? currentScore.toFixed(1) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">out of 10</p>
        </div>
      </div>

      {/* Factor breakdown */}
      {factors && (
        <div className="space-y-3 mb-4">
          {Object.entries(factors).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 capitalize">{key}</span>
                <span className="font-medium text-gray-900">{value.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    value >= 9 ? 'bg-green-500' :
                    value >= 8 ? 'bg-blue-500' :
                    value >= 7 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Improvement tips */}
      {tips.length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Tips to improve
          </p>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-indigo-700 flex items-start gap-1.5">
                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
