'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOperation {
  id: string;
  label: string;
  progress?: number; // 0-100
  startTime: number;
}

interface LoadingContextType {
  isLoading: boolean;
  operations: LoadingOperation[];
  startLoading: (id: string, label?: string) => void;
  stopLoading: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setLabel: (id: string, label: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<LoadingOperation[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startLoading = useCallback((id: string, label: string = 'Loading...') => {
    setOperations(prev => {
      // Don't add duplicate
      if (prev.some(op => op.id === id)) return prev;
      return [...prev, { id, label, startTime: Date.now() }];
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
    // Clear any timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setOperations(prev =>
      prev.map(op => op.id === id ? { ...op, progress: Math.min(100, Math.max(0, progress)) } : op)
    );
  }, []);

  const setLabel = useCallback((id: string, label: string) => {
    setOperations(prev =>
      prev.map(op => op.id === id ? { ...op, label } : op)
    );
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const isLoading = operations.length > 0;

  return (
    <LoadingContext.Provider value={{
      isLoading,
      operations,
      startLoading,
      stopLoading,
      updateProgress,
      setLabel,
    }}>
      {children}
      <GlobalLoadingIndicator operations={operations} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    // Return no-op defaults for SSR
    return {
      isLoading: false,
      operations: [],
      startLoading: () => {},
      stopLoading: () => {},
      updateProgress: () => {},
      setLabel: () => {},
    };
  }
  return context;
}

// Hook for tracking a specific async operation
export function useLoadingOperation(id: string) {
  const { startLoading, stopLoading, updateProgress, setLabel, operations } = useLoading();

  const operation = operations.find(op => op.id === id);

  const start = useCallback((label?: string) => {
    startLoading(id, label);
  }, [id, startLoading]);

  const stop = useCallback(() => {
    stopLoading(id);
  }, [id, stopLoading]);

  const setProgress = useCallback((progress: number) => {
    updateProgress(id, progress);
  }, [id, updateProgress]);

  const updateLabel = useCallback((label: string) => {
    setLabel(id, label);
  }, [id, setLabel]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoading(id);
    };
  }, [id, stopLoading]);

  return {
    isActive: !!operation,
    progress: operation?.progress,
    label: operation?.label,
    start,
    stop,
    setProgress,
    updateLabel,
  };
}

// Wrapper for async functions with automatic loading state
export function useAsyncOperation<T extends (...args: any[]) => Promise<any>>(
  id: string,
  fn: T,
  label?: string
): T {
  const { start, stop, updateLabel } = useLoadingOperation(id);

  return useCallback(async (...args: Parameters<T>) => {
    start(label);
    try {
      const result = await fn(...args);
      return result;
    } finally {
      stop();
    }
  }, [fn, start, stop, label]) as T;
}

// Global Loading Indicator Component
function GlobalLoadingIndicator({ operations }: { operations: LoadingOperation[] }) {
  const [showDetails, setShowDetails] = useState(false);
  const [longRunning, setLongRunning] = useState<Set<string>>(new Set());

  // Track long-running operations (>2s)
  useEffect(() => {
    const checkLongRunning = () => {
      const now = Date.now();
      const newLongRunning = new Set<string>();
      operations.forEach(op => {
        if (now - op.startTime > 2000) {
          newLongRunning.add(op.id);
        }
      });
      setLongRunning(newLongRunning);
    };

    const interval = setInterval(checkLongRunning, 500);
    checkLongRunning();

    return () => clearInterval(interval);
  }, [operations]);

  if (operations.length === 0) return null;

  const primaryOperation = operations[operations.length - 1];
  const hasProgress = primaryOperation?.progress !== undefined;
  const isLongRunning = longRunning.has(primaryOperation?.id);

  return (
    <AnimatePresence>
      {operations.length > 0 && (
        <>
          {/* Top progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-[100] h-1 bg-indigo-100 dark:bg-indigo-900/30 origin-left"
          >
            {hasProgress ? (
              <motion.div
                className="h-full bg-indigo-600 dark:bg-indigo-400"
                initial={{ width: 0 }}
                animate={{ width: `${primaryOperation.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                className="h-full bg-indigo-600 dark:bg-indigo-400"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ width: '30%' }}
              />
            )}
          </motion.div>

          {/* Detailed indicator for long-running operations */}
          {isLongRunning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
            >
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {primaryOperation.label}
                </span>
                {hasProgress && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(primaryOperation.progress || 0)}%
                  </span>
                )}
                {operations.length > 1 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    +{operations.length - 1} more
                  </span>
                )}
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {showDetails && operations.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
                  >
                    {operations.map(op => (
                      <div key={op.id} className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {op.label}
                        </span>
                        {op.progress !== undefined && (
                          <span className="text-xs text-gray-400">
                            {Math.round(op.progress)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// Export a simple loading spinner component
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full ${className}`}
    />
  );
}
