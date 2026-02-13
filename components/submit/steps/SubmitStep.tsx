'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Coins,
  Zap,
  Clock,
  Users,
  Star,
  Crown,
  Sparkles,
} from 'lucide-react';
import { StepProps, TIERS, CATEGORIES, getRequiredCredits, Tier } from '../types';

interface SubmitStepProps extends StepProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  onEarnCredits: () => void;
  onBuyCredits: () => void;
}

export function SubmitStep({
  data,
  onUpdate,
  onBack,
  userCredits,
  isOnline,
  isSubmitting,
  onSubmit,
  onEarnCredits,
  onBuyCredits,
}: SubmitStepProps) {
  const requiredCredits = getRequiredCredits(data.tier);
  const hasEnoughCredits = userCredits >= requiredCredits;
  const category = CATEGORIES.find(c => c.id === data.category);
  const selectedTier = TIERS.find(t => t.id === data.tier);

  const handleTierSelect = (tier: Tier) => {
    onUpdate({ tier });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSubmit = () => {
    if (hasEnoughCredits && !isSubmitting && isOnline) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Request Summary</h3>

        <div className="space-y-4">
          {/* Content preview */}
          <div className="flex items-start gap-4">
            {data.mediaType === 'photo' && data.mediaUrls[0] && (
              <img
                src={data.mediaUrls[0]}
                alt="Your upload"
                className="w-20 h-20 rounded-xl object-cover shadow-sm"
              />
            )}
            {data.mediaType === 'text' && (
              <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category?.icon}</span>
                <span className="font-medium text-gray-900">{category?.name}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {data.context}
              </p>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium whitespace-nowrap px-3 py-2 min-h-[44px] rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose your feedback level
        </h3>
        <p className="text-gray-600 mb-4">
          Higher tiers get more verdicts from verified judges
        </p>

        <div className="space-y-3" role="radiogroup" aria-label="Feedback tier">
          {TIERS.map((tier) => {
            const canAfford = userCredits >= tier.credits;
            const isSelected = data.tier === tier.id;
            const Icon = tier.id === 'community' ? Users : tier.id === 'standard' ? Star : Crown;

            return (
              <button
                key={tier.id}
                onClick={() => handleTierSelect(tier.id)}
                role="radio"
                aria-checked={isSelected}
                disabled={isSubmitting}
                className={`w-full p-4 min-h-[88px] rounded-xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.99] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-indigo-600' : 'text-gray-600'
                      }`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{tier.name}</span>
                        {tier.recommended && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                            RECOMMENDED
                          </span>
                        )}
                        {tier.badge && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{tier.description}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-gray-900">{tier.credits}</span>
                      <span className="text-sm text-gray-500">credit{tier.credits > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3" />
                      {tier.turnaround}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-4 text-sm">
                    {tier.features.map((feature, i) => (
                      <span key={i} className="flex items-center gap-1 text-indigo-700">
                        <Check className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Credit Status */}
      <div className={`rounded-xl p-5 ${
        hasEnoughCredits
          ? 'bg-green-50 border border-green-200'
          : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${
            hasEnoughCredits ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            <Coins className={`h-6 w-6 ${
              hasEnoughCredits ? 'text-green-600' : 'text-amber-600'
            }`} />
          </div>

          <div className="flex-1">
            {hasEnoughCredits ? (
              <>
                <p className="font-semibold text-green-900">
                  Ready to submit
                </p>
                <p className="text-sm text-green-700 mt-1">
                  You have {userCredits} credit{userCredits !== 1 ? 's' : ''}. This request uses {requiredCredits}.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-900">
                  You need {requiredCredits - userCredits} more credit{requiredCredits - userCredits !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You have {userCredits} credit{userCredits !== 1 ? 's' : ''}, but {selectedTier?.name} requires {requiredCredits}.
                </p>

                {/* Credit options */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={onEarnCredits}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Earn Free</span>
                  </button>
                  <button
                    onClick={onBuyCredits}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Buy Credits</span>
                  </button>
                </div>

                <p className="text-xs text-amber-600 mt-3">
                  Earn: Judge 3 requests (~15 min) to earn 1 credit for free
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        {onBack && (
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-3 min-h-[48px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!hasEnoughCredits || isSubmitting || !isOnline}
          className={`ml-auto px-8 py-4 min-h-[56px] rounded-xl font-semibold text-white transition-all flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
            hasEnoughCredits && !isSubmitting && isOnline
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Submit for {requiredCredits} Credit{requiredCredits > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-center text-xs text-gray-400">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">Enter</kbd> to submit
      </p>

      {/* Offline notice */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800">You're offline. Your draft is saved.</p>
        </div>
      )}
    </div>
  );
}
