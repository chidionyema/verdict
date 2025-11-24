'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function toast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, message, type, duration };
  
  toasts = [...toasts, newToast];
  notifyListeners();

  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, duration);

  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
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
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function ToastContainer() {
  const currentToasts = useToasts();

  if (currentToasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {currentToasts.map(toastItem => {
        const Icon = icons[toastItem.type];
        return (
          <div
            key={toastItem.id}
            className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm ${colors[toastItem.type]}`}
            role="alert"
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm font-medium">{toastItem.message}</p>
            <button
              onClick={() => dismissToast(toastItem.id)}
              className="flex-shrink-0 p-1 hover:opacity-70 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Convenience functions
toast.success = (message: string, duration?: number) => toast(message, 'success', duration);
toast.error = (message: string, duration?: number) => toast(message, 'error', duration);
toast.info = (message: string, duration?: number) => toast(message, 'info', duration);
toast.warning = (message: string, duration?: number) => toast(message, 'warning', duration);

