'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, X, CloudOff, AlertTriangle } from 'lucide-react';

type NetworkStatus = 'online' | 'offline' | 'slow';

interface QueuedOperation {
  id: string;
  label: string;
  execute: () => Promise<void>;
  retryCount: number;
  maxRetries: number;
}

interface NetworkContextType {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  isSlow: boolean;
  queuedOperations: number;
  queueOperation: (id: string, label: string, fn: () => Promise<void>, maxRetries?: number) => void;
  retryNow: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Default context for SSR
const defaultNetworkContext: NetworkContextType = {
  status: 'online',
  isOnline: true,
  isOffline: false,
  isSlow: false,
  queuedOperations: 0,
  queueOperation: () => {},
  retryNow: () => {},
};

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus('online');
      if (wasOffline) {
        // Process queued operations when back online
        processQueue();
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setStatus('offline');
      setShowBanner(true);
      setWasOffline(true);
    };

    // Initial check
    if (!navigator.onLine) {
      setStatus('offline');
      setShowBanner(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Detect slow connection
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const checkConnection = () => {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          setStatus('slow');
          setShowBanner(true);
        } else if (status === 'slow') {
          setStatus('online');
        }
      };

      checkConnection();
      connection.addEventListener('change', checkConnection);

      return () => {
        connection.removeEventListener('change', checkConnection);
      };
    }
  }, [status]);

  // Show banner when offline or slow
  useEffect(() => {
    if (status !== 'online') {
      setShowBanner(true);
    }
  }, [status]);

  // Queue an operation for retry
  const queueOperation = useCallback((
    id: string,
    label: string,
    fn: () => Promise<void>,
    maxRetries: number = 3
  ) => {
    setQueue(prev => {
      // Don't add duplicates
      if (prev.some(op => op.id === id)) return prev;
      return [...prev, { id, label, execute: fn, retryCount: 0, maxRetries }];
    });
  }, []);

  // Process queued operations with exponential backoff
  const processQueue = useCallback(async () => {
    if (queue.length === 0 || status === 'offline') return;

    setIsRetrying(true);

    const newQueue: QueuedOperation[] = [];

    for (const operation of queue) {
      try {
        await operation.execute();
        // Success - don't re-add to queue
      } catch (error) {
        if (operation.retryCount < operation.maxRetries) {
          // Re-add with incremented retry count
          newQueue.push({
            ...operation,
            retryCount: operation.retryCount + 1,
          });
        }
        // If max retries exceeded, drop the operation
      }
    }

    setQueue(newQueue);
    setIsRetrying(false);

    // Schedule next retry with exponential backoff if there are still items
    if (newQueue.length > 0 && status === 'online') {
      const delay = Math.min(30000, 1000 * Math.pow(2, newQueue[0].retryCount));
      retryTimeoutRef.current = setTimeout(processQueue, delay);
    }
  }, [queue, status]);

  // Manual retry
  const retryNow = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    processQueue();
  }, [processQueue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const dismissBanner = () => {
    if (status === 'online') {
      setShowBanner(false);
    }
  };

  return (
    <NetworkContext.Provider value={{
      status,
      isOnline: status === 'online',
      isOffline: status === 'offline',
      isSlow: status === 'slow',
      queuedOperations: queue.length,
      queueOperation,
      retryNow,
    }}>
      {children}
      <NetworkStatusBanner
        status={status}
        show={showBanner}
        queuedCount={queue.length}
        isRetrying={isRetrying}
        onDismiss={dismissBanner}
        onRetry={retryNow}
      />
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    return defaultNetworkContext;
  }
  return context;
}

// Network-aware fetch wrapper with auto-retry
interface FetchConfig {
  operationId?: string;
  operationLabel?: string;
  maxRetries?: number;
}

export function useNetworkFetch() {
  const { status, queueOperation } = useNetworkStatus();

  const fetchWithRetry = useCallback(
    async function fetchWithRetryFn<T>(
      url: string,
      options?: RequestInit,
      config?: FetchConfig
    ): Promise<T> {
      const execute = async (): Promise<T> => {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      };

      try {
        return await execute();
      } catch (error) {
        if (status === 'offline' && config?.operationId) {
          // Queue for retry when back online
          queueOperation(
            config.operationId,
            config.operationLabel || 'Pending request',
            async () => { await execute(); },
            config.maxRetries
          );
        }
        throw error;
      }
    },
    [status, queueOperation]
  );

  return { fetchWithRetry, isOnline: status === 'online' };
}

// Network Status Banner Component
function NetworkStatusBanner({
  status,
  show,
  queuedCount,
  isRetrying,
  onDismiss,
  onRetry,
}: {
  status: NetworkStatus;
  show: boolean;
  queuedCount: number;
  isRetrying: boolean;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  if (!show) return null;

  const config = {
    offline: {
      icon: WifiOff,
      title: "You're offline",
      description: queuedCount > 0
        ? `${queuedCount} pending ${queuedCount === 1 ? 'operation' : 'operations'} will sync when you're back online`
        : "Some features may not work until you reconnect",
      bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconClass: 'text-red-600 dark:text-red-400',
      textClass: 'text-red-800 dark:text-red-200',
    },
    slow: {
      icon: AlertTriangle,
      title: 'Slow connection detected',
      description: 'Some features may take longer to load',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400',
      textClass: 'text-amber-800 dark:text-amber-200',
    },
    online: {
      icon: Wifi,
      title: "You're back online",
      description: queuedCount > 0 ? `Syncing ${queuedCount} pending operations...` : 'All changes have been synced',
      bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconClass: 'text-green-600 dark:text-green-400',
      textClass: 'text-green-800 dark:text-green-200',
    },
  };

  const currentConfig = config[status];
  const Icon = currentConfig.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed top-2 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-md ${currentConfig.bgClass} border rounded-xl shadow-lg`}
        >
          <div className="flex items-start gap-3 p-4">
            <div className={`flex-shrink-0 ${currentConfig.iconClass}`}>
              {isRetrying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${currentConfig.textClass}`}>
                {currentConfig.title}
              </p>
              <p className={`text-sm mt-0.5 ${currentConfig.textClass} opacity-80`}>
                {currentConfig.description}
              </p>
              {status === 'offline' && queuedCount > 0 && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={`mt-2 text-sm font-medium ${currentConfig.textClass} hover:underline disabled:opacity-50`}
                >
                  {isRetrying ? 'Retrying...' : 'Retry now'}
                </button>
              )}
            </div>
            {status === 'online' && (
              <button
                onClick={onDismiss}
                className={`flex-shrink-0 ${currentConfig.iconClass} hover:opacity-70`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple offline indicator for nav/header
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { isOffline, isSlow } = useNetworkStatus();

  if (!isOffline && !isSlow) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      {isOffline ? (
        <>
          <CloudOff className="w-3.5 h-3.5 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Offline</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400">Slow</span>
        </>
      )}
    </div>
  );
}
