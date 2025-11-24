'use client';

import { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp } from 'lucide-react';

interface Verdict {
  id: string;
  rating: number | null;
  feedback: string;
  tone: 'honest' | 'constructive' | 'encouraging';
  created_at: string;
  helpful_count?: number;
}

interface VerdictSummaryProps {
  verdicts: Verdict[];
  category?: string;
  className?: string;
}

type SortOption = 'helpful' | 'rating-high' | 'rating-low' | 'recent' | 'diverse';

export function VerdictSummary({ verdicts, category, className = '' }: VerdictSummaryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('helpful');

  // Calculate consensus statistics
  const stats = useMemo(() => {
    if (verdicts.length === 0) return null;

    const ratingsWithValue = verdicts.filter(v => v.rating !== null) as (Verdict & { rating: number })[];
    const avgRating = ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, v) => sum + v.rating, 0) / ratingsWithValue.length
      : 0;

    // Simple sentiment analysis based on ratings
    const positive = ratingsWithValue.filter(v => v.rating >= 7).length;
    const neutral = ratingsWithValue.filter(v => v.rating >= 4 && v.rating < 7).length;
    const negative = ratingsWithValue.filter(v => v.rating < 4).length;

    // Determine consensus level
    const maxGroup = Math.max(positive, neutral, negative);
    const consensusPercent = (maxGroup / ratingsWithValue.length) * 100;
    const hasConsensus = consensusPercent >= 60;
    const isDivided = Math.abs(positive - negative) <= 2 && positive + negative > neutral;

    return {
      avgRating: avgRating.toFixed(1),
      positive,
      neutral,
      negative,
      hasConsensus,
      isDivided,
      total: verdicts.length,
    };
  }, [verdicts]);

  // Sort verdicts
  const sortedVerdicts = useMemo(() => {
    const sorted = [...verdicts];

    switch (sortBy) {
      case 'helpful':
        return sorted.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      case 'rating-high':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-low':
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'diverse':
        // Show most contrasting opinions first
        const avg = stats ? parseFloat(stats.avgRating) : 5;
        return sorted.sort((a, b) => {
          const aDiff = Math.abs((a.rating || avg) - avg);
          const bDiff = Math.abs((b.rating || avg) - avg);
          return bDiff - aDiff;
        });
      default:
        return sorted;
    }
  }, [verdicts, sortBy, stats]);

  if (!stats || verdicts.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verdict Summary</h3>

        {/* Consensus Indicator */}
        {stats.hasConsensus && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-100 rounded-lg border border-green-300">
            <TrendingUp className="w-5 h-5 text-green-700" />
            <p className="text-sm font-medium text-green-800">
              <strong>Strong consensus</strong> - Most judges agree on this one
            </p>
          </div>
        )}

        {stats.isDivided && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
            <p className="text-sm font-medium text-yellow-800">
              <strong>Consider both sides</strong> - Judges have contrasting viewpoints
            </p>
          </div>
        )}

        {/* Rating Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.positive}</span>
            </div>
            <p className="text-xs text-gray-600">Positive (7-10)</p>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl font-bold text-gray-600">{stats.neutral}</span>
            </div>
            <p className="text-xs text-gray-600">Neutral (4-6)</p>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.negative}</span>
            </div>
            <p className="text-xs text-gray-600">Negative (1-3)</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Average Rating</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.avgRating}/10</p>
        </div>
      </div>

      {/* Sorting Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Sort by:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSortBy('helpful')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'helpful'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Most Helpful First
          </button>
          <button
            onClick={() => setSortBy('diverse')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'diverse'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            See Different Viewpoints
          </button>
          <button
            onClick={() => setSortBy('rating-high')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'rating-high'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Highest Rating
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'recent'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Most Recent
          </button>
        </div>
      </div>

      {/* Verdicts List */}
      <div className="space-y-4">
        {sortedVerdicts.map((verdict, index) => {
          const isExtremeOpinion = verdict.rating && stats.avgRating
            ? Math.abs(verdict.rating - parseFloat(stats.avgRating)) > 2
            : false;

          return (
            <div
              key={verdict.id}
              className={`bg-white rounded-lg p-5 border-2 transition ${
                isExtremeOpinion && sortBy === 'diverse'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {verdict.rating && (
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        verdict.rating >= 7
                          ? 'bg-green-100 text-green-800'
                          : verdict.rating >= 4
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {verdict.rating}/10
                    </div>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      verdict.tone === 'honest'
                        ? 'bg-blue-100 text-blue-700'
                        : verdict.tone === 'constructive'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {verdict.tone}
                  </span>
                </div>

                {isExtremeOpinion && sortBy === 'diverse' && (
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    Different perspective
                  </span>
                )}
              </div>

              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {verdict.feedback}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(verdict.created_at).toLocaleDateString()}</span>
                {verdict.helpful_count !== undefined && verdict.helpful_count > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="w-3 h-3" />
                    {verdict.helpful_count} found helpful
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
