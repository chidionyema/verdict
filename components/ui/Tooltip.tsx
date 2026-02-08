'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  /** Content to show in tooltip */
  content: string;
  /** The element to wrap */
  children: React.ReactNode;
  /** Position of tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional classes for tooltip */
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

/**
 * Tooltip wrapper component
 * Wraps any element and shows a tooltip on hover
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150',
            positionClasses[position],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Helper component for disabled buttons with explanatory tooltips
 * Wraps a disabled button and shows why it's disabled
 */
export function DisabledButtonTooltip({
  children,
  reason,
  position = 'top',
}: {
  children: React.ReactNode;
  reason: string;
  position?: TooltipProps['position'];
}) {
  return (
    <Tooltip content={reason} position={position}>
      <span className="inline-block">{children}</span>
    </Tooltip>
  );
}

export default Tooltip;
