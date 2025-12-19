'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, DollarSign, Send, ArrowLeft, Scale, CheckCircle,
  ThumbsUp, ThumbsDown, Plus, X, Star, Zap, Target,
  AlertCircle, Lightbulb
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';

interface ComparisonData {
  id: string;
  question: string;
  category: string;
  option_a_title: string;
  option_a_description: string;
  option_a_image_url?: string;
  option_b_title: string;
  option_b_description: string;
  option_b_image_url?: string;
  decision_context: {
    timeframe?: string;
    importance?: string;
    budget?: string;
    goals?: string[];
  };
  request_tier: string;
  target_verdict_count: number;
  received_verdict_count: number;
}

export default function JudgeComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [chosenOption, setChosenOption] = useState<'A' | 'B' | null>(null);
  const [confidenceScore, setConfidenceScore] = useState(7);
  const [reasoning, setReasoning] = useState('');

  const [optionAFeedback, setOptionAFeedback] = useState('');
  const [optionAStrengths, setOptionAStrengths] = useState<string[]>(['']);
  const [optionAWeaknesses, setOptionAWeaknesses] = useState<string[]>(['']);
  const [optionARating, setOptionARating] = useState(5);

  const [optionBFeedback, setOptionBFeedback] = useState('');
  const [optionBStrengths, setOptionBStrengths] = useState<string[]>(['']);
  const [optionBWeaknesses, setOptionBWeaknesses] = useState<string[]>(['']);
  const [optionBRating, setOptionBRating] = useState(5);

  const [budgetConsideration, setBudgetConsideration] = useState('');
  const [judgeExpertise, setJudgeExpertise] = useState<string[]>([]);

  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchComparison();
  }, [id]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const fetchComparison = async () => {
    try {
      const res = await fetch(`/api/comparisons/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch comparison');
      }
      const data = await res.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const base = comparison?.request_tier === 'pro' ? 1.0 : 0.5;
    const speedBonus = timeRemaining > 120 ? 0.25 : 0;
    const qualityBonus = reasoning.length > 200 ? 0.15 : 0;
    return (base + speedBonus + qualityBonus).toFixed(2);
  };

  const expertiseOptions = [
    'Career professional', 'Business owner', 'HR/Recruiter',
    'Life coach', 'Financial advisor', 'Marketing expert',
    'Designer', 'Consultant', 'Personal experience'
  ];

  const toggleExpertise = (exp: string) => {
    setJudgeExpertise(prev =>
      prev.includes(exp)
        ? prev.filter(e => e !== exp)
        : [...prev, exp]
    );
  };

  const addStrength = (side: 'A' | 'B') => {
    if (side === 'A') {
      setOptionAStrengths(prev => [...prev, '']);
    } else {
      setOptionBStrengths(prev => [...prev, '']);
    }
  };

  const addWeakness = (side: 'A' | 'B') => {
    if (side === 'A') {
      setOptionAWeaknesses(prev => [...prev, '']);
    } else {
      setOptionBWeaknesses(prev => [...prev, '']);
    }
  };

  const updateStrength = (side: 'A' | 'B', index: number, value: string) => {
    if (side === 'A') {
      setOptionAStrengths(prev => prev.map((s, i) => i === index ? value : s));
    } else {
      setOptionBStrengths(prev => prev.map((s, i) => i === index ? value : s));
    }
  };

  const updateWeakness = (side: 'A' | 'B', index: number, value: string) => {
    if (side === 'A') {
      setOptionAWeaknesses(prev => prev.map((w, i) => i === index ? value : w));
    } else {
      setOptionBWeaknesses(prev => prev.map((w, i) => i === index ? value : w));
    }
  };

  const removeItem = (side: 'A' | 'B', type: 'strength' | 'weakness', index: number) => {
    if (side === 'A') {
      if (type === 'strength') {
        setOptionAStrengths(prev => prev.filter((_, i) => i !== index));
      } else {
        setOptionAWeaknesses(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      if (type === 'strength') {
        setOptionBStrengths(prev => prev.filter((_, i) => i !== index));
      } else {
        setOptionBWeaknesses(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  const canSubmit = () => {
    if (!chosenOption) return false;
    if (reasoning.trim().length < 20) return false;
    if (chosenOption === 'A' && optionARating < optionBRating) return false;
    if (chosenOption === 'B' && optionBRating < optionARating) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await fetch(`/api/comparisons/${id}/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chosenOption,
          confidenceScore,
          reasoning: reasoning.trim(),
          optionAFeedback: optionAFeedback.trim(),
          optionAStrengths: optionAStrengths.filter(s => s.trim()),
          optionAWeaknesses: optionAWeaknesses.filter(w => w.trim()),
          optionARating,
          optionBFeedback: optionBFeedback.trim(),
          optionBStrengths: optionBStrengths.filter(s => s.trim()),
          optionBWeaknesses: optionBWeaknesses.filter(w => w.trim()),
          optionBRating,
          budgetConsideration: budgetConsideration.trim(),
          timeSpentSeconds,
          judgeExpertise,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit verdict');
      }

      router.push('/judge/dashboard?success=comparison');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit verdict');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Comparison not found'}</p>
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="text-purple-600 hover:underline cursor-pointer"
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
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="flex items-center text-white/80 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <span className="font-semibold">A/B Comparison</span>
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
              <span className="font-semibold text-green-300">${calculateEarnings()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{comparison.question}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {comparison.category}
            </span>
            {comparison.decision_context?.importance && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {comparison.decision_context.importance} impact
              </span>
            )}
            {comparison.decision_context?.timeframe && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {comparison.decision_context.timeframe}
              </span>
            )}
          </div>
          {comparison.decision_context?.goals && comparison.decision_context.goals.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <strong>Goals:</strong> {comparison.decision_context.goals.join(', ')}
            </div>
          )}
        </div>

        {/* Options Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {(['A', 'B'] as const).map((side) => {
            const isSelected = chosenOption === side;
            const title = side === 'A' ? comparison.option_a_title : comparison.option_b_title;
            const description = side === 'A' ? comparison.option_a_description : comparison.option_b_description;
            const imageUrl = side === 'A' ? comparison.option_a_image_url : comparison.option_b_image_url;
            const rating = side === 'A' ? optionARating : optionBRating;
            const setRating = side === 'A' ? setOptionARating : setOptionBRating;
            const feedback = side === 'A' ? optionAFeedback : optionBFeedback;
            const setFeedback = side === 'A' ? setOptionAFeedback : setOptionBFeedback;
            const strengths = side === 'A' ? optionAStrengths : optionBStrengths;
            const weaknesses = side === 'A' ? optionAWeaknesses : optionBWeaknesses;

            return (
              <div
                key={side}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                  isSelected ? 'ring-4 ring-purple-500' : ''
                }`}
              >
                {/* Option Header */}
                <div className={`p-4 ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        isSelected ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
                      }`}>
                        {side}
                      </div>
                      <span className="font-semibold text-lg">{title}</span>
                    </div>
                    <button
                      onClick={() => setChosenOption(side)}
                      className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-white text-purple-600'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Selected
                        </span>
                      ) : (
                        'Choose This'
                      )}
                    </button>
                  </div>
                </div>

                {/* Option Content */}
                <div className="p-6 space-y-4">
                  {imageUrl && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`Option ${side}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <p className="text-gray-700">{description}</p>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate this option: {rating}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Poor fit</span>
                      <span>Excellent fit</span>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback for Option {side}
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={`What should they know about ${title}?`}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    />
                  </div>

                  {/* Strengths */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Strengths
                    </label>
                    {strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          value={s}
                          onChange={(e) => updateStrength(side, i, e.target.value)}
                          placeholder="Add a strength..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                        />
                        {strengths.length > 1 && (
                          <button
                            onClick={() => removeItem(side, 'strength', i)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addStrength(side)}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add strength
                    </button>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Weaknesses
                    </label>
                    {weaknesses.map((w, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          value={w}
                          onChange={(e) => updateWeakness(side, i, e.target.value)}
                          placeholder="Add a weakness..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                        />
                        {weaknesses.length > 1 && (
                          <button
                            onClick={() => removeItem(side, 'weakness', i)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addWeakness(side)}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add weakness
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Verdict Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Your Final Recommendation
          </h2>

          {/* Selection Summary */}
          {chosenOption && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-purple-800">
                You recommend: <strong>Option {chosenOption}</strong> ({chosenOption === 'A' ? comparison.option_a_title : comparison.option_b_title})
              </p>
            </div>
          )}

          {!chosenOption && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Please select an option above to continue
              </p>
            </div>
          )}

          {/* Confidence Score */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How confident are you in this recommendation? {confidenceScore}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={confidenceScore}
              onChange={(e) => setConfidenceScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not sure</span>
              <span>Very confident</span>
            </div>
          </div>

          {/* Main Reasoning */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why do you recommend this option? (min 20 characters)
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain your reasoning clearly so the person can make an informed decision..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className={`text-sm mt-1 ${
              reasoning.length < 20 ? 'text-red-500' : reasoning.length > 100 ? 'text-green-600' : 'text-blue-600'
            }`}>
              {reasoning.length}/500 characters {reasoning.length < 20 ? '(min 20)' : reasoning.length > 100 ? '- Great detail!' : '- Good start'}
            </p>
          </div>

          {/* Budget Consideration */}
          {comparison.decision_context?.budget && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget considerations
              </label>
              <textarea
                value={budgetConsideration}
                onChange={(e) => setBudgetConsideration(e.target.value)}
                placeholder="Any thoughts on cost/value for this decision?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}

          {/* Judge Expertise */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What expertise do you bring to this? (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {expertiseOptions.map((exp) => (
                <button
                  key={exp}
                  onClick={() => toggleExpertise(exp)}
                  className={`px-3 py-1.5 rounded-full text-sm transition cursor-pointer ${
                    judgeExpertise.includes(exp)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Preview */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Estimated earnings:</strong> ${calculateEarnings()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Base: ${comparison.request_tier === 'pro' ? '1.00' : '0.50'} + Speed bonus: {timeRemaining > 120 ? '$0.25' : '$0.00'} + Quality bonus: {reasoning.length > 200 ? '$0.15' : '$0.00'}
            </p>
          </div>

          {/* Validation Warning */}
          {chosenOption && (
            (chosenOption === 'A' && optionARating < optionBRating) ||
            (chosenOption === 'B' && optionBRating < optionARating)
          ) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Your ratings don't match your selection. If you choose Option {chosenOption}, it should have a higher rating.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center cursor-pointer ${
              !canSubmit() || submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
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
                Submit Comparison Verdict
              </>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for great comparison verdicts
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Consider the person's goals and timeline when recommending</li>
            <li>- Be specific about pros and cons for each option</li>
            <li>- If it's close, explain what would tip the balance either way</li>
            <li>- Share relevant personal experience if you have it</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
