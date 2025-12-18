'use client';

import { useState, useEffect } from 'react';
import { X, Zap, ArrowDown } from 'lucide-react';

interface CreditTooltipProps {
  credits: number;
  isNewUser?: boolean;
  triggerElement?: React.RefObject<HTMLElement>;
}

export function CreditTooltip({ credits, isNewUser = false, triggerElement }: CreditTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Show tooltip for new users with 0 credits, or when they first earn credits
  const shouldShow = isNewUser && credits === 0;
  const isFirstCredit = credits === 1;

  useEffect(() => {
    if (shouldShow || isFirstCredit) {
      // Check if tooltip was already shown
      const tooltipShown = localStorage.getItem('credit_tooltip_shown') === 'true';
      if (!tooltipShown && triggerElement?.current) {
        const rect = triggerElement.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2
        });
        setIsVisible(true);

        // Auto-hide after 10 seconds
        const timer = setTimeout(() => {
          handleDismiss();
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [shouldShow, isFirstCredit, triggerElement]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('credit_tooltip_shown', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40"
        onClick={handleDismiss}
      />
      
      {/* Tooltip */}
      <div 
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-xs animate-fade-in"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <ArrowDown className="h-4 w-4 text-white rotate-180" style={{ filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.1))' }} />
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-6">
          {credits === 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-gray-900">Credits Explained</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                You currently have <strong>0 credits</strong>. Credits are earned by judging others and let you submit for free!
              </p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
                <div className="text-sm font-semibold text-indigo-900 mb-1">
                  How to earn credits:
                </div>
                <div className="text-sm text-indigo-700">
                  Judge 3 submissions → Get 1 credit → Submit for free!
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-green-900">First Credit Earned! 🎉</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Congratulations! You can now submit your own request for free using this credit.
              </p>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm font-semibold text-green-900 mb-1">
                  What you can do:
                </div>
                <div className="text-sm text-green-700">
                  Click "Submit" to use your credit and get 3 feedback reports!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}