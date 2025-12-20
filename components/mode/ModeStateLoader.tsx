'use client';

import { Loader2 } from 'lucide-react';
import { modeClasses, type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';

interface ModeStateLoaderProps {
  mode: Mode;
  message?: string;
  className?: string;
}

const defaultMessages = {
  community: 'Processing...',
  private: 'Processing payment...',
  expert: 'Connecting to expert...',
};

export function ModeStateLoader({ 
  mode, 
  message, 
  className = '' 
}: ModeStateLoaderProps) {
  const modeColor = mode === 'community' ? 'text-green-600' : 'text-purple-600';
  const modeBg = mode === 'community' ? 'bg-green-50' : 'bg-purple-50';
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 rounded-xl',
      modeBg,
      className
    )}>
      <Loader2 className={cn('h-8 w-8 animate-spin mb-4', modeColor)} />
      <p className={cn('text-sm font-medium', modeColor)}>
        {message || defaultMessages[mode as keyof typeof defaultMessages]}
      </p>
    </div>
  );
}

