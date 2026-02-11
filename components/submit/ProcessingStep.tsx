'use client';

import { Zap, CheckCircle } from 'lucide-react';

interface ProcessingStepProps {
  mode?: 'community' | 'private';
}

export function ProcessingStep({ mode }: ProcessingStepProps) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <Zap className="h-8 w-8 text-white animate-pulse" />
        <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {mode === 'community' ? 'Submitting to Community...' : 'Processing Payment...'}
      </h2>
      <p className="text-gray-600 mb-4">
        {mode === 'community'
          ? 'Your submission is being added to the community feed for review.'
          : 'Your payment is being securely processed. This takes 5-10 seconds.'}
      </p>

      <div className="max-w-xs mx-auto space-y-3 text-left">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
          <span className="text-gray-700">
            {mode === 'community' ? 'Credit verified' : 'Payment authorized'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="text-gray-700">Creating your request...</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <span>Notifying reviewers</span>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800 font-medium">Please do not close this window</p>
      </div>
    </div>
  );
}
