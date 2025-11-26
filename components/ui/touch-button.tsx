'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TouchButtonProps extends ButtonProps {
  touchOptimized?: boolean;
  loading?: boolean;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ touchOptimized = true, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Base touch-friendly styles
          touchOptimized && [
            'min-h-[44px]', // WCAG AA minimum touch target
            'touch-manipulation', // Disable double-tap zoom
            'select-none', // Prevent text selection on touch
            'active:scale-[0.98]', // Subtle press feedback
            'transition-transform duration-75', // Smooth animation
          ],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

// Specialized touch buttons for common use cases
export const FABButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TouchButton
        ref={ref}
        className={cn(
          // FAB specific styles
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full shadow-lg',
          'bg-indigo-600 hover:bg-indigo-700 text-white',
          'active:shadow-xl transition-all duration-200',
          // Mobile positioning
          'md:bottom-8 md:right-8',
          className
        )}
        {...props}
      >
        {children}
      </TouchButton>
    );
  }
);

FABButton.displayName = 'FABButton';

export const MobileMenuButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TouchButton
        ref={ref}
        variant="ghost"
        className={cn(
          'w-10 h-10 p-0',
          'hover:bg-gray-100 active:bg-gray-200',
          'md:hidden', // Only show on mobile
          className
        )}
        {...props}
      >
        {children}
      </TouchButton>
    );
  }
);

MobileMenuButton.displayName = 'MobileMenuButton';

export const CardActionButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TouchButton
        ref={ref}
        variant="ghost"
        className={cn(
          'h-10 px-3 text-sm',
          'hover:bg-gray-50 active:bg-gray-100',
          'border border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </TouchButton>
    );
  }
);

CardActionButton.displayName = 'CardActionButton';

// Touch-optimized input components
export const TouchFileInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label className={cn(
        'block w-full min-h-[44px]',
        'border-2 border-dashed border-gray-300',
        'rounded-lg bg-gray-50',
        'hover:border-gray-400 hover:bg-gray-100',
        'active:border-indigo-500 active:bg-indigo-50',
        'transition-colors duration-200',
        'cursor-pointer touch-manipulation',
        'focus-within:border-indigo-500 focus-within:bg-indigo-50',
        className
      )}>
        <input
          ref={ref}
          type="file"
          className="sr-only"
          {...props}
        />
        <div className="flex items-center justify-center h-full px-4 py-3">
          <div className="text-center">
            <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm text-gray-600">Tap to select file</span>
          </div>
        </div>
      </label>
    );
  }
);

TouchFileInput.displayName = 'TouchFileInput';

// Touch-optimized toggle switch
interface TouchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function TouchToggle({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false,
  className = '' 
}: TouchToggleProps) {
  return (
    <label className={cn(
      'flex items-center justify-between',
      'min-h-[44px] px-3 py-2', // Touch-friendly sizing
      'cursor-pointer touch-manipulation',
      'hover:bg-gray-50 active:bg-gray-100',
      'transition-colors duration-200',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <div className="flex-1 mr-4">
        {label && (
          <div className="text-sm font-medium text-gray-900">
            {label}
          </div>
        )}
        {description && (
          <div className="text-xs text-gray-500 mt-1">
            {description}
          </div>
        )}
      </div>
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          'touch-manipulation',
          checked ? 'bg-indigo-600' : 'bg-gray-200',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0',
            'transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
}