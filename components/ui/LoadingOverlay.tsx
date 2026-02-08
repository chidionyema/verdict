'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  description?: string;
  showSpinner?: boolean;
}

/**
 * LoadingOverlay - Full-screen loading overlay for blocking operations
 *
 * Use this for:
 * - Payment processing
 * - Critical form submissions
 * - Any operation where the user should wait and not interact
 */
export function LoadingOverlay({
  isVisible,
  title = 'Processing...',
  description = 'Please wait while we complete your request.',
  showSpinner = true
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-description"
    >
      <div className="text-center p-8 max-w-md">
        {showSpinner && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          </div>
        )}

        <h2
          id="loading-title"
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          {title}
        </h2>

        <p
          id="loading-description"
          className="text-gray-600 mb-6"
        >
          {description}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium">
            Please do not close or refresh this page
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
