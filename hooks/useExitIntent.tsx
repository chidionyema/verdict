'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseExitIntentOptions {
  threshold?: number; // Mouse position threshold from top
  delay?: number; // Delay before enabling detection (ms)
  aggressive?: boolean; // More sensitive detection
}

interface UseExitIntentReturn {
  showExitIntent: boolean;
  dismissExitIntent: () => void;
  resetExitIntent: () => void;
}

export function useExitIntent(options: UseExitIntentOptions = {}): UseExitIntentReturn {
  const {
    threshold = 50,
    delay = 1000, // Wait 1 second before enabling
    aggressive = false
  } = options;

  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger if:
    // 1. Detection is enabled (user has been on page for delay time)
    // 2. Mouse is leaving from the top of viewport
    // 3. Mouse velocity is upward (leaving to close tab/window)
    // 4. Haven't triggered already in this session
    if (
      !isEnabled || 
      hasTriggered || 
      e.clientY > threshold ||
      e.relatedTarget // Mouse moved to another element on page
    ) {
      return;
    }

    // Additional checks for more precision
    const isLikelyExit = 
      e.clientY <= 0 || // Mouse at very top
      (aggressive && e.clientY <= threshold); // Or within threshold if aggressive

    if (isLikelyExit) {
      setShowExitIntent(true);
      setHasTriggered(true);
    }
  }, [isEnabled, hasTriggered, threshold, aggressive]);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    // Only show for actual page unload, not refresh
    if (!hasTriggered && isEnabled) {
      setShowExitIntent(true);
      setHasTriggered(true);
    }
  }, [hasTriggered, isEnabled]);

  const dismissExitIntent = useCallback(() => {
    setShowExitIntent(false);
    // Don't reset hasTriggered - only show once per session
  }, []);

  const resetExitIntent = useCallback(() => {
    setShowExitIntent(false);
    setHasTriggered(false);
  }, []);

  useEffect(() => {
    // Enable detection after delay
    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isEnabled) return;

    // Add mouse leave detection
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Add page unload detection (backup)
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEnabled, handleMouseLeave, handleBeforeUnload]);

  // Reset on page focus (user came back)
  useEffect(() => {
    const handleFocus = () => {
      if (showExitIntent) {
        setShowExitIntent(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [showExitIntent]);

  return {
    showExitIntent,
    dismissExitIntent,
    resetExitIntent
  };
}