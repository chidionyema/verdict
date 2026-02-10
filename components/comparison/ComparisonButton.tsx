'use client';

import { useState } from 'react';
import { Scale, ArrowRight, Crown, Target, Brain } from 'lucide-react';
import { EnhancedComparisonModal } from './EnhancedComparisonModal';
import { TouchButton } from '@/components/ui/touch-button';

interface ComparisonButtonProps {
  category?: string;
  variant?: 'default' | 'card' | 'inline';
  className?: string;
  initialQuestion?: string;
  initialContext?: string;
}

export function ComparisonButton({
  category = 'career',
  variant = 'default',
  className = '',
  initialQuestion = '',
  initialContext = ''
}: ComparisonButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === 'card') {
    return (
      <>
        <div className={`group bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white cursor-pointer hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <Scale className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
          
          <h3 className="text-xl font-bold mb-2">A/B Decision Comparison</h3>
          <p className="text-purple-100 text-sm mb-4">
            Compare two options side-by-side and get expert analysis on which choice is better
          </p>
          
          <div className="space-y-2 text-sm text-purple-200 mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Structured decision framework</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>AI consensus analysis (Pro tier)</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span>Expert-only reviewers available</span>
            </div>
          </div>

          <TouchButton
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Start Comparison
          </TouchButton>
        </div>

        <EnhancedComparisonModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={category}
          initialQuestion={initialQuestion}
          initialContext={initialContext}
        />
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors ${className}`}
        >
          <Scale className="h-4 w-4" />
          Compare Options
        </button>

        <EnhancedComparisonModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={category}
          initialQuestion={initialQuestion}
          initialContext={initialContext}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <TouchButton
        onClick={() => setIsModalOpen(true)}
        className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white ${className}`}
      >
        <Scale className="h-5 w-5 mr-2" />
        Compare Options
        <ArrowRight className="h-5 w-5 ml-2" />
      </TouchButton>

      <EnhancedComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={category}
        initialQuestion={initialQuestion}
        initialContext={initialContext}
      />
    </>
  );
}