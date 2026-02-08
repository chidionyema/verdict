'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => Promise<void>;
  maxRetries?: number;
  label?: string;
  retryingLabel?: string;
  className?: string;
}

/**
 * RetryButton - A button with built-in retry logic and exponential backoff
 *
 * Features:
 * - Visual feedback during retry attempts
 * - Exponential backoff (1s, 2s, 4s delays between retries)
 * - Max retry limit with exhaustion message
 * - Accessible with proper ARIA attributes
 */
export function RetryButton({
  onRetry,
  maxRetries = 3,
  label = 'Try Again',
  retryingLabel = 'Retrying...',
  className = ''
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const handleRetry = async () => {
    if (isRetrying || exhausted) return;

    setIsRetrying(true);

    try {
      await onRetry();
      // Success - reset retry count
      setRetryCount(0);
    } catch (error) {
      const newCount = retryCount + 1;
      setRetryCount(newCount);

      if (newCount >= maxRetries) {
        setExhausted(true);
      } else {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, newCount - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Auto-retry
        setIsRetrying(false);
        handleRetry();
        return;
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (exhausted) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => {
            setExhausted(false);
            setRetryCount(0);
            handleRetry();
          }}
          className={`px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition flex items-center gap-2 min-h-[44px] ${className}`}
          aria-label="Retry again"
        >
          <RefreshCw className="h-5 w-5" />
          Try Again
        </button>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Multiple attempts failed. Please check your connection.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className={`px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition flex items-center gap-2 min-h-[44px] ${className}`}
      aria-label={isRetrying ? retryingLabel : label}
      aria-busy={isRetrying}
    >
      <RefreshCw className={`h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? retryingLabel : label}
      {retryCount > 0 && !isRetrying && (
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          Attempt {retryCount + 1}/{maxRetries}
        </span>
      )}
    </button>
  );
}

export default RetryButton;
