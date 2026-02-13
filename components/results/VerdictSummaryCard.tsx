'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { VerdictResponse } from '@/lib/database.types';

interface VerdictSummaryCardProps {
  verdicts: VerdictResponse[];
  category?: string;
  className?: string;
}

type ConsensusType = 'positive' | 'negative' | 'mixed';

interface ThemeExtraction {
  theme: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export function VerdictSummaryCard({ verdicts, className = '' }: VerdictSummaryCardProps) {
  // Calculate consensus and key metrics
  const analysis = useMemo(() => {
    if (verdicts.length === 0) return null;

    const ratings = verdicts
      .filter((v) => v.rating !== null && v.rating !== undefined)
      .map((v) => v.rating as number);

    if (ratings.length === 0) return null;

    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const highRatings = ratings.filter((r) => r >= 7).length;
    const lowRatings = ratings.filter((r) => r <= 4).length;
    const neutralRatings = ratings.filter((r) => r > 4 && r < 7).length;

    // Determine consensus
    let consensus: ConsensusType = 'mixed';
    let consensusStrength = 0;

    if (highRatings >= ratings.length * 0.6) {
      consensus = 'positive';
      consensusStrength = highRatings / ratings.length;
    } else if (lowRatings >= ratings.length * 0.6) {
      consensus = 'negative';
      consensusStrength = lowRatings / ratings.length;
    } else {
      consensus = 'mixed';
      consensusStrength = Math.max(highRatings, lowRatings, neutralRatings) / ratings.length;
    }

    // Extract themes from feedback using simple keyword analysis
    const themes: ThemeExtraction[] = [];
    const positiveKeywords = [
      'good',
      'great',
      'excellent',
      'love',
      'perfect',
      'amazing',
      'strong',
      'clear',
      'professional',
      'confident',
    ];
    const negativeKeywords = [
      'improve',
      'change',
      'consider',
      'issue',
      'problem',
      'weak',
      'unclear',
      'avoid',
      'try',
      'better',
    ];
    const suggestionKeywords = [
      'suggest',
      'recommend',
      'try',
      'consider',
      'maybe',
      'could',
      'should',
      'might',
      'would',
    ];

    const allFeedback = verdicts.map((v) => (v.feedback || '').toLowerCase()).join(' ');

    // Count keyword occurrences
    let positiveCount = 0;
    let negativeCount = 0;
    let suggestionCount = 0;

    positiveKeywords.forEach((kw) => {
      const matches = (allFeedback.match(new RegExp(kw, 'gi')) || []).length;
      positiveCount += matches;
    });

    negativeKeywords.forEach((kw) => {
      const matches = (allFeedback.match(new RegExp(kw, 'gi')) || []).length;
      negativeCount += matches;
    });

    suggestionKeywords.forEach((kw) => {
      const matches = (allFeedback.match(new RegExp(kw, 'gi')) || []).length;
      suggestionCount += matches;
    });

    if (positiveCount > 0) {
      themes.push({ theme: 'Positive feedback', count: positiveCount, sentiment: 'positive' });
    }
    if (negativeCount > 0) {
      themes.push({ theme: 'Areas for improvement', count: negativeCount, sentiment: 'negative' });
    }
    if (suggestionCount > 0) {
      themes.push({ theme: 'Actionable suggestions', count: suggestionCount, sentiment: 'neutral' });
    }

    // Generate recommendation based on consensus and themes
    let recommendation = '';
    if (consensus === 'positive') {
      recommendation =
        avgRating >= 8
          ? "You're on the right track! The judges strongly support your approach."
          : 'Good direction overall. Consider the minor suggestions to make it even better.';
    } else if (consensus === 'negative') {
      recommendation =
        'The feedback suggests significant changes. Review each verdict carefully and consider iterating.';
    } else {
      recommendation =
        "Mixed opinions indicate this is subjective. Consider what resonates most with your goals.";
    }

    return {
      avgRating,
      consensus,
      consensusStrength,
      highRatings,
      lowRatings,
      neutralRatings,
      themes: themes.sort((a, b) => b.count - a.count).slice(0, 3),
      recommendation,
      totalVerdicts: verdicts.length,
    };
  }, [verdicts]);

  if (!analysis) return null;

  const consensusConfig = {
    positive: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      gradient: 'from-green-50 to-emerald-50',
      label: 'Positive Consensus',
      emoji: '🎉',
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      gradient: 'from-red-50 to-orange-50',
      label: 'Needs Improvement',
      emoji: '🔄',
    },
    mixed: {
      icon: Minus,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      gradient: 'from-amber-50 to-yellow-50',
      label: 'Mixed Opinions',
      emoji: '🤔',
    },
  };

  const config = consensusConfig[analysis.consensus];
  const ConsensusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${config.gradient} rounded-2xl border ${config.borderColor} p-6 ${className}`}
    >
      {/* Header with consensus */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
            <span className="text-2xl">{config.emoji}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Verdict Summary</h3>
            <div className={`flex items-center gap-1.5 ${config.color}`}>
              <ConsensusIcon className="h-4 w-4" />
              <span className="font-medium text-sm">{config.label}</span>
              <span className="text-xs text-gray-500">
                ({Math.round(analysis.consensusStrength * 100)}% agreement)
              </span>
            </div>
          </div>
        </div>

        {/* Average Rating Badge */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${config.color}`}>{analysis.avgRating.toFixed(1)}</div>
          <div className="text-xs text-gray-500">avg. rating</div>
        </div>
      </div>

      {/* Visual Rating Distribution */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Rating distribution</span>
          <span>{analysis.totalVerdicts} verdicts</span>
        </div>
        <div className="h-4 bg-white rounded-full overflow-hidden flex border border-gray-200">
          {analysis.highRatings > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(analysis.highRatings / analysis.totalVerdicts) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-green-500 h-full"
              title={`${analysis.highRatings} positive (7-10)`}
            />
          )}
          {analysis.neutralRatings > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(analysis.neutralRatings / analysis.totalVerdicts) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-amber-400 h-full"
              title={`${analysis.neutralRatings} neutral (5-6)`}
            />
          )}
          {analysis.lowRatings > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(analysis.lowRatings / analysis.totalVerdicts) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-red-400 h-full"
              title={`${analysis.lowRatings} negative (1-4)`}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Positive ({analysis.highRatings})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            Neutral ({analysis.neutralRatings})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            Negative ({analysis.lowRatings})
          </span>
        </div>
      </div>

      {/* Key Themes */}
      {analysis.themes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Themes
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((theme, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  theme.sentiment === 'positive'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : theme.sentiment === 'negative'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {theme.theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Recommendation</h4>
            <p className="text-sm text-gray-700">{analysis.recommendation}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
