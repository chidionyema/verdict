'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface DecisionFramingHelperProps {
  category: string;
  title: string;
  onTitleChange: (title: string) => void;
  className?: string;
}

const TITLE_EXAMPLES = {
  decision: [
    'Should I take the startup job offer?',
    'Should I move to a new city for my career?',
    'Is it time to end my relationship?',
    'Should I go back to school for a career change?',
    'Should I confront my roommate about issues?',
    'Is this business idea worth pursuing?',
  ],
  appearance: [
    'Is this outfit appropriate for my job interview?',
    'Does this hairstyle suit my face shape?',
    'Should I wear this to my first date?',
  ],
  profile: [
    'Is my LinkedIn profile photo professional enough?',
    'Does my dating profile bio attract the right people?',
    'Is my resume summary compelling?',
  ],
  writing: [
    'Is this email too formal for the situation?',
    'Does this cover letter showcase my strengths?',
    'Is this message coming across the right way?',
  ],
};

const evaluateTitleQuality = (title: string): { quality: 'poor' | 'good' | 'excellent'; feedback: string } => {
  const length = title.length;
  const hasQuestion = title.includes('?');
  const hasShould = title.toLowerCase().includes('should');
  const hasSpecifics = /\b(job|startup|move|city|relationship|career|school|business|apartment|roommate)\b/i.test(title);

  if (length < 20) {
    return { quality: 'poor', feedback: 'Too vague - add more detail about your situation' };
  }

  if (!hasQuestion) {
    return { quality: 'good', feedback: 'Good! Consider phrasing as a question for clarity' };
  }

  if (hasShould && hasSpecifics && length > 30) {
    return { quality: 'excellent', feedback: 'Excellent! Clear and specific decision' };
  }

  if (hasSpecifics) {
    return { quality: 'good', feedback: 'Good framing - judges will understand your situation' };
  }

  return { quality: 'good', feedback: 'Looks good! You can get even better advice with more specifics' };
};

export function DecisionFramingHelper({ category, title, onTitleChange, className = '' }: DecisionFramingHelperProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quality, setQuality] = useState<ReturnType<typeof evaluateTitleQuality> | null>(null);

  const examples = TITLE_EXAMPLES[category as keyof typeof TITLE_EXAMPLES] || TITLE_EXAMPLES.decision;

  useEffect(() => {
    if (title.length > 0) {
      const result = evaluateTitleQuality(title);
      setQuality(result);
    } else {
      setQuality(null);
    }
  }, [title]);

  const handleSuggestionClick = (suggestion: string) => {
    onTitleChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <label className="block text-lg font-medium text-gray-900 mb-2">
          {category === 'decision' ? 'Title your decision' : 'What do you need feedback on?'}
        </label>
        <p className="text-sm text-gray-600 mb-3">
          {category === 'decision'
            ? 'Frame your question clearly - the better your title, the better the advice'
            : 'Give a brief, clear description'}
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true && title.length === 0)}
          placeholder={examples[0]}
          className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
        />

        {/* Quality Indicator */}
        {quality && (
          <div className="mt-3 flex items-start gap-2">
            {quality.quality === 'excellent' && (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            )}
            {quality.quality === 'good' && (
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            {quality.quality === 'poor' && (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${
                quality.quality === 'excellent'
                  ? 'text-green-700'
                  : quality.quality === 'good'
                  ? 'text-blue-700'
                  : 'text-red-700'
              }`}
            >
              {quality.feedback}
            </p>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && title.length === 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Examples to get you started:</span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(example)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition text-sm text-gray-700 border-b border-gray-100 last:border-0"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Close suggestions
              </button>
            </div>
          </div>
        )}

        {/* Show suggestions button when not empty */}
        {title.length > 0 && category === 'decision' && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Lightbulb className="w-4 h-4" />
            Need help framing? See examples
          </button>
        )}
      </div>

      {/* Tips for better framing */}
      {category === 'decision' && title.length === 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-2">💡 Tips for a great title:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Start with "Should I..." to frame as a decision</li>
            <li>• Include key specifics (job, location, relationship, etc.)</li>
            <li>• Keep it concise but informative (20-80 characters)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
