'use client';

import { Activity, Zap, Target, ThumbsUp, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import type { JudgeStats } from './types';

interface PerformanceMetricsProps {
  stats: JudgeStats;
}

// Helper to get speed tier
function getSpeedTier(avgMinutes: number | null): { label: string; color: string; percentile?: number } {
  if (!avgMinutes) return { label: 'N/A', color: 'gray' };
  if (avgMinutes < 3) return { label: 'Lightning', color: 'purple', percentile: 99 };
  if (avgMinutes < 5) return { label: 'Fast', color: 'green', percentile: 90 };
  if (avgMinutes < 10) return { label: 'Quick', color: 'blue', percentile: 75 };
  if (avgMinutes < 15) return { label: 'Steady', color: 'amber', percentile: 50 };
  return { label: 'Relaxed', color: 'gray', percentile: 25 };
}

// Helper to get quality tier
function getQualityTier(score: number | null): { label: string; color: string; emoji: string } {
  if (!score) return { label: 'Unrated', color: 'gray', emoji: '' };
  if (score >= 9.5) return { label: 'Exceptional', color: 'purple', emoji: '' };
  if (score >= 9) return { label: 'Excellent', color: 'green', emoji: '' };
  if (score >= 8) return { label: 'Great', color: 'blue', emoji: '' };
  if (score >= 7) return { label: 'Good', color: 'amber', emoji: '' };
  return { label: 'Improving', color: 'gray', emoji: '' };
}

export function PerformanceMetrics({ stats }: PerformanceMetricsProps) {
  const speedTier = getSpeedTier(stats.response_time_avg);
  const qualityTier = getQualityTier(stats.average_quality_score);

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-600" />
        Performance Metrics
      </h3>

      <div className="space-y-4">
        {/* Verdicts Today with goal indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Verdicts Today</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{stats.verdicts_today}</span>
            {stats.verdicts_today >= 5 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold"
              >
                Goal Met!
              </motion.span>
            )}
          </div>
        </div>

        {/* Quality Score - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              Quality Score
              <span className="relative group">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Based on seeker ratings
                </span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : 'N/A'}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses[qualityTier.color].bg} ${colorClasses[qualityTier.color].text}`}>
                {qualityTier.label}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  stats.average_quality_score && i < Math.round(stats.average_quality_score)
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Response Time - Enhanced with percentile */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Response Time
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {stats.response_time_avg ? `${Math.round(stats.response_time_avg)}m` : 'N/A'}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses[speedTier.color].bg} ${colorClasses[speedTier.color].text}`}>
              {speedTier.label}
            </span>
          </div>
        </div>

        {/* Accuracy/Helpfulness - NEW */}
        {(stats.helpful_votes ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
              Helpful Votes
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{stats.helpful_votes}</span>
              {(stats.weekly_helpful_votes ?? 0) > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  +{stats.weekly_helpful_votes} this week
                </span>
              )}
            </div>
          </div>
        )}

        {/* Completion Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-indigo-500" />
            Completion Rate
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {stats.completion_rate ? `${Math.round(stats.completion_rate)}%` : 'N/A'}
            </span>
            {stats.completion_rate >= 95 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                Reliable
              </span>
            )}
          </div>
        </div>

        {/* Best Category */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Best Category</span>
          <span className="text-sm font-semibold text-indigo-600 capitalize flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {stats.best_category}
          </span>
        </div>
      </div>

      {/* Performance Tips - Contextual */}
      {stats.average_quality_score && stats.average_quality_score < 8 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Tip:</strong> Quality scores improve with specific, actionable feedback. Try adding 2-3 concrete suggestions in each verdict.
          </p>
        </div>
      )}
    </div>
  );
}
