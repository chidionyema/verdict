'use client';

import { useState } from 'react';
import { Flag, AlertTriangle, X } from 'lucide-react';

interface ReportButtonProps {
  contentType: 'request' | 'verdict' | 'judge';
  contentId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ReportModalProps {
  contentType: string;
  contentId: string;
  onClose: () => void;
  onReported: () => void;
}

function ReportModal({ contentType, contentId, onClose, onReported }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'unhelpful', label: 'Unhelpful or low quality' },
    { value: 'offensive', label: 'Offensive or harassing' },
    { value: 'spam', label: 'Spam or promotional' },
    { value: 'other', label: 'Other violation' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
          description
        })
      });

      const result = await response.json();

      if (response.ok) {
        onReported();
        onClose();
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Report {contentType}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's wrong with this {contentType}?
            </label>
            <div className="space-y-2">
              {reasons.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Please provide more details about the issue..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 border-t pt-4">
          <p>
            <strong>Note:</strong> False reports may result in account restrictions. 
            Reports are reviewed within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReportButton({ contentType, contentId, className = '', size = 'sm' }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  if (hasReported) {
    return (
      <div className={`text-gray-500 text-xs ${className}`}>
        ✓ Reported
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          text-gray-400 hover:text-red-500 transition-colors 
          ${buttonClasses[size]} ${className}
        `}
        title={`Report this ${contentType}`}
      >
        <Flag className={sizeClasses[size]} />
      </button>

      {showModal && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          onClose={() => setShowModal(false)}
          onReported={() => setHasReported(true)}
        />
      )}
    </>
  );
}