'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface ResponseTemplate {
  starter: string;
  example: string;
}

const TEMPLATES: Record<string, ResponseTemplate[]> = {
  decision: [
    {
      starter: 'In my experience…',
      example: 'In my experience, taking calculated risks early in your career tends to pay off more than playing it safe.',
    },
    {
      starter: 'I faced something similar when…',
      example: 'I faced something similar when deciding between two job offers. I chose based on growth potential rather than immediate salary, and it worked out well.',
    },
    {
      starter: 'Have you considered…',
      example: 'Have you considered what you'd regret more in 5 years - trying and possibly failing, or never trying at all?',
    },
    {
      starter: 'One thing that helped me decide was…',
      example: 'One thing that helped me decide was making a list of non-negotiables vs nice-to-haves. It clarified what truly mattered.',
    },
  ],
  appearance: [
    {
      starter: 'The first thing I notice is…',
      example: 'The first thing I notice is that the colors work really well together and complement your skin tone.',
    },
    {
      starter: 'For this context, I\'d suggest…',
      example: 'For this context, I\'d suggest keeping accessories minimal to let the outfit speak for itself.',
    },
    {
      starter: 'What works really well here is…',
      example: 'What works really well here is the fit - it looks professional without being too formal for a startup environment.',
    },
  ],
  writing: [
    {
      starter: 'The tone comes across as…',
      example: 'The tone comes across as friendly and approachable, which is perfect for this type of outreach.',
    },
    {
      starter: 'One thing I\'d change is…',
      example: 'One thing I\'d change is the opening line - leading with a question might grab attention better than a statement.',
    },
    {
      starter: 'What makes this effective is…',
      example: 'What makes this effective is how you\'ve clearly stated the value prop without being pushy.',
    },
  ],
  profile: [
    {
      starter: 'Your profile conveys…',
      example: 'Your profile conveys expertise and approachability, which is a great combination for your field.',
    },
    {
      starter: 'To make it even stronger, consider…',
      example: 'To make it even stronger, consider adding a specific achievement or metric in the first line.',
    },
    {
      starter: 'What stands out positively is…',
      example: 'What stands out positively is how you\'ve shown personality while maintaining professionalism.',
    },
  ],
};

interface ResponseTemplatesProps {
  category: string;
  onInsert: (text: string) => void;
  className?: string;
}

export function ResponseTemplates({ category, onInsert, className = '' }: ResponseTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const templates = TEMPLATES[category] || TEMPLATES.decision;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-200 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm font-medium">Need inspiration? See helpful phrases</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={`bg-blue-50 rounded-lg border border-blue-200 overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full flex items-center justify-between p-3 hover:bg-blue-100 transition"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-700" />
          <span className="text-sm font-medium text-blue-700">Helpful phrases to get started</span>
        </div>
        <ChevronUp className="w-4 h-4 text-blue-700" />
      </button>

      <div className="px-3 pb-3 space-y-2">
        {templates.map((template, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition"
          >
            <button
              onClick={() => {
                onInsert(template.starter + ' ');
                setIsExpanded(false);
              }}
              className="w-full text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900 group-hover:text-blue-700">
                  {template.starter}
                </span>
                <span className="text-xs text-blue-600 group-hover:text-blue-800 font-medium">
                  Click to use
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">"{template.example}"</p>
            </button>
          </div>
        ))}

        <div className="pt-2 text-xs text-blue-600 text-center">
          💡 These are just starting points - add your personal touch!
        </div>
      </div>
    </div>
  );
}
