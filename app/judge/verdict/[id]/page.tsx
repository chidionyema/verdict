'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Clock, DollarSign, Send, ArrowLeft } from 'lucide-react';

export default function VerdictSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const availableRequests = useStore((state) => state.availableRequests);
  const claimRequest = useStore((state) => state.claimRequest);

  const [rating, setRating] = useState(7);
  const [feedback, setFeedback] = useState('');
  const [tone, setTone] = useState<'honest' | 'constructive' | 'encouraging'>(
    'constructive'
  );
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [submitting, setSubmitting] = useState(false);

  const request = availableRequests.find((r) => r.id === id);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const calculateEarnings = () => {
    let base = 0.5;
    const speedBonus = timeRemaining > 60 ? 0.25 : 0;
    const qualityBonus = feedback.length > 100 ? 0.15 : 0;
    return (base + speedBonus + qualityBonus).toFixed(2);
  };

  const handleSubmit = () => {
    if (feedback.length < 50) {
      alert('Please provide at least 50 characters of feedback');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      claimRequest(id);
      router.push('/judge/dashboard');
    }, 1000);
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Request not found or already claimed</p>
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Clock
                className={`h-5 w-5 mr-2 ${
                  timeRemaining < 30 ? 'text-red-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`font-mono ${
                  timeRemaining < 30 ? 'text-red-500' : 'text-gray-700'
                }`}
              >
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-green-500" />
              <span className="font-semibold text-green-600">
                ${calculateEarnings()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-4">Submission to Review</h3>
            {request.mediaType === 'image' ? (
              <img
                src={request.mediaUrl}
                alt="Submission"
                className="w-full rounded-lg"
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
                <p className="text-gray-700">{request.mediaUrl}</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Category:</strong> {request.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Context:</strong> {request.context}
              </p>
            </div>
          </div>

          {/* Verdict Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-6">Your Verdict</h3>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating: {rating}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Tone
              </label>
              <div className="flex space-x-2">
                {(['honest', 'constructive', 'encouraging'] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        tone === t
                          ? t === 'honest'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : t === 'constructive'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                            : 'bg-green-100 text-green-700 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Feedback Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback (min 50 characters)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide specific, helpful feedback based on the context..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={5}
              />
              <p
                className={`text-sm mt-1 ${
                  feedback.length < 50 ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {feedback.length}/500 characters
              </p>
            </div>

            {/* Earnings Preview */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Estimated earnings:</strong> ${calculateEarnings()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Base: $0.50 + Speed bonus:{' '}
                {timeRemaining > 60 ? '$0.25' : '$0.00'} + Quality bonus:{' '}
                {feedback.length > 100 ? '$0.15' : '$0.00'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={feedback.length < 50 || submitting}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center cursor-pointer ${
                feedback.length < 50 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Verdict
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
