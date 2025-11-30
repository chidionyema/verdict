'use client';

import { ModeBadge } from './ModeBadge';
import { Eye, Lock } from 'lucide-react';
import { type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';

interface ModeIndicatorProps {
  mode: Mode;
  showIcon?: boolean;
  showBadge?: boolean;
  className?: string;
  compact?: boolean;
}

export function ModeIndicator({
  mode,
  showIcon = true,
  showBadge = true,
  compact = false,
  className = '',
}: ModeIndicatorProps) {
  const Icon = mode === 'community' ? Eye : Lock;
  const iconColor = mode === 'community' ? 'text-green-600' : 'text-purple-600';
  const iconBg = mode === 'community' ? 'bg-green-100' : 'bg-purple-100';
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && (
          <div className={cn('p-1.5 rounded-md', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        )}
        {showBadge && <ModeBadge mode={mode} className="text-xs" />}
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showIcon && (
        <div className={cn('p-2 rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      )}
      {showBadge && <ModeBadge mode={mode} />}
      <div className="flex-1">
        <p className={cn(
          'text-sm font-medium',
          mode === 'community' ? 'text-green-700' : 'text-purple-700'
        )}>
          {mode === 'community' 
            ? 'Public submission - will appear in feed'
            : 'Private submission - completely confidential'
          }
        </p>
      </div>
    </div>
  );
}

