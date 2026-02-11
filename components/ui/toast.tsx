'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertCircle, Info, XCircle, Undo2, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  undoAction?: () => void | Promise<void>;
  showProgress?: boolean;
  isPersistent?: boolean;
  createdAt: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];
let timeoutMap: Map<string, NodeJS.Timeout> = new Map();

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  undoAction?: () => void | Promise<void>;
  showProgress?: boolean;
  isPersistent?: boolean;
}

export function toast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions | number = {}
): string {
  // Support legacy API where third param is duration
  const opts: ToastOptions = typeof options === 'number' ? { duration: options } : options;
  const duration = opts.duration ?? (opts.undoAction ? 5000 : 3000);

  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = {
    id,
    message,
    type,
    duration,
    action: opts.action,
    undoAction: opts.undoAction,
    showProgress: opts.showProgress ?? !!opts.undoAction,
    isPersistent: opts.isPersistent ?? false,
    createdAt: Date.now(),
  };

  toasts = [...toasts, newToast];
  notifyListeners();

  if (!opts.isPersistent) {
    const timeout = setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      timeoutMap.delete(id);
      notifyListeners();
    }, duration);
    timeoutMap.set(id, timeout);
  }

  return id;
}

export function dismissToast(id: string) {
  const timeout = timeoutMap.get(id);
  if (timeout) {
    clearTimeout(timeout);
    timeoutMap.delete(id);
  }
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

export function updateToast(id: string, updates: Partial<Pick<Toast, 'message' | 'type'>>) {
  toasts = toasts.map(t => t.id === id ? { ...t, ...updates } : t);
  notifyListeners();
}

export function useToasts() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };

    toastListeners.push(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return currentToasts;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const colors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-500 dark:text-green-400',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-500 dark:text-red-400',
    progress: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
    progress: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
};

function ToastItem({ toastItem }: { toastItem: Toast }) {
  const [isUndoing, setIsUndoing] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const colorScheme = colors[toastItem.type];
  const Icon = icons[toastItem.type];

  // Animate progress bar
  useEffect(() => {
    if (!toastItem.showProgress || toastItem.isPersistent || !toastItem.duration) return;

    const startTime = toastItem.createdAt;
    const duration = toastItem.duration;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        progressRef.current = setTimeout(updateProgress, 50);
      }
    };

    updateProgress();

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [toastItem.showProgress, toastItem.isPersistent, toastItem.duration, toastItem.createdAt]);

  const handleUndo = async () => {
    if (!toastItem.undoAction || isUndoing) return;

    setIsUndoing(true);
    try {
      await toastItem.undoAction();
      dismissToast(toastItem.id);
      toast.success('Action undone');
    } catch (error) {
      toast.error('Failed to undo');
    } finally {
      setIsUndoing(false);
    }
  };

  const handleAction = async () => {
    if (!toastItem.action) return;

    try {
      await toastItem.action.onClick();
      dismissToast(toastItem.id);
    } catch (error) {
      // Action failed, keep toast visible
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`relative overflow-hidden rounded-xl border shadow-lg max-w-sm ${colorScheme.bg} ${colorScheme.border}`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colorScheme.icon}`} aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colorScheme.text}`}>{toastItem.message}</p>

          {/* Action buttons */}
          {(toastItem.undoAction || toastItem.action) && (
            <div className="flex items-center gap-3 mt-2">
              {toastItem.undoAction && (
                <button
                  onClick={handleUndo}
                  disabled={isUndoing}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${colorScheme.text} hover:opacity-80 transition disabled:opacity-50`}
                >
                  {isUndoing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Undo2 className="w-3.5 h-3.5" />
                  )}
                  Undo
                </button>
              )}
              {toastItem.action && (
                <button
                  onClick={handleAction}
                  className={`text-sm font-medium ${colorScheme.text} hover:opacity-80 transition underline underline-offset-2`}
                >
                  {toastItem.action.label}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => dismissToast(toastItem.id)}
          className={`flex-shrink-0 p-1 hover:opacity-70 transition ${colorScheme.text}`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toastItem.showProgress && !toastItem.isPersistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
          <motion.div
            className={`h-full ${colorScheme.progress}`}
            initial={{ width: '100%' }}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastContainer() {
  const currentToasts = useToasts();

  return (
    <div
      className="fixed top-4 right-4 z-[200] space-y-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {currentToasts.map(toastItem => (
          <ToastItem key={toastItem.id} toastItem={toastItem} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Convenience functions
toast.success = (message: string, options?: ToastOptions | number) =>
  toast(message, 'success', options);

toast.error = (message: string, options?: ToastOptions | number) =>
  toast(message, 'error', options);

toast.info = (message: string, options?: ToastOptions | number) =>
  toast(message, 'info', options);

toast.warning = (message: string, options?: ToastOptions | number) =>
  toast(message, 'warning', options);

// Undo toast helper
toast.withUndo = (message: string, undoAction: () => void | Promise<void>, type: ToastType = 'success') =>
  toast(message, type, { undoAction, showProgress: true, duration: 5000 });

// Promise toast helper (shows loading -> success/error)
toast.promise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((result: T) => string);
    error: string | ((err: Error) => string);
  }
): Promise<T> => {
  const id = toast(messages.loading, 'info', { isPersistent: true });

  try {
    const result = await promise;
    dismissToast(id);
    const successMessage = typeof messages.success === 'function'
      ? messages.success(result)
      : messages.success;
    toast.success(successMessage);
    return result;
  } catch (error) {
    dismissToast(id);
    const errorMessage = typeof messages.error === 'function'
      ? messages.error(error as Error)
      : messages.error;
    toast.error(errorMessage);
    throw error;
  }
};

// Batch operation toast helper
export function createBatchToast(totalItems: number, operationName: string) {
  let completed = 0;
  let failed = 0;

  const id = toast(`${operationName}: 0/${totalItems}`, 'info', { isPersistent: true });

  return {
    increment: () => {
      completed++;
      updateToast(id, { message: `${operationName}: ${completed}/${totalItems}` });
    },
    fail: () => {
      failed++;
    },
    complete: () => {
      dismissToast(id);
      if (failed > 0) {
        toast.warning(`${operationName} completed with ${failed} errors`);
      } else {
        toast.success(`${operationName} completed successfully`);
      }
    },
  };
}

