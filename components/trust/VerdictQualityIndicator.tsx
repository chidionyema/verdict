'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, CheckCircle, AlertTriangle, Star, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface VerdictQualityIndicatorProps {
  verdictId: string;
  qualityScore?: number; // 0-100
  helpfulCount?: number;
  unhelpfulCount?: number;
  currentUserVote?: 'helpful' | 'unhelpful' | null;
  isHighQuality?: boolean;
  onVote?: (vote: 'helpful' | 'unhelpful') => Promise<void>;
  onFlag?: () => void;
  className?: string;
  compact?: boolean;
}

export function VerdictQualityIndicator({
  verdictId,
  qualityScore,
  helpfulCount = 0,
  unhelpfulCount = 0,
  currentUserVote = null,
  isHighQuality = false,
  onVote,
  onFlag,
  className = '',
  compact = false,
}: VerdictQualityIndicatorProps) {
  const [localVote, setLocalVote] = useState<'helpful' | 'unhelpful' | null>(currentUserVote);
  const [localHelpful, setLocalHelpful] = useState(helpfulCount);
  const [localUnhelpful, setLocalUnhelpful] = useState(unhelpfulCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (vote: 'helpful' | 'unhelpful') => {
    if (isSubmitting || localVote === vote) return;

    const previousVote = localVote;
    const previousHelpful = localHelpful;
    const previousUnhelpful = localUnhelpful;

    // Optimistic update
    setLocalVote(vote);
    if (vote === 'helpful') {
      setLocalHelpful(prev => prev + 1);
      if (previousVote === 'unhelpful') {
        setLocalUnhelpful(prev => Math.max(0, prev - 1));
      }
    } else {
      setLocalUnhelpful(prev => prev + 1);
      if (previousVote === 'helpful') {
        setLocalHelpful(prev => Math.max(0, prev - 1));
      }
    }

    if (onVote) {
      setIsSubmitting(true);
      try {
        await onVote(vote);
        toast.success(`Marked as ${vote}`);
      } catch (error) {
        // Rollback on error
        setLocalVote(previousVote);
        setLocalHelpful(previousHelpful);
        setLocalUnhelpful(previousUnhelpful);
        toast.error('Failed to submit vote');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFlag = () => {
    if (onFlag) {
      onFlag();
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Quality Badge */}
        {isHighQuality && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Quality
          </span>
        )}

        {/* Helpful Count */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={() => handleVote('helpful')}
            disabled={isSubmitting}
            className={`flex items-center gap-1 p-1 rounded transition ${
              localVote === 'helpful'
                ? 'text-green-600 bg-green-50'
                : 'hover:text-green-600 hover:bg-green-50'
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${localVote === 'helpful' ? 'fill-current' : ''}`} />
            <span>{localHelpful}</span>
          </button>
          <button
            onClick={() => handleVote('unhelpful')}
            disabled={isSubmitting}
            className={`flex items-center gap-1 p-1 rounded transition ${
              localVote === 'unhelpful'
                ? 'text-red-600 bg-red-50'
                : 'hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${localVote === 'unhelpful' ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left: Quality Indicators */}
        <div className="flex items-center gap-3">
          {/* Quality Score */}
          {qualityScore !== undefined && (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                qualityScore >= 80
                  ? 'bg-green-100 text-green-700'
                  : qualityScore >= 60
                  ? 'bg-blue-100 text-blue-700'
                  : qualityScore >= 40
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{qualityScore}%</p>
                <p className="text-xs text-gray-500">Quality Score</p>
              </div>
            </div>
          )}

          {/* High Quality Badge */}
          {isHighQuality && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">High Quality</span>
            </div>
          )}
        </div>

        {/* Right: Voting & Actions */}
        <div className="flex items-center gap-2">
          {/* Helpful Button */}
          <button
            onClick={() => handleVote('helpful')}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition ${
              localVote === 'helpful'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${localVote === 'helpful' ? 'fill-current' : ''}`} />
            <span>Helpful</span>
            {localHelpful > 0 && <span className="ml-1 text-xs">({localHelpful})</span>}
          </button>

          {/* Not Helpful Button */}
          <button
            onClick={() => handleVote('unhelpful')}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition ${
              localVote === 'unhelpful'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
            }`}
          >
            <ThumbsDown className={`h-4 w-4 ${localVote === 'unhelpful' ? 'fill-current' : ''}`} />
          </button>

          {/* Flag Button */}
          {onFlag && (
            <button
              onClick={handleFlag}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Report this verdict"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Helpfulness Summary */}
      {localHelpful > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {localHelpful} {localHelpful === 1 ? 'person' : 'people'} found this verdict helpful
          </p>
        </div>
      )}
    </div>
  );
}

// Sorting utility for verdicts by helpfulness
export function sortVerdictsByHelpfulness<T extends { helpfulCount?: number; unhelpfulCount?: number }>(
  verdicts: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...verdicts].sort((a, b) => {
    const aScore = (a.helpfulCount || 0) - (a.unhelpfulCount || 0);
    const bScore = (b.helpfulCount || 0) - (b.unhelpfulCount || 0);
    return order === 'desc' ? bScore - aScore : aScore - bScore;
  });
}
