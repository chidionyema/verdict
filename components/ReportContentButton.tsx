'use client';

import { useState } from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';

interface ReportContentButtonProps {
  contentType: 'verdict_request' | 'verdict_response';
  contentId: string;
  className?: string;
}

const REPORT_REASONS = [
  { id: 'inappropriate_content', label: 'Inappropriate Content', description: 'Content that violates community guidelines' },
  { id: 'harassment', label: 'Harassment or Bullying', description: 'Targeted harassment or bullying behavior' },
  { id: 'spam', label: 'Spam', description: 'Repetitive, unwanted, or promotional content' },
  { id: 'illegal_content', label: 'Illegal Content', description: 'Content that may be illegal or harmful' },
  { id: 'personal_information', label: 'Personal Information', description: 'Sharing private or personal information' },
  { id: 'copyright_violation', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
  { id: 'other', label: 'Other', description: 'Other reason not listed above' },
];

export default function ReportContentButton({ contentType, contentId, className = '' }: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          report_reason: selectedReason,
          report_description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setSelectedReason('');
        setDescription('');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      // Provide user-friendly error based on what went wrong
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Unable to submit report. Please check your internet connection and try again.');
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        setError('Please sign in to report content.');
      } else {
        setError('We couldn\'t submit your report. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedReason('');
    setDescription('');
    setError('');
    setIsSubmitted(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`text-gray-400 hover:text-red-500 transition-colors ${className}`}
        title="Report content"
      >
        <Flag className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="font-semibold">Report Content</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-6 text-center">
                <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Flag className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium">Report Submitted</p>
                  <p className="text-sm mt-1">Thank you for helping keep our community safe. Our moderation team will review this content.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us understand why this content should be reviewed. Your report will be sent to our moderation team.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for report <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <label key={reason.id} className="flex items-start cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <div className="font-medium text-sm">{reason.label}</div>
                          <div className="text-xs text-gray-500">{reason.description}</div>
                        </div>
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
                    placeholder="Provide any additional context that might help our review..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/1000 characters
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedReason}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      isSubmitting || !selectedReason
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}