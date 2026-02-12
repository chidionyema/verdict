'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, DollarSign, Send, ArrowLeft, GitBranch, CheckCircle,
  ThumbsUp, ThumbsDown, Star, AlertCircle, Lightbulb, BarChart3
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';
import { TIER_CONFIGURATIONS, getTierConfig } from '@/lib/pricing/dynamic-pricing';
import { useVerdictDraft, DraftSaveIndicator, DraftRestorationBanner } from '@/lib/hooks/useVerdictDraft';
import { VerdictSubmittedCelebration } from '@/components/judge/VerdictSubmittedCelebration';
import { CharacterGuidance, ResponseTemplates, InlineHelp } from '@/components/judge/SmartFeedbackGuidance';
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

interface SplitTestData {
  id: string;
  title: string;
  description: string;
  category: string;
  hypothesis: string;
  success_criteria: string;
  variant_a_title: string;
  variant_a_description: string;
  variant_a_image_url?: string;
  variant_b_title: string;
  variant_b_description: string;
  variant_b_image_url?: string;
  request_tier: string;
  target_verdict_count: number;
  received_verdict_count: number;
}

export default function JudgeSplitTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [splitTest, setSplitTest] = useState<SplitTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [winnerVariant, setWinnerVariant] = useState<'A' | 'B' | 'tie' | null>(null);
  const [confidenceScore, setConfidenceScore] = useState(7);
  const [reasoning, setReasoning] = useState('');

  const [variantAScore, setVariantAScore] = useState(5);
  const [variantAStrengths, setVariantAStrengths] = useState('');
  const [variantAWeaknesses, setVariantAWeaknesses] = useState('');

  const [variantBScore, setVariantBScore] = useState(5);
  const [variantBStrengths, setVariantBStrengths] = useState('');
  const [variantBWeaknesses, setVariantBWeaknesses] = useState('');

  const [hypothesisValidation, setHypothesisValidation] = useState<'supported' | 'not_supported' | 'inconclusive' | null>(null);
  const [additionalInsights, setAdditionalInsights] = useState('');

  const [timeRemaining, setTimeRemaining] = useState(180);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // New features state
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [judgeStats, setJudgeStats] = useState({ verdicts: 0, streak: 0 });

  // Draft management
  const { saveDraft, restoreDraft, clearDraft, saveStatus, hasDraft, lastSaved } = useVerdictDraft(id);

  useEffect(() => {
    fetchSplitTest();
    fetchJudgeStats();
  }, [id]);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft) {
      setShowDraftBanner(true);
    }
  }, [hasDraft]);

  // Auto-save draft when form changes
  useEffect(() => {
    if (winnerVariant || reasoning || variantAStrengths || variantBStrengths) {
      saveDraft({
        winner: winnerVariant || undefined,
        reasoning,
        variantAScore,
        variantBScore,
        hypothesisValidation: hypothesisValidation || undefined,
        confidence: confidenceScore,
      });
    }
  }, [winnerVariant, reasoning, variantAScore, variantBScore, hypothesisValidation, confidenceScore, saveDraft]);

  const fetchJudgeStats = async () => {
    try {
      const res = await fetch('/api/judge/stats');
      if (res.ok) {
        const data = await res.json();
        setJudgeStats({
          verdicts: data.verdicts_given || 0,
          streak: data.streak_days || 0,
        });
      }
    } catch (err) {
      // Non-critical, ignore errors
    }
  };

  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (draft) {
      if (draft.winner) setWinnerVariant(draft.winner as 'A' | 'B' | 'tie');
      if (draft.reasoning) setReasoning(draft.reasoning);
      if (draft.variantAScore) setVariantAScore(draft.variantAScore);
      if (draft.variantBScore) setVariantBScore(draft.variantBScore);
      if (draft.hypothesisValidation) setHypothesisValidation(draft.hypothesisValidation as any);
      if (draft.confidence) setConfidenceScore(draft.confidence);
    }
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    router.push('/judge?success=split_test');
  };

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const fetchSplitTest = async () => {
    try {
      const res = await fetch(`/api/split-tests/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch split test');
      }
      const data = await res.json();
      setSplitTest(data.splitTest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load split test');
    } finally {
      setLoading(false);
    }
  };

  // Get earning based on request tier
  const getEarningAmount = () => {
    return getJudgeEarningForTier(splitTest?.request_tier);
  };

  const canSubmit = () => {
    if (!winnerVariant) return false;
    if (reasoning.trim().length < 30) return false;
    if (!hypothesisValidation) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await fetch(`/api/split-tests/${id}/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerVariant,
          confidenceScore,
          reasoning: reasoning.trim(),
          variantAScore,
          variantAStrengths: variantAStrengths.trim(),
          variantAWeaknesses: variantAWeaknesses.trim(),
          variantBScore,
          variantBStrengths: variantBStrengths.trim(),
          variantBWeaknesses: variantBWeaknesses.trim(),
          hypothesisValidation,
          additionalInsights: additionalInsights.trim(),
          timeSpentSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit verdict');
      }

      // Clear draft and show celebration
      clearDraft();
      const earning = parseFloat(getEarningAmount());
      setEarnedAmount(earning);
      setShowCelebration(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit verdict');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading split test...</p>
        </div>
      </div>
    );
  }

  if (error || !splitTest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Split test not found'}</p>
          <button
            onClick={() => router.push('/judge')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
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
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/judge')}
            className="flex items-center text-white/80 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <span className="font-semibold">A/B Split Test</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Clock className={`h-5 w-5 mr-2 ${timeRemaining < 60 ? 'text-red-300' : 'text-white/80'}`} />
              <span className={`font-mono ${timeRemaining < 60 ? 'text-red-300' : ''}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-green-300" />
              <span className="font-semibold text-green-300">${getEarningAmount()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Draft restoration banner */}
        {showDraftBanner && (
          <div className="mb-6">
            <DraftRestorationBanner
              onRestore={handleRestoreDraft}
              onDiscard={handleDiscardDraft}
              lastSaved={lastSaved}
            />
          </div>
        )}

        {/* Test Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">{splitTest.title}</h1>
            <DraftSaveIndicator status={saveStatus} lastSaved={lastSaved} />
          </div>
          <p className="text-gray-600 mb-4">{splitTest.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-700 mb-1">Hypothesis</p>
              <p className="text-blue-900">{splitTest.hypothesis}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-700 mb-1">Success Criteria</p>
              <p className="text-green-900">{splitTest.success_criteria}</p>
            </div>
          </div>
        </div>

        {/* Variants Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {(['A', 'B'] as const).map((variant) => {
            const isWinner = winnerVariant === variant;
            const title = variant === 'A' ? splitTest.variant_a_title : splitTest.variant_b_title;
            const description = variant === 'A' ? splitTest.variant_a_description : splitTest.variant_b_description;
            const imageUrl = variant === 'A' ? splitTest.variant_a_image_url : splitTest.variant_b_image_url;
            const score = variant === 'A' ? variantAScore : variantBScore;
            const setScore = variant === 'A' ? setVariantAScore : setVariantBScore;
            const strengths = variant === 'A' ? variantAStrengths : variantBStrengths;
            const setStrengths = variant === 'A' ? setVariantAStrengths : setVariantBStrengths;
            const weaknesses = variant === 'A' ? variantAWeaknesses : variantBWeaknesses;
            const setWeaknesses = variant === 'A' ? setVariantAWeaknesses : setVariantBWeaknesses;

            return (
              <div
                key={variant}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                  isWinner ? 'ring-4 ring-emerald-500' : ''
                }`}
              >
                {/* Variant Header */}
                <div className={`p-4 ${isWinner ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        isWinner ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
                      }`}>
                        {variant}
                      </div>
                      <span className="font-semibold text-lg">{title}</span>
                    </div>
                    <button
                      onClick={() => setWinnerVariant(variant)}
                      className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
                        isWinner
                          ? 'bg-white text-emerald-600'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isWinner ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Winner
                        </span>
                      ) : (
                        'Select Winner'
                      )}
                    </button>
                  </div>
                </div>

                {/* Variant Content */}
                <div className="p-6 space-y-4">
                  {imageUrl && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`Variant ${variant}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <p className="text-gray-700">{description}</p>

                  {/* Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effectiveness Score: {score}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  {/* Strengths */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Strengths
                    </label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="What works well about this variant?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Weaknesses
                    </label>
                    <textarea
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      placeholder="What could be improved?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tie Option */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <button
            onClick={() => setWinnerVariant('tie')}
            className={`w-full p-4 rounded-lg border-2 transition cursor-pointer ${
              winnerVariant === 'tie'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <BarChart3 className={`h-5 w-5 ${winnerVariant === 'tie' ? 'text-amber-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${winnerVariant === 'tie' ? 'text-amber-800' : 'text-gray-600'}`}>
                It's a tie - both variants perform equally
              </span>
              {winnerVariant === 'tie' && <CheckCircle className="h-5 w-5 text-amber-600" />}
            </div>
          </button>
        </div>

        {/* Final Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Your Analysis
          </h2>

          {/* Selection Summary */}
          {winnerVariant && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-emerald-800">
                {winnerVariant === 'tie'
                  ? 'You determined this is a tie - both variants perform equally'
                  : <>You selected: <strong>Variant {winnerVariant}</strong> ({winnerVariant === 'A' ? splitTest.variant_a_title : splitTest.variant_b_title})</>
                }
              </p>
            </div>
          )}

          {!winnerVariant && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Please select a winner or declare a tie above
              </p>
            </div>
          )}

          {/* Hypothesis Validation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Does the data support the hypothesis?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'supported', label: 'Supported', color: 'green' },
                { value: 'not_supported', label: 'Not Supported', color: 'red' },
                { value: 'inconclusive', label: 'Inconclusive', color: 'yellow' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHypothesisValidation(option.value)}
                  className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                    hypothesisValidation === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={hypothesisValidation === option.value ? `text-${option.color}-700` : 'text-gray-600'}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How confident are you in this analysis? {confidenceScore}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={confidenceScore}
              onChange={(e) => setConfidenceScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Main Reasoning */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Explain your reasoning
              </label>
              <InlineHelp topic="reasoning" />
            </div>

            {/* Response Templates */}
            <div className="mb-3">
              <ResponseTemplates
                category={splitTest.category}
                verdictType="split_test"
                onSelectTemplate={(template) => {
                  if (reasoning.trim()) {
                    setReasoning(reasoning + '\n\n' + template);
                  } else {
                    setReasoning(template);
                  }
                }}
              />
            </div>

            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Why did you choose this winner? What evidence supports your decision?"
              rows={4}
              maxLength={500}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                reasoning.length === 0 ? 'border-gray-300' :
                reasoning.length < 30 ? 'border-red-300' :
                reasoning.length < 150 ? 'border-amber-300' : 'border-green-300'
              }`}
            />
            <CharacterGuidance
              value={reasoning}
              minLength={30}
              goodLength={100}
              excellentLength={200}
              maxLength={500}
              fieldName="reasoning"
            />
          </div>

          {/* Additional Insights */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional insights or recommendations (optional)
            </label>
            <textarea
              value={additionalInsights}
              onChange={(e) => setAdditionalInsights(e.target.value)}
              placeholder="Any other observations, suggestions for improvement, or next steps?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Earnings Preview */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>You'll earn:</strong> ${getEarningAmount()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Based on request tier ({splitTest.request_tier || 'community'}). Available for payout after 7 days.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center cursor-pointer ${
              !canSubmit() || submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Submit Split Test Verdict
              </>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for great split test analysis
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Consider the hypothesis when evaluating which variant performs better</li>
            <li>- Look at both variants objectively before making a decision</li>
            <li>- Explain the key differences that led to your choice</li>
            <li>- Consider real-world implications and user experience</li>
          </ul>
        </div>
      </div>

      {/* Verdict Submitted Celebration */}
      <VerdictSubmittedCelebration
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        earnings={earnedAmount}
        verdictType="split_test"
        verdictSummary={reasoning.slice(0, 100)}
        currentStreak={judgeStats.streak}
        totalVerdicts={judgeStats.verdicts + 1}
        requestCategory={splitTest?.category}
      />

      {/* Mobile Sticky Submit Button */}
      <MobileStickySubmit
        canSubmit={canSubmit()}
        isSubmitting={submitting}
        earnings={getEarningAmount()}
        onSubmit={handleSubmit}
        submitLabel="Submit Split Test Verdict"
        verdictType="split_test"
      />
    </div>
  );
}
