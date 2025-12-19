'use client';

import { useState } from 'react';
import { Star, X, ThumbsUp, Target, MessageCircle, Award } from 'lucide-react';

interface VerdictRatingModalProps {
  verdictId: string;
  judgeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function VerdictRatingModal({ 
  verdictId, 
  judgeId, 
  isOpen, 
  onClose, 
  onSubmit 
}: VerdictRatingModalProps) {
  const [helpfulness, setHelpfulness] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [constructiveness, setConstructiveness] = useState(0);
  const [overall, setOverall] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const StarRating = ({ 
    value, 
    onChange, 
    label, 
    icon: Icon 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
    icon: any;
  }) => (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Icon className="h-4 w-4 text-gray-600 mr-2" />
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`min-h-[44px] min-w-[44px] p-2 rounded flex items-center justify-center ${
              star <= value 
                ? 'text-yellow-400' 
                : 'text-gray-300 hover:text-yellow-300'
            } transition-colors`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (helpfulness === 0 || accuracy === 0 || constructiveness === 0 || overall === 0) {
      setError('Please rate all aspects of the verdict');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/verdicts/${verdictId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helpfulness_rating: helpfulness,
          accuracy_rating: accuracy,
          constructiveness_rating: constructiveness,
          overall_rating: overall,
          feedback_text: feedback.trim() || null,
          would_recommend_judge: wouldRecommend,
          is_featured_worthy: isFeatured,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      onSubmit();
      onClose();

      // Reset form
      setHelpfulness(0);
      setAccuracy(0);
      setConstructiveness(0);
      setOverall(0);
      setFeedback('');
      setWouldRecommend(true);
      setIsFeatured(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Rate This Verdict</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-4">
              Help us maintain quality by rating this judge&apos;s verdict. Your feedback helps other users and improves the platform.
            </p>
          </div>

          {/* Rating Categories */}
          <StarRating
            value={helpfulness}
            onChange={setHelpfulness}
            label="Helpfulness"
            icon={ThumbsUp}
          />

          <StarRating
            value={accuracy}
            onChange={setAccuracy}
            label="Accuracy"
            icon={Target}
          />

          <StarRating
            value={constructiveness}
            onChange={setConstructiveness}
            label="Constructiveness"
            icon={MessageCircle}
          />

          <StarRating
            value={overall}
            onChange={setOverall}
            label="Overall Quality"
            icon={Award}
          />

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share specific thoughts about this verdict..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I would recommend this judge to other users
              </span>
            </label>

            {overall >= 4 && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  This verdict deserves to be featured as an example
                </span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || helpfulness === 0 || accuracy === 0 || constructiveness === 0 || overall === 0}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isSubmitting || helpfulness === 0 || accuracy === 0 || constructiveness === 0 || overall === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}