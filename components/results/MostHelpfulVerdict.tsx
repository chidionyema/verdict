'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, User, Sparkles, Crown } from 'lucide-react';
import type { VerdictResponse } from '@/lib/database.types';

interface VerdictWithNumber extends VerdictResponse {
  judge_number: number;
  reviewer_info?: {
    user_id: string;
    reputation_score: number;
    is_expert: boolean;
    expert_title?: string;
  };
}

interface MostHelpfulVerdictProps {
  verdicts: VerdictWithNumber[];
  verdictInteractions: Record<string, { helpful: boolean; bookmarked: boolean }>;
  className?: string;
}

export function MostHelpfulVerdict({
  verdicts,
  verdictInteractions,
  className = '',
}: MostHelpfulVerdictProps) {
  // Find the most helpful verdict based on multiple factors
  const mostHelpful = useMemo(() => {
    if (verdicts.length === 0) return null;

    // Score each verdict
    const scoredVerdicts = verdicts.map((v) => {
      let score = 0;

      // User marked as helpful (+3)
      if (verdictInteractions[v.id]?.helpful) {
        score += 3;
      }

      // High rating (+2 for 8+, +1 for 6-7)
      if (v.rating && v.rating >= 8) {
        score += 2;
      } else if (v.rating && v.rating >= 6) {
        score += 1;
      }

      // Expert reviewer (+2)
      if (v.reviewer_info?.is_expert) {
        score += 2;
      }

      // High reputation score (+1 if above 80)
      if (v.reviewer_info?.reputation_score && v.reviewer_info.reputation_score > 80) {
        score += 1;
      }

      // Feedback length (detailed feedback is usually more helpful)
      const feedbackLength = (v.feedback || '').length;
      if (feedbackLength > 500) {
        score += 2;
      } else if (feedbackLength > 200) {
        score += 1;
      }

      // Encouraging tone slightly preferred for "helpful"
      if (v.tone === 'encouraging') {
        score += 0.5;
      }

      return { verdict: v, score };
    });

    // Sort by score and return the top one
    scoredVerdicts.sort((a, b) => b.score - a.score);
    return scoredVerdicts[0]?.verdict;
  }, [verdicts, verdictInteractions]);

  if (!mostHelpful) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl" />
      <div className="absolute inset-[2px] bg-white rounded-2xl" />

      <div className="relative p-6">
        {/* Header badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Most Helpful Verdict</h3>
              <p className="text-xs text-gray-500">Featured feedback based on quality and detail</p>
            </div>
          </div>

          {mostHelpful.rating && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
              <Star className="h-4 w-4 text-amber-500 fill-current" />
              <span className="font-bold text-amber-700">{mostHelpful.rating}/10</span>
            </div>
          )}
        </div>

        {/* Judge info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {mostHelpful.reviewer_info?.expert_title || `Judge #${mostHelpful.judge_number}`}
              </span>
              {mostHelpful.reviewer_info?.is_expert && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Expert
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  mostHelpful.tone === 'encouraging'
                    ? 'bg-green-100 text-green-700'
                    : mostHelpful.tone === 'honest'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {mostHelpful.tone}
              </span>
              <span>{new Date(mostHelpful.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Feedback content */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {mostHelpful.feedback}
          </p>
        </div>

        {/* Helpful indicator */}
        {verdictInteractions[mostHelpful.id]?.helpful && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <ThumbsUp className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">You found this helpful</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
