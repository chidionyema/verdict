'use client';

import { useState } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { SplitTestModal } from './SplitTestModal';
import { TouchButton } from '@/components/ui/touch-button';

interface SplitTestButtonProps {
  category?: string;
  variant?: 'default' | 'card' | 'inline';
  className?: string;
}

export function SplitTestButton({ 
  category = 'general', 
  variant = 'default',
  className = ''
}: SplitTestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === 'card') {
    return (
      <>
        <div className={`group bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:from-violet-600 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <Zap className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
          
          <h3 className="text-xl font-bold mb-2">Split Test Photos</h3>
          <p className="text-purple-100 text-sm mb-4">
            Upload 2 photos and get expert feedback on which one works better
          </p>
          
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <Zap className="h-4 w-4" />
            <span>A/B comparison • Quick results • Clear winner</span>
          </div>

          <TouchButton
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 mt-4"
          >
            Start Split Test
          </TouchButton>
        </div>

        <SplitTestModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={category}
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
          <Zap className="h-4 w-4" />
          Split Test Photos
        </button>

        <SplitTestModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={category}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <TouchButton
        onClick={() => setIsModalOpen(true)}
        className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white ${className}`}
      >
        <Zap className="h-5 w-5 mr-2" />
        Split Test Photos
        <ArrowRight className="h-5 w-5 ml-2" />
      </TouchButton>

      <SplitTestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={category}
      />
    </>
  );
}