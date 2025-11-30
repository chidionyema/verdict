'use client';

import { modeClasses, type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';

interface ModeProgressBarProps {
  mode: Mode;
  current: number;
  total: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function ModeProgressBar({
  mode,
  current,
  total,
  label,
  showLabel = true,
  className = '',
}: ModeProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);
  
  const modeBg = mode === 'community' 
    ? 'bg-green-200' 
    : 'bg-purple-200';
  const modeFill = mode === 'community'
    ? 'bg-gradient-to-r from-green-600 to-emerald-600'
    : 'bg-gradient-to-r from-purple-600 to-indigo-600';
  const modeText = mode === 'community'
    ? 'text-green-700'
    : 'text-purple-700';

  const defaultLabel = mode === 'community'
    ? `Judging progress: ${current}/${total}`
    : `Payment processing: ${Math.round(percentage)}%`;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={cn('text-sm font-medium', modeText)}>
            {label || defaultLabel}
          </span>
          <span className={cn('text-sm font-semibold', modeText)}>
            {current}/{total}
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full h-3 rounded-full overflow-hidden',
        modeBg
      )}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            modeFill
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {mode === 'community' && current < total && (
        <p className="text-xs text-gray-500 mt-2">
          {total - current} more {total - current === 1 ? 'judgment' : 'judgments'} to earn 1 credit
        </p>
      )}
    </div>
  );
}

