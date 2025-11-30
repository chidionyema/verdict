'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';
import { modeClasses, type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';

interface ModeStateSuccessProps {
  mode: Mode;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

const defaultTitles = {
  community: 'Credit Earned!',
  private: 'Payment Confirmed!',
};

const defaultMessages = {
  community: 'You\'ve earned 1 credit. Ready to submit!',
  private: 'Your private submission is confirmed. Results coming soon!',
};

export function ModeStateSuccess({ 
  mode, 
  title,
  message, 
  children,
  className = '' 
}: ModeStateSuccessProps) {
  const modeColor = mode === 'community' ? 'text-green-600' : 'text-purple-600';
  const modeBg = mode === 'community' ? 'bg-green-50' : 'bg-purple-50';
  const modeBorder = mode === 'community' ? 'border-green-200' : 'border-purple-200';
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 rounded-xl border-2',
      modeBg,
      modeBorder,
      className
    )}>
      <div className="relative mb-4">
        <CheckCircle2 className={cn('h-12 w-12', modeColor)} />
        <Sparkles className={cn(
          'absolute -top-1 -right-1 h-4 w-4 animate-pulse',
          modeColor
        )} />
      </div>
      
      {title && (
        <h3 className={cn('text-lg font-bold mb-2', modeColor)}>
          {title || defaultTitles[mode]}
        </h3>
      )}
      
      {message && (
        <p className={cn('text-sm text-center mb-4', modeColor)}>
          {message || defaultMessages[mode]}
        </p>
      )}
      
      {children}
    </div>
  );
}

