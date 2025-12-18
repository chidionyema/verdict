'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ContextualTooltipProps {
  content: React.ReactNode;
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  className?: string;
  helpIconClass?: string;
  persistent?: boolean; // For onboarding-style tooltips
}

export function ContextualTooltip({
  content,
  trigger = 'hover',
  position = 'top',
  delay = 200,
  children,
  className = '',
  helpIconClass = '',
  persistent = false
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Auto-position tooltip to avoid overflow
  const updatePosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;
    
    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip would overflow and adjust
    if (position === 'top' && rect.top - tooltipRect.height < 10) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && rect.bottom + tooltipRect.height > viewport.height - 10) {
      newPosition = 'top';
    } else if (position === 'left' && rect.left - tooltipRect.width < 10) {
      newPosition = 'right';
    } else if (position === 'right' && rect.right + tooltipRect.width > viewport.width - 10) {
      newPosition = 'left';
    }

    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    if (trigger === 'hover' && delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!persistent) {
      setIsVisible(false);
    }
  };

  const toggleTooltip = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs';
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };
    
    return `${baseClasses} ${positionClasses[actualPosition]} ${className}`;
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    const arrowPositions = {
      top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
      left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
      right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1'
    };
    
    return `${baseClasses} ${arrowPositions[actualPosition]}`;
  };

  const triggerProps = {
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip
    }),
    ...(trigger === 'click' && {
      onClick: toggleTooltip
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip
    })
  };

  return (
    <div ref={triggerRef} className="relative inline-block" {...triggerProps}>
      {children}
      
      {isVisible && (
        <>
          <div
            ref={tooltipRef}
            className={getTooltipClasses()}
            role="tooltip"
          >
            {persistent && (
              <button
                onClick={() => setIsVisible(false)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {content}
            <div className={getArrowClasses()} />
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for adding help icons with tooltips
export function HelpTooltip({ 
  content, 
  position = 'top',
  className = '' 
}: { 
  content: React.ReactNode; 
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <ContextualTooltip content={content} position={position} trigger="hover">
      <HelpCircle className={`h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help ${className}`} />
    </ContextualTooltip>
  );
}