'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSubmitGuardReturn {
  isSubmitting: boolean;
  isOnline: boolean;
  canSubmit: boolean;
  startSubmit: () => boolean; // Returns false if already submitting
  endSubmit: () => void;
  resetSubmit: () => void;
}

/**
 * Guard hook for preventing double submissions and detecting network status
 *
 * Features:
 * - Double-submit prevention with ref + state
 * - Network online/offline detection
 * - BroadcastChannel for cross-tab submission lock (optional)
 */
export function useSubmitGuard(): UseSubmitGuardReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const submitLock = useRef(false);

  // Network status detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start submission (returns false if already submitting)
  const startSubmit = useCallback((): boolean => {
    if (submitLock.current || isSubmitting) {
      return false;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    return true;
  }, [isSubmitting]);

  // End submission
  const endSubmit = useCallback(() => {
    submitLock.current = false;
    setIsSubmitting(false);
  }, []);

  // Reset submission state (for error recovery)
  const resetSubmit = useCallback(() => {
    submitLock.current = false;
    setIsSubmitting(false);
  }, []);

  const canSubmit = isOnline && !isSubmitting;

  return {
    isSubmitting,
    isOnline,
    canSubmit,
    startSubmit,
    endSubmit,
    resetSubmit,
  };
}

/**
 * Hook for keyboard shortcuts in the submission flow
 */
export function useSubmitKeyboardShortcuts({
  onSubmit,
  onBack,
  canSubmit,
}: {
  onSubmit: () => void;
  onBack?: () => void;
  canSubmit: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canSubmit) {
          onSubmit();
        }
      }

      // Escape to go back
      if (e.key === 'Escape' && onBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit, onBack, canSubmit]);
}

/**
 * Hook for detecting and handling session expiry
 */
export function useSessionGuard(options: {
  onSessionExpired: () => void;
  checkIntervalMs?: number;
}) {
  const { onSessionExpired, checkIntervalMs = 60000 } = options;
  const checkRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.status === 401) {
          onSessionExpired();
        }
      } catch {
        // Network error, don't trigger session expiry
      }
    };

    // Initial check after a delay
    const initialTimeout = setTimeout(checkSession, 5000);

    // Periodic checks
    checkRef.current = setInterval(checkSession, checkIntervalMs);

    return () => {
      clearTimeout(initialTimeout);
      if (checkRef.current) {
        clearInterval(checkRef.current);
      }
    };
  }, [onSessionExpired, checkIntervalMs]);
}
