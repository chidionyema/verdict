'use client';

import { Check, Sparkles, Clock, Heart, MessageSquare, Zap, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Tooltip } from '@/components/ui/Tooltip';
import { PricingTiers, type RequestTier } from '@/components/pricing/PricingTiers';
import { subcategories } from './constants';

interface ContextStepProps {
  category: string;
  subcategory: string;
  setSubcategory: (sub: string) => void;
  context: string;
  setContext: (context: string) => void;
  requestedTone: 'encouraging' | 'honest' | 'brutally_honest';
  setRequestedTone: (tone: 'encouraging' | 'honest' | 'brutally_honest') => void;
  selectedTier: RequestTier;
  setSelectedTier: (tier: RequestTier) => void;
  userCredits: number;
  userTier: 'community' | 'standard' | 'pro';
  onUpgrade: (tier: 'standard' | 'pro') => void;
  onSubmit: () => void;
  submitting: boolean;
  uploading: boolean;
  user: { id: string } | null;
}

export function ContextStep({
  category,
  subcategory,
  setSubcategory,
  context,
  setContext,
  requestedTone,
  setRequestedTone,
  selectedTier,
  setSelectedTier,
  userCredits,
  userTier,
  onUpgrade,
  onSubmit,
  submitting,
  uploading,
  user,
}: ContextStepProps) {
  const categorySubcategories = subcategories[category] || [];

  const getPlaceholder = () => {
    switch (category) {
      case 'appearance':
        return 'Job interview at a tech startup next week - want to look professional but approachable';
      case 'profile':
        return 'Updating LinkedIn for career change from finance to marketing - need to highlight transferable skills';
      case 'writing':
        return 'Follow-up email to potential client after great meeting - want to be enthusiastic but not pushy';
      default:
        return 'Choosing between two apartments - one in downtown (expensive, walkable) vs suburbs (affordable, need car)';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Subcategory Tags */}
        {categorySubcategories.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Get more specific (optional)
            </label>
            <div className="flex flex-wrap gap-3">
              {categorySubcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubcategory(subcategory === sub ? '' : sub)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                    subcategory === sub
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Context Input */}
        <div className="space-y-6">
          <div>
            <label htmlFor="context-input" className="block text-lg font-semibold text-gray-900 mb-4">
              What's the context? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="context-input"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={`e.g., "${getPlaceholder()}"`}
                className="w-full p-6 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg resize-none"
                rows={6}
                maxLength={500}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  context.length < 20 ? 'text-red-500' : context.length >= 20 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {context.length}/500
                </span>
              </div>
            </div>
          </div>

          {context.length >= 20 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <Check className="w-4 h-4" />
                <span className="font-semibold">Perfect context!</span>
              </div>
              <p className="text-sm text-green-700">
                Experts will have everything they need to give you personalized feedback
              </p>
            </div>
          )}

          {context.length >= 20 && context.length < 80 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-800 font-semibold text-sm mb-1">Pro tip</p>
                  <p className="text-blue-700 text-sm">
                    Adding more details about your goals, timeline, or audience will get you even more tailored advice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Tier Selection */}
        {context.length >= 20 && (
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Choose your review tier
              </label>
              <p className="text-sm text-gray-600 mb-6">
                Select the level of expertise and speed you need
              </p>
            </div>
            <PricingTiers
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
              userCredits={userCredits}
              showRecommended={true}
              compact={true}
              currentUserTier={userTier}
              onUpgrade={onUpgrade}
            />
          </div>
        )}

        {/* Tone Selection */}
        {context.length >= 20 && (
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                How honest should reviewers be?
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Choose the tone of feedback you want to receive
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToneButton
                tone="encouraging"
                currentTone={requestedTone}
                onClick={() => setRequestedTone('encouraging')}
                icon={Heart}
                label="Be Encouraging"
                description="Gentle, supportive feedback with positive reinforcement"
                colorClass="green"
              />
              <ToneButton
                tone="honest"
                currentTone={requestedTone}
                onClick={() => setRequestedTone('honest')}
                icon={MessageSquare}
                label="Be Direct"
                description="Straightforward, balanced feedback (recommended)"
                colorClass="blue"
              />
              <ToneButton
                tone="brutally_honest"
                currentTone={requestedTone}
                onClick={() => setRequestedTone('brutally_honest')}
                icon={Zap}
                label="Be Brutally Honest"
                description="No sugar-coating — give it to me straight"
                colorClass="red"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-8">
          <Tooltip
            content={context.length < 20 ? `Add ${20 - context.length} more characters to continue` : ''}
            position="top"
            disabled={context.length >= 20 || submitting}
          >
            <button
              onClick={onSubmit}
              disabled={submitting || context.length < 20}
              className={`relative px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                submitting || context.length < 20
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl transform hover:scale-105'
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <Spinner size="sm" variant="white" label={uploading ? 'Uploading' : 'Creating request'} />
                  {uploading ? 'Uploading...' : 'Creating request...'}
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <span>Get Expert {category} Feedback</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Sign up & Get Feedback</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </Tooltip>
        </div>

        {context.length >= 20 && !submitting && (
          <div className="text-center mt-4 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              You'll receive feedback in ~15 minutes
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for tone buttons
interface ToneButtonProps {
  tone: 'encouraging' | 'honest' | 'brutally_honest';
  currentTone: string;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  colorClass: 'green' | 'blue' | 'red';
}

function ToneButton({ tone, currentTone, onClick, icon: Icon, label, description, colorClass }: ToneButtonProps) {
  const isSelected = currentTone === tone;
  const colors = {
    green: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      descColor: 'text-green-700',
    },
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      descColor: 'text-blue-700',
    },
    red: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      descColor: 'text-red-700',
    },
  };

  const c = colors[colorClass];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? `${c.border} ${c.bg} shadow-md`
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSelected ? c.iconBg : 'bg-gray-100'
        }`}>
          <Icon className={`w-5 h-5 ${isSelected ? c.iconColor : 'text-gray-400'}`} />
        </div>
        <h4 className={`font-semibold ${isSelected ? c.textColor : 'text-gray-900'}`}>
          {label}
        </h4>
      </div>
      <p className={`text-sm ${isSelected ? c.descColor : 'text-gray-600'}`}>
        {description}
      </p>
    </button>
  );
}
