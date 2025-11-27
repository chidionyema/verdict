'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  suggestion?: string;
  showHomeLink?: boolean;
  className?: string;
}

export function ErrorState({
  message,
  onRetry,
  suggestion,
  showHomeLink = false,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">{message}</h3>
      {suggestion && (
        <p className="text-red-700 mb-4 text-sm max-w-md mx-auto">{suggestion}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium min-h-[44px] min-w-[120px]"
            aria-label="Retry action"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Try Again
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/"
            className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition font-medium min-h-[44px] min-w-[120px] flex items-center justify-center"
          >
            <Home className="h-4 w-4 inline mr-2" />
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}


