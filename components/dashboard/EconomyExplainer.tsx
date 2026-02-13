'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  DollarSign,
  ArrowRight,
  ArrowDown,
  HelpCircle,
  X,
  FileText,
  Gavel,
  Sparkles,
} from 'lucide-react';

interface EconomyExplainerProps {
  credits?: number;
  className?: string;
  /** Controlled mode - external state management */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the trigger button (for controlled mode) */
  hideTrigger?: boolean;
}

export function EconomyExplainer({
  credits = 0,
  className = '',
  isOpen,
  onOpenChange,
  hideTrigger = false,
}: EconomyExplainerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isExpanded = isOpen !== undefined ? isOpen : internalOpen;
  const setIsExpanded = onOpenChange || setInternalOpen;

  return (
    <>
      {/* Compact trigger - hidden in controlled mode */}
      {!hideTrigger && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg text-sm hover:shadow-md transition-all ${className}`}
        >
          <HelpCircle className="h-4 w-4 text-amber-600" />
          <span className="text-gray-700">How credits & earnings work</span>
        </button>
      )}

      {/* Expanded modal */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">How Verdict Works</h2>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Main flow diagram */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">The Two Ways to Participate</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Submit Path */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Get Feedback</h4>
                          <p className="text-sm text-gray-600">Submit requests</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Coins className="h-4 w-4 text-amber-600" />
                          <span className="text-gray-700">Costs <strong>1-4 credits</strong> per request</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-indigo-600" />
                          <span className="text-gray-700">Get <strong>3-10 verdicts</strong> from real people</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-indigo-200">
                        <p className="text-xs text-indigo-700">
                          Perfect for: Dating profile reviews, outfit checks, decision making, writing feedback
                        </p>
                      </div>
                    </div>

                    {/* Judge Path */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Gavel className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Earn Money</h4>
                          <p className="text-sm text-gray-600">Judge others</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Earn <strong>$0.60-$2.00</strong> per verdict</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Paid out <strong>weekly</strong> via Stripe</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs text-green-700">
                          Takes 1-2 min per verdict. No expertise needed - just your honest opinion!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key insight */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">You Can Do Both!</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Most users both submit requests AND judge others. They're not separate accounts - it's all you!
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                        <span>Judge to earn</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>Use earnings to buy credits</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>Submit more requests</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing table */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Credit Pricing</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">1 credit</p>
                      <p className="text-sm text-gray-600">3 verdicts</p>
                      <p className="text-xs text-gray-500">Community tier</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center border-2 border-indigo-200">
                      <p className="text-lg font-bold text-indigo-600">2 credits</p>
                      <p className="text-sm text-gray-600">5 verdicts</p>
                      <p className="text-xs text-indigo-600 font-medium">Recommended</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">4 credits</p>
                      <p className="text-sm text-gray-600">10 verdicts</p>
                      <p className="text-xs text-gray-500">Pro tier</p>
                    </div>
                  </div>
                </div>

                {/* Current balance */}
                {credits !== undefined && (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">Your current balance</p>
                    <p className="text-2xl font-bold text-gray-900">{credits} credits</p>
                    {credits === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        Judge a few requests to earn money and buy credits!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
