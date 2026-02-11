'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Edit3, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { triggerHaptic } from '@/components/ui/Confetti';

interface RoleSwitcherProps {
  credits?: number;
  pendingVerdicts?: number;
  className?: string;
}

/**
 * Quick role switcher for dual-role users
 * Shows context-aware prompts based on current page
 */
export function RoleSwitcher({ credits = 0, pendingVerdicts = 0, className = '' }: RoleSwitcherProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine current role based on pathname
  const isInJudgeMode = pathname?.startsWith('/judge') || pathname?.startsWith('/feed');
  const isInSubmitMode = pathname?.startsWith('/submit') || pathname?.startsWith('/requests') || pathname?.startsWith('/my-');

  // Context-aware messaging
  const getMessage = () => {
    if (isInJudgeMode && credits === 0) {
      return { text: 'Keep reviewing to earn a credit!', icon: Zap };
    }
    if (isInJudgeMode && credits > 0) {
      return { text: `${credits} credit${credits > 1 ? 's' : ''} ready to use`, icon: Sparkles };
    }
    if (isInSubmitMode && pendingVerdicts > 0) {
      return { text: `${pendingVerdicts} pending verdict${pendingVerdicts > 1 ? 's' : ''}`, icon: Eye };
    }
    return null;
  };

  const message = getMessage();

  return (
    <div className={`relative ${className}`}>
      {/* Compact toggle */}
      <button
        onClick={() => {
          triggerHaptic('light');
          setIsExpanded(!isExpanded);
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
          isExpanded
            ? 'bg-indigo-100 text-indigo-700 shadow-md'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {isInJudgeMode ? (
          <Eye className="h-4 w-4" />
        ) : (
          <Edit3 className="h-4 w-4" />
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {isInJudgeMode ? 'Reviewing' : 'Submitting'}
        </span>
        {message && (
          <span className="flex items-center gap-1 text-xs bg-white/50 px-2 py-0.5 rounded-full">
            <message.icon className="h-3 w-3" />
            {message.text}
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Switch Mode</h3>
              <p className="text-xs text-gray-600">You can do both on Verdict</p>
            </div>

            {/* Options */}
            <div className="p-2">
              {/* Submit option */}
              <Link
                href="/submit"
                onClick={() => {
                  triggerHaptic('light');
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isInSubmitMode
                    ? 'bg-indigo-50 border-2 border-indigo-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isInSubmitMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Edit3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Get Feedback</p>
                  <p className="text-xs text-gray-500">Submit photos, text, or ideas</p>
                </div>
                {credits > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {credits} credit{credits > 1 ? 's' : ''}
                  </span>
                )}
              </Link>

              {/* Review option */}
              <Link
                href="/feed"
                onClick={() => {
                  triggerHaptic('light');
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isInJudgeMode
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isInJudgeMode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Eye className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Give Feedback</p>
                  <p className="text-xs text-gray-500">Help others & earn credits</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>

            {/* Footer tip */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                Review 3 submissions = Earn 1 free credit
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Floating action button for mobile navigation
 */
export function MobileRoleFAB({ credits = 0 }: { credits?: number }) {
  const pathname = usePathname();
  const isInJudgeMode = pathname?.startsWith('/judge') || pathname?.startsWith('/feed');

  // Show opposite action
  const targetPath = isInJudgeMode ? '/submit' : '/feed';
  const targetLabel = isInJudgeMode ? 'Submit' : 'Review';
  const Icon = isInJudgeMode ? Edit3 : Eye;

  return (
    <Link
      href={targetPath}
      onClick={() => triggerHaptic('medium')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 sm:hidden"
    >
      <Icon className="h-5 w-5" />
      <span className="font-semibold">{targetLabel}</span>
      {isInJudgeMode && credits > 0 && (
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
          {credits}
        </span>
      )}
    </Link>
  );
}
