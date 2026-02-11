'use client';

import { useState, useEffect, ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TerminologyTooltipProps {
  term: 'verdict' | 'credit' | 'reviewer' | 'seeker';
  children?: ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
}

const TERMINOLOGY = {
  verdict: {
    title: 'What is a Verdict?',
    description: 'A verdict is feedback from a real person reviewing your submission. Each verdict includes a rating and detailed written feedback to help you improve.',
    icon: '⚖️',
  },
  credit: {
    title: 'What are Credits?',
    description: 'Credits let you submit content for feedback. 1 credit = 1 submission with 3 reviews. Earn credits by helping others (review 3 = get 1 credit) or purchase them.',
    icon: '💎',
  },
  reviewer: {
    title: 'Who are Reviewers?',
    description: 'Reviewers are real people in the community who provide honest, helpful feedback on submissions. They earn credits by giving quality reviews.',
    icon: '👤',
  },
  seeker: {
    title: 'What is a Seeker?',
    description: 'Seekers are people looking for honest feedback on their photos, text, or ideas. They submit content and receive verdicts from reviewers.',
    icon: '🔍',
  },
};

export function TerminologyTooltip({
  term,
  children,
  showIcon = true,
  dismissible = true,
}: TerminologyTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  const info = TERMINOLOGY[term];

  // Check if user has seen this tooltip before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(`tooltip_seen_${term}`);
      setHasBeenSeen(!!seen);
    }
  }, [term]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (dismissible && typeof window !== 'undefined') {
      localStorage.setItem(`tooltip_seen_${term}`, 'true');
      setHasBeenSeen(true);
    }
  };

  return (
    <span className="relative inline-flex items-center">
      {children}
      {showIcon && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`ml-1 p-0.5 rounded-full transition-colors ${
            isOpen ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          } ${!hasBeenSeen ? 'animate-pulse' : ''}`}
          aria-label={`Learn about ${term}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleDismiss}
          />

          {/* Tooltip */}
          <div className="absolute z-50 w-64 p-3 bg-white rounded-xl shadow-xl border border-gray-200 left-0 top-full mt-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{info.icon}</span>
                <h4 className="font-semibold text-gray-900 text-sm">{info.title}</h4>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 rounded transition"
                aria-label="Close"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {info.description}
            </p>
          </div>
        </>
      )}
    </span>
  );
}

// Simple inline help text for new users
export function FirstTimeHint({
  text,
  storageKey,
}: {
  text: string;
  storageKey: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        setVisible(true);
      }
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-start justify-between gap-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-2">
        <span className="text-indigo-600 mt-0.5">💡</span>
        <p className="text-sm text-indigo-800">{text}</p>
      </div>
      <button
        onClick={dismiss}
        className="p-1 hover:bg-indigo-100 rounded transition flex-shrink-0"
        aria-label="Dismiss hint"
      >
        <X className="h-4 w-4 text-indigo-400" />
      </button>
    </div>
  );
}
