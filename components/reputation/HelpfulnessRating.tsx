'use client';

import { useState } from 'react';
import { Star, Check, AlertCircle } from 'lucide-react';
import { reputationManager } from '@/lib/reputation';
import { toast } from '@/components/ui/toast';

interface HelpfulnessRatingProps {
  responseId: string;
  reviewerId: string;
  currentUserId: string;
  onRatingSubmitted?: () => void;
  compact?: boolean;
}

const RATING_LABELS = {
  1: 'Not helpful',
  2: 'Slightly helpful', 
  3: 'Moderately helpful',
  4: 'Very helpful',
  5: 'Extremely helpful'
};

export function HelpfulnessRating({ 
  responseId, 
  reviewerId, 
  currentUserId, 
  onRatingSubmitted,
  compact = false 
}: HelpfulnessRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Don't show rating for own reviews
  if (reviewerId === currentUserId) {
    return null;
  }

  const handleRatingSubmit = async (selectedRating: number) => {
    if (isSubmitting || hasRated) return;

    try {
      setIsSubmitting(true);
      await reputationManager.rateReview(responseId, selectedRating, currentUserId);
      
      setRating(selectedRating);
      setHasRated(true);
      
      toast.success('Thank you for rating this review!');
      onRatingSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (error.message.includes('duplicate key') || error.message.includes('Cannot rate your own')) {
        setHasRated(true);
        toast.info('You have already rated this review');
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasRated) {
    return (
      <div className={`text-center ${compact ? 'py-2' : 'py-3'}`}>
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Check className="h-4 w-4" />
          <span className="text-sm">You rated this {RATING_LABELS[rating as keyof typeof RATING_LABELS]}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Rate:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingSubmit(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSubmitting}
              className="p-1 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              title={RATING_LABELS[star as keyof typeof RATING_LABELS]}
            >
              <Star 
                className={`h-3 w-3 ${
                  (hoverRating >= star || rating >= star)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border-t border-gray-200">
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How helpful was this review?
        </h4>
        
        <div className="flex items-center justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingSubmit(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSubmitting}
              className="p-1 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Star 
                className={`h-6 w-6 ${
                  (hoverRating >= star || rating >= star)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 group-hover:text-yellow-200'
                }`}
              />
            </button>
          ))}
        </div>
        
        {hoverRating > 0 && (
          <p className="text-xs text-gray-600 h-4">
            {RATING_LABELS[hoverRating as keyof typeof RATING_LABELS]}
          </p>
        )}
        
        {!hoverRating && !rating && (
          <p className="text-xs text-gray-500 h-4">
            Help improve review quality
          </p>
        )}
        
        {isSubmitting && (
          <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-xs">Submitting...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified star display for showing average ratings
interface StarDisplayProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export function StarDisplay({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showNumber = true 
}: StarDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starNumber = i + 1;
          const isFilled = rating >= starNumber;
          const isPartial = rating > i && rating < starNumber;
          
          return (
            <Star
              key={i}
              className={`${sizeClasses[size]} ${
                isFilled 
                  ? 'text-yellow-400 fill-current'
                  : isPartial
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-300'
              }`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className={`text-gray-600 font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}