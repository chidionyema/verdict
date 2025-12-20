'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, Send } from 'lucide-react';

interface JudgeFeedback {
  id: string;
  judgeId: string;
  judgeName: string;
  feedback: string;
  rating: number;
  tone: string;
  timestamp: string;
  isExpert?: boolean;
}

interface JudgeFeedbackRatingProps {
  feedback: JudgeFeedback;
  onRating: (feedbackId: string, rating: number, comment?: string) => void;
  userRating?: {
    rating: number;
    comment?: string;
    timestamp: string;
  };
  className?: string;
}

export function JudgeFeedbackRating({ 
  feedback, 
  onRating, 
  userRating,
  className = '' 
}: JudgeFeedbackRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number>(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = {
    5: { label: 'Excellent', desc: 'Extremely helpful and insightful', color: 'text-green-600' },
    4: { label: 'Good', desc: 'Helpful with useful insights', color: 'text-green-500' },
    3: { label: 'Okay', desc: 'Somewhat helpful', color: 'text-yellow-500' },
    2: { label: 'Poor', desc: 'Not very helpful', color: 'text-orange-500' },
    1: { label: 'Bad', desc: 'Unhelpful or inappropriate', color: 'text-red-500' }
  };

  const handleStarClick = (rating: number) => {
    if (userRating) return; // Can't change rating after submission
    
    setSelectedRating(rating);
    if (rating <= 2) {
      setShowCommentBox(true);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onRating(feedback.id, selectedRating, comment.trim() || undefined);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRating = userRating?.rating || selectedRating;
  const currentLabel = currentRating > 0 ? ratingLabels[currentRating as keyof typeof ratingLabels] : null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Feedback Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-indigo-600">
              {feedback.judgeName.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-gray-900">{feedback.judgeName}</span>
          {feedback.isExpert && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Expert
            </div>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {new Date(feedback.timestamp).toLocaleDateString()}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-gray-700 text-sm">{feedback.feedback}</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rated: {feedback.rating}/10</span>
          <span>•</span>
          <span>Tone: {feedback.tone}</span>
        </div>
      </div>

      {/* Rating Section */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          Rate this feedback
        </h4>

        {userRating ? (
          // Already rated - show read-only state
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">You rated this feedback</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= userRating.rating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className={`font-medium ml-2 ${currentLabel?.color}`}>
                {currentLabel?.label}
              </span>
            </div>
            {userRating.comment && (
              <p className="text-sm text-gray-700 italic">
                "{userRating.comment}"
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Submitted {new Date(userRating.timestamp).toLocaleDateString()}
            </p>
          </div>
        ) : (
          // Rating interface
          <div className="space-y-4">
            {/* Star Rating */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= selectedRating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {currentLabel && (
                <div className="text-sm">
                  <span className={`font-medium ${currentLabel.color}`}>
                    {currentLabel.label}
                  </span>
                  <span className="text-gray-500 ml-1">
                    - {currentLabel.desc}
                  </span>
                </div>
              )}
            </div>

            {/* Comment Box (shown for low ratings or on request) */}
            {(showCommentBox || selectedRating <= 2) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRating <= 2 ? 'Help us improve - what was missing?' : 'Additional feedback (optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={selectedRating <= 2 ? "What would have made this feedback more helpful?" : "Any additional thoughts..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitRating}
                disabled={selectedRating === 0 || isSubmitting}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>

              {selectedRating === 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStarClick(5)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Helpful
                  </button>
                  <button
                    onClick={() => handleStarClick(2)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Not helpful
                  </button>
                </div>
              )}

              {!showCommentBox && selectedRating > 2 && (
                <button
                  onClick={() => setShowCommentBox(true)}
                  className="text-gray-600 hover:text-gray-700 text-sm"
                >
                  Add comment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}