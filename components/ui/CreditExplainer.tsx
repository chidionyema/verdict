'use client';

import { Coins, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface CreditExplainerProps {
  variant?: 'inline' | 'badge' | 'tooltip' | 'banner';
  credits?: number;
  showIcon?: boolean;
  className?: string;
}

/**
 * Standardized credit explanation component
 * Use this everywhere credits are mentioned to ensure consistent messaging:
 * "1 credit = 1 submission = 3 feedback reports"
 */
export function CreditExplainer({
  variant = 'inline',
  credits,
  showIcon = true,
  className = ''
}: CreditExplainerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const CREDIT_EQUATION = "1 credit = 1 submission = 3 feedback reports";

  if (variant === 'inline') {
    return (
      <span className={`text-sm text-gray-600 ${className}`}>
        {showIcon && <Coins className="inline h-3.5 w-3.5 mr-1 text-amber-500" />}
        {credits !== undefined && (
          <span className="font-medium text-gray-900">{credits} credit{credits !== 1 ? 's' : ''}</span>
        )}
        {credits !== undefined && ' • '}
        <span className="text-gray-500">{CREDIT_EQUATION}</span>
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 ${className}`}>
        {showIcon && <Coins className="h-3.5 w-3.5 text-amber-600" />}
        {credits !== undefined && (
          <span className="font-semibold text-amber-800">{credits}</span>
        )}
        <span className="text-xs text-amber-700">{CREDIT_EQUATION}</span>
      </div>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {credits !== undefined && (
            <>
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{credits} credit{credits !== 1 ? 's' : ''}</span>
            </>
          )}
          <HelpCircle className="h-3.5 w-3.5" />
        </button>

        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
            <div className="font-medium mb-1">How credits work:</div>
            <div className="text-gray-300">{CREDIT_EQUATION}</div>
            <div className="text-gray-400 text-xs mt-2">
              Earn credits by reviewing others, or pay for instant private submissions.
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-indigo-50 border border-indigo-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Coins className="h-5 w-5 text-amber-600" />
            </div>
          )}
          <div>
            {credits !== undefined && (
              <div className="font-bold text-gray-900">
                You have {credits} credit{credits !== 1 ? 's' : ''}
              </div>
            )}
            <div className="text-sm text-indigo-800">
              <strong>{CREDIT_EQUATION}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Simple inline text for credit equation
 * Use in sentences like: "You have 3 credits. {CreditEquation}"
 */
export function CreditEquation({ className = '' }: { className?: string }) {
  return (
    <span className={`text-gray-600 ${className}`}>
      1 credit = 1 submission = 3 feedback reports
    </span>
  );
}

/**
 * Credit balance display with explanation
 */
export function CreditBalance({
  credits,
  showExplanation = true,
  className = ''
}: {
  credits: number;
  showExplanation?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-gray-900">{credits}</span>
        <span className="text-gray-600">credit{credits !== 1 ? 's' : ''}</span>
      </div>
      {showExplanation && (
        <span className="text-sm text-gray-500">
          (each = 1 submission with 3 reports)
        </span>
      )}
    </div>
  );
}
