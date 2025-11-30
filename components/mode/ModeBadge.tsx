'use client';

import { Badge } from '@/components/ui/badge';
import { modeClasses, type Mode } from '@/lib/mode-colors';

interface ModeBadgeProps {
  mode: Mode;
  className?: string;
  children?: React.ReactNode;
}

const modeLabels = {
  community: 'Community',
  private: 'Private',
};

export function ModeBadge({ mode, className = '', children }: ModeBadgeProps) {
  const classes = modeClasses[mode].badge;
  
  return (
    <Badge className={`${classes} ${className}`}>
      {children || modeLabels[mode]}
    </Badge>
  );
}

