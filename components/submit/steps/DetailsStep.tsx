'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { StepProps, CATEGORIES } from '../types';

export function DetailsStep({
  data,
  onUpdate,
  onNext,
  onBack,
  userCredits,
  isOnline,
}: StepProps) {
  const [contextTouched, setContextTouched] = useState(false);

  const isValid = data.category && data.context.length >= 20;

  // Smart category suggestion based on context
  useEffect(() => {
    if (data.context.length > 30 && !data.category) {
      const suggestedCategory = detectCategoryFromContext(data.context);
      if (suggestedCategory) {
        onUpdate({ category: suggestedCategory });
      }
    }
  }, [data.context, data.category, onUpdate]);

  // Get smart placeholder based on media type and request type
  const getPlaceholder = () => {
    if (data.requestType === 'comparison') {
      return "What should judges compare? What matters most to you? (e.g., 'Which photo looks more approachable for my dating profile?')";
    }
    if (data.mediaType === 'text') {
      return "What kind of feedback do you want? What's the purpose of this writing? Who's the audience?";
    }
    return "What do you want feedback on? What's the context? (e.g., 'Is this photo good for my LinkedIn? I want to look professional but approachable.')";
  };

  const handleCategorySelect = (categoryId: string) => {
    onUpdate({ category: categoryId });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleContinue = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Preview of uploaded content */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
        {data.mediaType === 'photo' && data.mediaUrls[0] && (
          <img
            src={data.mediaUrls[0]}
            alt="Your upload"
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        {data.mediaType === 'text' && (
          <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {data.requestType === 'standard' ? 'Standard Feedback' :
             data.requestType === 'comparison' ? 'A/B Comparison' : 'Split Test'}
          </p>
          <p className="text-sm text-gray-600">
            {data.mediaType === 'photo'
              ? `${data.mediaUrls.length} photo${data.mediaUrls.length > 1 ? 's' : ''} uploaded`
              : `${data.textContent.length} characters`}
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          What area is this about?
        </h3>
        <p className="text-gray-600 mb-4">
          This helps us match you with the right judges
        </p>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Category"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              role="radio"
              aria-checked={data.category === category.id}
              className={`p-4 min-h-[80px] rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
                data.category === category.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {data.category === category.id && (
                      <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{category.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Context Input */}
      <div>
        <label htmlFor="context" className="block text-lg font-semibold text-gray-900 mb-2">
          What do you want to know?
        </label>
        <p className="text-gray-600 mb-4">
          The more specific you are, the better feedback you'll get
        </p>

        <textarea
          id="context"
          value={data.context}
          onChange={(e) => {
            onUpdate({ context: e.target.value });
            setContextTouched(true);
          }}
          onBlur={() => setContextTouched(true)}
          placeholder={getPlaceholder()}
          className={`w-full h-32 px-4 py-3 border rounded-xl resize-none transition-all ${
            contextTouched && data.context.length < 20 && data.context.length > 0
              ? 'border-amber-400 focus:ring-amber-500'
              : 'border-gray-300 focus:ring-indigo-500'
          } focus:ring-2 focus:border-transparent`}
          aria-describedby="context-help"
          aria-invalid={contextTouched && data.context.length < 20 && data.context.length > 0}
        />

        <div className="flex justify-between items-center mt-2">
          <p id="context-help" className={`text-sm ${
            contextTouched && data.context.length < 20 && data.context.length > 0
              ? 'text-amber-600'
              : 'text-gray-500'
          }`}>
            {contextTouched && data.context.length < 20 && data.context.length > 0
              ? `${20 - data.context.length} more characters needed`
              : 'Minimum 20 characters'
            }
          </p>
          <p className={`text-sm flex items-center gap-1 ${
            data.context.length >= 20 ? 'text-green-600' : 'text-gray-500'
          }`}>
            {data.context.length}/20
            {data.context.length >= 20 && <Check className="h-4 w-4" />}
          </p>
        </div>

        {/* Quick prompts */}
        {data.context.length < 10 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">QUICK START</p>
            <div className="flex flex-wrap gap-2">
              {getQuickPrompts(data.category, data.mediaType).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onUpdate({ context: prompt })}
                  className="px-4 py-2 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  {prompt.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 min-h-[48px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValid || !isOnline}
          className={`ml-auto px-8 py-3 min-h-[48px] rounded-xl font-semibold text-white transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            isValid && isOnline
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Continue
          <span className="text-white/70">→</span>
        </button>
      </div>

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

// Helper: Detect category from context text
function detectCategoryFromContext(text: string): string | null {
  const lower = text.toLowerCase();

  if (/dating|tinder|bumble|hinge|profile|match|swipe/.test(lower)) return 'dating';
  if (/linkedin|resume|job|career|interview|professional/.test(lower)) return 'career';
  if (/outfit|clothes|style|hair|look|appearance|photo/.test(lower)) return 'appearance';
  if (/essay|writing|copy|message|email|text|bio/.test(lower)) return 'writing';
  if (/decision|choose|should i|advice|help me decide/.test(lower)) return 'decision';

  return null;
}

// Helper: Get quick prompts based on category and media type
function getQuickPrompts(category: string, mediaType: string): string[] {
  const prompts: Record<string, string[]> = {
    appearance: [
      "Rate this photo 1-10 and tell me how to improve it",
      "Would this photo work for a dating profile?",
      "Does this outfit look put together and stylish?",
    ],
    dating: [
      "Is this a good main photo for my dating profile?",
      "How can I improve my bio to get more matches?",
      "Does this message come across as interesting?",
    ],
    career: [
      "Does this look professional for LinkedIn?",
      "How can I improve this resume section?",
      "Would you hire someone with this profile photo?",
    ],
    writing: [
      "Is this clear and engaging? How can I improve the tone?",
      "Does this copy sound persuasive?",
      "What's missing from this writing?",
    ],
    decision: [
      "What would you choose and why?",
      "What am I not considering here?",
      "Help me weigh the pros and cons",
    ],
  };

  return prompts[category] || prompts.appearance;
}
