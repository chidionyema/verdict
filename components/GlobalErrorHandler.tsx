'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/monitoring/sentry';

/**
 * Global Error Handler Component
 *
 * Catches unhandled errors and promise rejections that Error Boundaries cannot catch:
 * - Async errors in useEffect
 * - Errors in event handlers
 * - Errors in setTimeout/setInterval callbacks
 * - Unhandled promise rejections
 *
 * Must be mounted at the root of the application (in layout.tsx)
 */
export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle synchronous errors
    const handleError = (event: ErrorEvent) => {
      // Ignore errors from browser extensions
      if (event.filename?.includes('chrome-extension://') ||
          event.filename?.includes('moz-extension://')) {
        return;
      }

      console.error('Global error caught:', event.error);

      captureException(event.error || new Error(event.message), {
        section: 'global_error_handler',
        type: 'window_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      // Don't prevent default - let the error show in console
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      console.error('Unhandled promise rejection:', error);

      captureException(error, {
        section: 'global_error_handler',
        type: 'unhandled_rejection',
        reason: String(event.reason),
      });

      // Don't prevent default - let the error show in console
    };

    // Handle navigation errors (e.g., chunk load failures)
    const handleNavigationError = (event: Event) => {
      if (event.target && 'src' in event.target) {
        const src = (event.target as HTMLScriptElement).src;

        // Check if it's a chunk loading error
        if (src?.includes('/_next/') || src?.includes('/chunks/')) {
          console.error('Navigation/chunk load error:', src);

          captureException(new Error(`Failed to load: ${src}`), {
            section: 'global_error_handler',
            type: 'resource_load_error',
            src,
          });
        }
      }
    };

    // Add listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleNavigationError, true); // Capture phase for resource errors

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleNavigationError, true);
    };
  }, []);

  return <>{children}</>;
}
