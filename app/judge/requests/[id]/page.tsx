'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, DollarSign, Send, ArrowLeft, Maximize2, Info, CheckCircle, Award, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { VerdictRequest } from '@/lib/database.types';
import { TIER_CONFIGURATIONS, getTierConfig } from '@/lib/pricing/dynamic-pricing';
import { useVerdictDraft, DraftSaveIndicator, DraftRestorationBanner } from '@/lib/hooks/useVerdictDraft';
import { VerdictPreviewModal } from '@/components/judge/VerdictPreviewModal';
import { VerdictSubmittedCelebration } from '@/components/judge/VerdictSubmittedCelebration';
import { PostVerdictVerificationNudge } from '@/components/judge/ContextualVerificationPrompt';
import {
  TonePreSelector,
  SmartTextarea,
  InlineHelp,
} from '@/components/judge/SmartFeedbackGuidance';
import { MobileStickySubmit } from '@/components/judge/MobileStickySubmit';

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

  // New features state
  const [showPreview, setShowPreview] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [judgeStats, setJudgeStats] = useState({ verdicts: 0, streak: 0 });
  const [showPostVerdictNudge, setShowPostVerdictNudge] = useState(false);
  const [verificationTierIndex, setVerificationTierIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Draft management
  const { saveDraft, restoreDraft, clearDraft, saveStatus, hasDraft, lastSaved } = useVerdictDraft(id);

  useEffect(() => {
    fetchRequest();
    checkAlreadyJudged();
    fetchJudgeStats();
  }, [id]);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft && !alreadyJudged) {
      setShowDraftBanner(true);
    }
  }, [hasDraft, alreadyJudged]);

  // Auto-save draft when form changes
  useEffect(() => {
    if (feedback || rating !== 7 || tone !== 'constructive') {
      saveDraft({ rating, feedback, tone });
    }
  }, [rating, feedback, tone, saveDraft]);

  // Pre-select tone based on requested tone
  useEffect(() => {
    if (request?.requested_tone && !hasDraft) {
      if (request.requested_tone === 'encouraging') {
        setTone('encouraging');
      } else if (request.requested_tone === 'brutally_honest') {
        setTone('honest');
      } else {
        setTone('constructive');
      }
    }
  }, [request?.requested_tone, hasDraft]);

  const fetchJudgeStats = async () => {
    try {
      // Get user ID for verification nudge
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      const res = await fetch('/api/judge/stats');
      if (res.ok) {
        const data = await res.json();
        setJudgeStats({
          verdicts: data.verdicts_given || 0,
          streak: data.streak_days || 0,
        });
      }

      // Fetch verification status for post-verdict nudge
      const verifyRes = await fetch('/api/judge/verification-status');
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        setVerificationTierIndex(verifyData.tierIndex || 0);
      }
    } catch (err) {
      // Non-critical, ignore errors
    }
  };

  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (draft) {
      if (draft.rating) setRating(draft.rating);
      if (draft.feedback) setFeedback(draft.feedback);
      if (draft.tone) setTone(draft.tone);
    }
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

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

  const handlePreviewSubmit = () => {
    if (feedback.length < 50) {
      setError('Please provide at least 50 characters of feedback');
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (feedback.length < 50) {
      setError('Please provide at least 50 characters of feedback');
      return;
    }

    setSubmitting(true);
    setError('');
    setShowPreview(false);

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

      // Check and award any earned credits
      try {
        await fetch('/api/credits/check-earning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        // Trigger credit balance refresh
        window.dispatchEvent(new CustomEvent('credits-updated'));
      } catch (creditError) {
        console.error('Failed to check/award credits:', creditError);
      }

      // Clear draft and show celebration
      clearDraft();
      const earning = parseFloat(getJudgeEarningForTier((request as any)?.request_tier));
      setEarnedAmount(earning);
      setShowCelebration(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      // Provide user-friendly error based on what went wrong
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Unable to submit verdict. Please check your connection and try again. Your draft has been saved.');
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        setError('Your session has expired. Please sign in again to submit your verdict.');
      } else if (errorMessage.includes('already') || errorMessage.includes('duplicate')) {
        setError('You\'ve already submitted a verdict for this request.');
      } else {
        setError('We couldn\'t submit your verdict. Please try again in a moment. Your draft has been saved.');
      }
      setSubmitting(false);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    // Show verification nudge if user isn't fully verified (tier < 4)
    if (verificationTierIndex < 4 && userId) {
      setShowPostVerdictNudge(true);
    } else {
      router.push('/judge?submitted=true');
    }
  };

  const handleDismissNudge = () => {
    setShowPostVerdictNudge(false);
    router.push('/judge?submitted=true');
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
              className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 -ml-3 min-h-[48px] rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
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
                    className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Your Verdict
                  </Link>
                  <Link
                    href="/judge"
                    className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Queue
                  </Link>
                </div>
              </div>
            ) : (
              /* Verdict Form */
              <>
                {/* Draft restoration banner */}
                {showDraftBanner && (
                  <DraftRestorationBanner
                    onRestore={handleRestoreDraft}
                    onDiscard={handleDiscardDraft}
                    lastSaved={lastSaved}
                  />
                )}

                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Your Verdict
                  </h2>
                  <DraftSaveIndicator status={saveStatus} lastSaved={lastSaved} />
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {request.requested_tone === 'encouraging'
                    ? 'The requester wants encouraging, supportive feedback. Be gentle and focus on positives while still being helpful.'
                    : request.requested_tone === 'brutally_honest'
                    ? 'The requester wants brutally honest feedback with no sugar-coating. Be direct and straightforward in your assessment.'
                    : 'Give one clear recommendation, explain why in a few sentences, and keep your tone kind and direct.'}
                </p>

            {/* Rating */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Step 1 · Overall rating: {rating}/10
                </label>
                <InlineHelp topic="rating" />
              </div>

              {/* Rating context badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
                rating <= 3 ? 'bg-red-100 text-red-700' :
                rating <= 5 ? 'bg-amber-100 text-amber-700' :
                rating <= 7 ? 'bg-blue-100 text-blue-700' :
                rating <= 8 ? 'bg-green-100 text-green-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {rating <= 3 ? 'Needs significant improvement' :
                 rating <= 5 ? 'Below average / Mixed results' :
                 rating <= 7 ? 'Good / Solid choice' :
                 rating <= 8 ? 'Very good / Strong option' :
                 'Excellent / Highly recommended'}
              </div>

              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
                aria-label={`Rating: ${rating} out of 10`}
              />

              {/* Clear scale labels */}
              <div className="flex justify-between text-xs mt-2">
                <div className="text-center">
                  <span className="text-red-600 font-medium">1-3</span>
                  <p className="text-gray-400">Needs work</p>
                </div>
                <div className="text-center">
                  <span className="text-amber-600 font-medium">4-5</span>
                  <p className="text-gray-400">Mixed</p>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-medium">6-7</span>
                  <p className="text-gray-400">Good</p>
                </div>
                <div className="text-center">
                  <span className="text-green-600 font-medium">8-10</span>
                  <p className="text-gray-400">Excellent</p>
                </div>
              </div>
            </div>

            {/* Tone Selection - Enhanced */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Step 2 · Feedback tone</span>
              </div>
              <TonePreSelector
                requestedTone={request.requested_tone || undefined}
                selectedTone={tone}
                onToneChange={setTone}
              />
            </div>

            {/* Feedback Text - Enhanced */}
            <div className="mb-6">
              <SmartTextarea
                value={feedback}
                onChange={setFeedback}
                placeholder="Provide specific, helpful feedback based on the context..."
                minLength={50}
                goodLength={120}
                excellentLength={200}
                maxLength={500}
                rows={5}
                category={request.category}
                verdictType="standard"
                showTemplates={true}
                helpTopic="feedback"
                label="Step 3 · Your written feedback"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Preview Button */}
              <button
                onClick={handlePreviewSubmit}
                disabled={feedback.length < 50}
                className={`w-full py-3 min-h-[48px] rounded-xl font-medium transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  feedback.length < 50
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer active:scale-[0.98]'
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Before Submitting
              </button>

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
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit & Earn ${getJudgeEarningForTier((request as any)?.request_tier)}
                  </>
                )}
              </button>
            </div>

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

      {/* Verdict Preview Modal */}
      <VerdictPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        rating={rating}
        feedback={feedback}
        tone={tone}
        isSubmitting={submitting}
      />

      {/* Verdict Submitted Celebration */}
      <VerdictSubmittedCelebration
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        earnings={earnedAmount}
        verdictType="standard"
        verdictSummary={feedback.slice(0, 100)}
        currentStreak={judgeStats.streak}
        totalVerdicts={judgeStats.verdicts + 1}
        requestCategory={request?.category}
      />

      {/* Post-Verdict Verification Nudge */}
      {userId && (
        <PostVerdictVerificationNudge
          userId={userId}
          currentTier={verificationTierIndex}
          show={showPostVerdictNudge}
          onDismiss={handleDismissNudge}
        />
      )}

      {/* Mobile Sticky Submit Button */}
      {!alreadyJudged && (
        <MobileStickySubmit
          canSubmit={feedback.length >= 50}
          isSubmitting={submitting}
          earnings={getJudgeEarningForTier((request as any)?.request_tier)}
          onSubmit={handleSubmit}
          onPreview={handlePreviewSubmit}
          submitLabel={`Submit & Earn $${getJudgeEarningForTier((request as any)?.request_tier)}`}
          verdictType="standard"
        />
      )}
    </div>
  );
}
