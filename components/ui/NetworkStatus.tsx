'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, X, RefreshCw } from 'lucide-react';

interface NetworkStatusProps {
  /** Whether to show inline or as a floating banner */
  variant?: 'floating' | 'inline';
  /** Custom message when offline */
  offlineMessage?: string;
  /** Whether to auto-hide when back online */
  autoHide?: boolean;
  /** Callback when network status changes */
  onStatusChange?: (isOnline: boolean) => void;
}

/**
 * NetworkStatus - Displays user-friendly offline/online status indicator
 *
 * Features:
 * - Detects online/offline state
 * - Shows friendly offline indicator
 * - Auto-hides when back online (optional)
 * - Accessible with aria-live announcements
 */
export function NetworkStatus({
  variant = 'floating',
  offlineMessage = "You're offline. Some features may be limited.",
  autoHide = true,
  onStatusChange,
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      setShowBanner(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange?.(true);

      // Show "Back online" message if was offline
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => {
          setShowReconnected(false);
          if (autoHide) {
            setShowBanner(false);
          }
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
      onStatusChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoHide, onStatusChange, wasOffline]);

  // Don't render anything if online and banner is hidden
  if (!showBanner && isOnline && !showReconnected) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isOnline
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Offline</span>
          </>
        )}
      </div>
    );
  }

  // Floating banner variant
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 transition-all duration-300 transform ${
        showBanner || showReconnected
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`rounded-xl shadow-lg border p-4 ${
          showReconnected
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              showReconnected ? 'bg-green-100' : 'bg-amber-100'
            }`}
          >
            {showReconnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold ${
                showReconnected ? 'text-green-800' : 'text-amber-800'
              }`}
            >
              {showReconnected ? "You're Back Online" : 'No Internet Connection'}
            </h3>
            <p
              className={`text-sm mt-0.5 ${
                showReconnected ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {showReconnected
                ? 'Your connection has been restored.'
                : offlineMessage}
            </p>

            {!isOnline && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBanner(false)}
            className={`p-1 rounded-lg transition-colors ${
              showReconnected
                ? 'text-green-500 hover:bg-green-100'
                : 'text-amber-500 hover:bg-amber-100'
            }`}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useNetworkStatus - Hook for detecting online/offline status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

export default NetworkStatus;
