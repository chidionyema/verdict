'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * Hook to warn users about unsaved changes before leaving a page
 * Handles both browser navigation (back/forward/close) and Next.js navigation
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  options: UseUnsavedChangesOptions = {}
) {
  const {
    enabled = true,
    message = 'You have unsaved changes. Are you sure you want to leave?'
  } = options;

  const shouldWarn = enabled && hasUnsavedChanges;

  // Handle browser navigation (back, forward, close, refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (shouldWarn) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldWarn, message]);

  // Confirmation function for programmatic navigation
  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (shouldWarn) {
        const confirmed = window.confirm(message);
        if (confirmed) {
          callback();
        }
        return confirmed;
      }
      callback();
      return true;
    },
    [shouldWarn, message]
  );

  return { confirmNavigation, hasUnsavedChanges: shouldWarn };
}

/**
 * Hook to track form dirty state
 * Automatically detects when form has been modified
 */
export function useFormDirtyState<T extends Record<string, unknown>>(
  initialValues: T,
  currentValues: T
): boolean {
  return JSON.stringify(initialValues) !== JSON.stringify(currentValues);
}

/**
 * Simple hook to track if any data has been entered
 */
export function useHasData(...values: (string | File | null | undefined)[]): boolean {
  return values.some(value => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (value instanceof File) return true;
    return false;
  });
}
