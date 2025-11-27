'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, DollarSign, Send, ArrowLeft } from 'lucide-react';
import type { VerdictRequest } from '@/lib/database.types';

export default function JudgeVerdictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [request, setRequest] = useState<VerdictRequest | null>(null);
  const [rating, setRating] = useState(7);
  const [feedback, setFeedback] = useState('');
  const [tone, setTone] = useState<'honest' | 'constructive' | 'encouraging'>('constructive');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) {
        setError('Request not found or not available');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRequest(data.request);
      setLoading(false);
    } catch (err) {
      setError('Failed to load request');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (feedback.length < 50) {
      setError('Please provide at least 50 characters of feedback');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/judge/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: id,
          rating,
          feedback,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit verdict');
      }

      router.push('/judge?submitted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/judge" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/judge"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-green-500" />
              <span className="font-semibold text-green-600">$0.50</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-4">Submission to Review</h3>
            {request.media_type === 'photo' && request.media_url ? (
              <img
                src={request.media_url}
                alt="Submission"
                className="w-full rounded-lg"
              />
            ) : request.media_type === 'audio' && request.media_url ? (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-xs font-semibold text-purple-800 mb-2">Voice note from seeker</p>
                <audio controls src={request.media_url} className="w-full" />
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
                <p className="text-gray-700">{request.text_content}</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Category:</strong> {request.category}
              </p>
              {request.subcategory && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Type:</strong> {request.subcategory}
                </p>
              )}
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
                className="w-full"
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
                {(['honest', 'constructive', 'encouraging'] as const).map((t) => (
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
                ))}
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
