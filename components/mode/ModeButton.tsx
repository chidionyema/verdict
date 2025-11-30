'use client';

import { Button } from '@/components/ui/button';
import { modeClasses, type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';

interface ModeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  mode: Mode;
  variant?: 'solid' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export function ModeButton({ 
  mode, 
  variant = 'solid', 
  children, 
  className,
  ...props 
}: ModeButtonProps) {
  const baseClasses = variant === 'solid' 
    ? modeClasses[mode].button 
    : modeClasses[mode].buttonOutline;

  return (
    <Button
      className={cn(
        baseClasses,
        'px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-h-[48px]',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

