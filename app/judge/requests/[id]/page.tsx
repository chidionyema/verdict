'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, DollarSign, Send, ArrowLeft, Maximize2 } from 'lucide-react';
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
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch(`/api/requests/${id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        setError('Request not found or not available');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRequest(data.request);
      setLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load request');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (feedback.length < 120) {
      setError('Please provide at least 120 characters of feedback (about 20 words)');
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
        <div className="text-center max-w-md px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <p className="text-red-800 font-medium mb-2">Unable to load request</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Link 
            href="/judge" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Judge Queue
          </Link>
        </div>
      </div>
    );
  }

  if (!request && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <p className="text-yellow-800 font-medium mb-2">Request not found</p>
            <p className="text-yellow-600 text-sm">
              This request may have been removed or you don't have access to it.
            </p>
          </div>
          <Link 
            href="/judge" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Judge Queue
          </Link>
        </div>
      </div>
    );
  }

  // Type guard: if we reach here and request is null, we're still loading
  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/judge"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to queue
            </Link>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Request ID: <span className="font-mono">{id.slice(0, 8)}…</span>
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 mr-4">
              <span>Estimated time: ~3–5 min</span>
              <span>Goal: 1 clear decision + 2–3 reasons</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-green-500" />
              <span className="font-semibold text-green-600">$0.50</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Media & context */}
          <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Submission to Review
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Take a moment to understand the seeker&apos;s situation before rating or writing.
            </p>

            {request.media_type === 'photo' && request.media_url ? (
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="relative w-full group cursor-zoom-in"
              >
                <img
                  src={request.media_url}
                  alt="Submission"
                  className="w-full rounded-lg border border-gray-200 shadow-sm"
                />
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs opacity-80 group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" />
                  <span>Click to zoom</span>
                </div>
              </button>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg min-h-[200px] border border-dashed border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {request.text_content}
                </p>
              </div>
            )}

            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-xs space-y-2">
              <p className="text-indigo-900">
                <strong>Category:</strong> {request.category}
              </p>
              {request.subcategory && (
                <p className="text-indigo-900">
                  <strong>Type:</strong> {request.subcategory}
                </p>
              )}
              {request.requested_tone && (
                <div className="flex items-center gap-2">
                  <strong className="text-indigo-900">Requested Tone:</strong>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    request.requested_tone === 'encouraging' 
                      ? 'bg-green-100 text-green-800'
                      : request.requested_tone === 'brutally_honest'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {request.requested_tone === 'encouraging' ? 'Be Encouraging' :
                     request.requested_tone === 'brutally_honest' ? 'Be Brutally Honest' :
                     'Be Direct'}
                  </span>
                </div>
              )}
              <p className="text-indigo-900">
                <strong>Context:</strong>{' '}
                <span className="text-indigo-800">{request.context}</span>
              </p>
            </div>
          </section>

          {/* Verdict Form */}
          <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Your Verdict
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {request.requested_tone === 'encouraging'
                ? 'The seeker wants encouraging, supportive feedback. Be gentle and focus on positives while still being helpful.'
                : request.requested_tone === 'brutally_honest'
                ? 'The seeker wants brutally honest feedback with no sugar-coating. Be direct and straightforward in your assessment.'
                : 'Give one clear recommendation, explain why in a few sentences, and keep your tone kind and direct.'}
            </p>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step 1 · Overall rating: {rating}/10
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use your gut: 1–3 = not working, 4–6 = mixed, 7–10 = strong.
              </p>
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
                Step 2 · Feedback tone
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
                Step 3 · Your written feedback (min 50 characters)
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
                  feedback.length < 120 ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {feedback.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={feedback.length < 120 || submitting}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center cursor-pointer ${
                feedback.length < 120 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
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

            {/* Micro‑tips */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Quick tips for world‑class verdicts:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>State a clear recommendation in your first sentence.</li>
                <li>Give 2–3 specific reasons tied to the seeker&apos;s context.</li>
                <li>End with one concrete action the seeker can take next.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* Image zoom modal */}
      {showImageModal && request.media_type === 'photo' && request.media_url && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-2 sm:px-4">
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-zoom-out"
            onClick={() => setShowImageModal(false)}
            aria-label="Close zoomed image"
          />
          <div className="relative z-50 max-w-6xl w-full flex flex-col items-center gap-3">
            <div className="w-full h-[80vh] sm:h-[85vh] overflow-auto bg-black/40 rounded-lg border border-gray-700">
              <img
                src={request.media_url}
                alt="Zoomed submission"
                className="mx-auto max-w-none h-auto object-contain"
                style={{ transform: 'scale(1.7)', transformOrigin: 'top left' }}
              />
            </div>
            <div className="flex items-center justify-between w-full max-w-3xl text-xs text-gray-200">
              <span>Scroll to pan. Click outside to close.</span>
              <a
                href={request.media_url}
                target="_blank"
                rel="noreferrer"
                className="underline text-indigo-300 hover:text-indigo-100"
              >
                Open original in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
