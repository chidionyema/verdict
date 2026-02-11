'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, DollarSign, Send, ArrowLeft, Maximize2, Info, CheckCircle, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { VerdictRequest } from '@/lib/database.types';
import { TIER_CONFIGURATIONS, getTierConfig } from '@/lib/pricing/dynamic-pricing';

// Helper to get judge earning for a request tier
function getJudgeEarningForTier(tier?: string): string {
  const tierKey = tier === 'pro' ? 'expert' : (tier || 'community');
  try {
    const config = getTierConfig(tierKey);
    return (config.judge_payout_cents / 100).toFixed(2);
  } catch {
    // Fallback to community tier
    return (TIER_CONFIGURATIONS.community.judge_payout_cents / 100).toFixed(2);
  }
}

export default function JudgeVerdictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const supabase = createClient();
  const [request, setRequest] = useState<VerdictRequest | null>(null);
  const [rating, setRating] = useState(7);
  const [feedback, setFeedback] = useState('');
  const [tone, setTone] = useState<'honest' | 'constructive' | 'encouraging'>('constructive');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [alreadyJudged, setAlreadyJudged] = useState(false);
  const [existingVerdictId, setExistingVerdictId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequest();
    checkAlreadyJudged();
  }, [id]);

  const checkAlreadyJudged = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingVerdict } = await supabase
        .from('verdict_responses')
        .select('id')
        .eq('request_id', id)
        .eq('judge_id', user.id)
        .single();

      if (existingVerdict) {
        setAlreadyJudged(true);
        setExistingVerdictId((existingVerdict as { id: string }).id);
      }
    } catch (err) {
      // No existing verdict found - this is expected
    }
  };

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
              <span className="font-semibold text-green-600">${getJudgeEarningForTier((request as any)?.request_tier)}</span>
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

          {/* Verdict Form or Already Judged State */}
          <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {alreadyJudged ? (
              /* Already Judged State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  You've Already Judged This Request
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your verdict has been submitted and the seeker will see your feedback.
                  Thank you for contributing!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/requests/${id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Your Verdict
                  </Link>
                  <Link
                    href="/judge"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Queue
                  </Link>
                </div>
              </div>
            ) : (
              /* Verdict Form */
              <>
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

              {/* Tone mismatch warning */}
              {request.requested_tone && (() => {
                const requestedTone = request.requested_tone;
                const isMismatch =
                  (requestedTone === 'encouraging' && tone === 'honest') ||
                  (requestedTone === 'brutally_honest' && tone === 'encouraging') ||
                  (requestedTone === 'honest' && tone === 'encouraging');

                if (isMismatch) {
                  return (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> The seeker requested{' '}
                        <span className="font-semibold">
                          {requestedTone === 'encouraging' ? 'encouraging' :
                           requestedTone === 'brutally_honest' ? 'brutally honest' : 'honest'}
                        </span>{' '}
                        feedback. Your "{tone}" tone may not match their preference.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Feedback Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step 3 · Your written feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide specific, helpful feedback based on the context..."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  feedback.length > 0 && feedback.length < 50
                    ? 'border-red-300'
                    : feedback.length >= 120
                      ? 'border-green-300'
                      : 'border-gray-300'
                }`}
                rows={5}
                maxLength={500}
              />

              {/* Enhanced Character Counter */}
              <div className="mt-2 space-y-2">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        feedback.length < 50
                          ? 'bg-red-400'
                          : feedback.length < 200
                            ? 'bg-green-400'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((feedback.length / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    feedback.length < 50 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {feedback.length}/500
                  </span>
                </div>

                {/* Status Message */}
                <div className="flex items-center justify-between text-xs">
                  {feedback.length < 50 ? (
                    <span className="text-red-600">
                      Need {50 - feedback.length} more characters (minimum 50)
                    </span>
                  ) : feedback.length < 120 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Good! More detail = better quality.
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Excellent detailed feedback!
                    </span>
                  )}
                  <span className="text-gray-400">{feedback.length >= 50 ? 'Ready to submit' : ''}</span>
                </div>
              </div>
            </div>

            {/* Submit Button - Shows earnings */}
            <button
              onClick={handleSubmit}
              disabled={feedback.length < 50 || submitting}
              className={`w-full py-4 min-h-[56px] rounded-xl font-bold transition flex items-center justify-center cursor-pointer ${
                feedback.length < 50 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit & Earn ${getJudgeEarningForTier((request as any)?.request_tier)}
                </>
              )}
            </button>

            {/* Earnings Info */}
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Earnings: ${getJudgeEarningForTier((request as any)?.request_tier)}</p>
                  <p className="text-green-700 mt-1">
                    Earnings are available for payout after a 7-day review period. This ensures quality and protects both judges and seekers.
                  </p>
                </div>
              </div>
            </div>

            {/* Micro‑tips */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Quick tips for world‑class verdicts:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>State a clear recommendation in your first sentence.</li>
                <li>Give 2–3 specific reasons tied to the seeker&apos;s context.</li>
                <li>End with one concrete action the seeker can take next.</li>
              </ul>
            </div>
              </>
            )}
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
