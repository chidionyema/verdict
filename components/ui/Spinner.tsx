'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  /** Size of the spinner: 'xs' (12px), 'sm' (16px), 'md' (24px), 'lg' (32px), 'xl' (48px) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'white' | 'gray' | 'success' | 'warning';
  /** Additional CSS classes */
  className?: string;
  /** Screen reader label */
  label?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-[3px]',
};

const variantClasses = {
  primary: 'border-indigo-200 border-t-indigo-600',
  white: 'border-white/30 border-t-white',
  gray: 'border-gray-200 border-t-gray-600',
  success: 'border-green-200 border-t-green-600',
  warning: 'border-amber-200 border-t-amber-600',
};

/**
 * Standardized loading spinner component
 * Use this across the app for consistent loading indicators
 *
 * @example
 * // Basic usage
 * <Spinner />
 *
 * // Custom size and variant
 * <Spinner size="lg" variant="white" />
 *
 * // With loading text
 * <Spinner size="md" label="Loading..." />
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading',
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface SpinnerWithTextProps extends SpinnerProps {
  /** Text to display next to spinner */
  text?: string;
  /** Position of text relative to spinner */
  textPosition?: 'right' | 'bottom';
}

/**
 * Spinner with accompanying text
 */
export function SpinnerWithText({
  text = 'Loading...',
  textPosition = 'right',
  size = 'md',
  variant = 'primary',
  className,
  label,
}: SpinnerWithTextProps) {
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-indigo-600',
    white: 'text-white',
    gray: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        textPosition === 'bottom' ? 'flex-col gap-2' : 'gap-2',
        className
      )}
    >
      <Spinner size={size} variant={variant} label={label || text} />
      <span className={cn(textSizeClasses[size], textColorClasses[variant])}>
        {text}
      </span>
    </div>
  );
}

/**
 * Full-page loading spinner overlay
 */
export function SpinnerOverlay({
  text,
  variant = 'primary',
}: {
  text?: string;
  variant?: SpinnerProps['variant'];
}) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <SpinnerWithText
        size="lg"
        variant={variant}
        text={text}
        textPosition="bottom"
      />
    </div>
  );
}

/**
 * Inline spinner for buttons
 */
export function ButtonSpinner({
  variant = 'white',
  className,
}: {
  variant?: SpinnerProps['variant'];
  className?: string;
}) {
  return <Spinner size="sm" variant={variant} className={className} />;
}

export default Spinner;
