'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { AlertTriangle, Undo2, Redo2, RefreshCw, X, CheckCircle } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { toast } from '@/components/ui/toast';

// Action types for undo/redo system
interface Action {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  data?: any;
}

interface ErrorRecoveryContextType {
  addAction: (action: Omit<Action, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  showError: (error: ErrorInfo) => void;
  dismissError: () => void;
  retryLastAction: () => Promise<void>;
}

interface ErrorInfo {
  title: string;
  message: string;
  type: 'network' | 'validation' | 'permission' | 'unknown';
  retryable: boolean;
  context?: any;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | null>(null);

// Error Recovery Provider
export function ErrorRecoveryProvider({ children }: { children: React.ReactNode }) {
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastActionRef = useRef<Action | null>(null);

  const addAction = useCallback((actionData: Omit<Action, 'id' | 'timestamp'>) => {
    const action: Action = {
      ...actionData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    lastActionRef.current = action;
    setUndoStack(prev => [...prev.slice(-19), action]); // Keep last 20 actions
    setRedoStack([]); // Clear redo stack when new action is added
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    setIsProcessing(true);
    const action = undoStack[undoStack.length - 1];
    
    try {
      await action.undo();
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [action, ...prev]);
      
      // Show success toast
      showSuccessToast(`Undid: ${action.description}`);
    } catch (error) {
      showError({
        title: 'Undo Failed',
        message: `Could not undo "${action.description}". Please try again.`,
        type: 'unknown',
        retryable: true
      });
    } finally {
      setIsProcessing(false);
    }
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    setIsProcessing(true);
    const action = redoStack[0];
    
    try {
      await action.redo();
      setRedoStack(prev => prev.slice(1));
      setUndoStack(prev => [...prev, action]);
      
      // Show success toast
      showSuccessToast(`Redid: ${action.description}`);
    } catch (error) {
      showError({
        title: 'Redo Failed',
        message: `Could not redo "${action.description}". Please try again.`,
        type: 'unknown',
        retryable: true
      });
    } finally {
      setIsProcessing(false);
    }
  }, [redoStack]);

  const showError = useCallback((error: ErrorInfo) => {
    setCurrentError(error);
  }, []);

  const dismissError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const retryLastAction = useCallback(async () => {
    if (!lastActionRef.current) return;

    setIsProcessing(true);
    const action = lastActionRef.current;
    
    try {
      await action.redo();
      showSuccessToast(`Retried: ${action.description}`);
      setCurrentError(null);
    } catch (error) {
      showError({
        title: 'Retry Failed',
        message: `Could not retry "${action.description}". The issue may persist.`,
        type: 'unknown',
        retryable: false
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const showSuccessToast = (message: string) => {
    toast.success(message);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !isProcessing) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isProcessing]);

  return (
    <ErrorRecoveryContext.Provider value={{
      addAction,
      undo,
      redo,
      canUndo: undoStack.length > 0 && !isProcessing,
      canRedo: redoStack.length > 0 && !isProcessing,
      showError,
      dismissError,
      retryLastAction
    }}>
      {children}
      
      {/* Error Modal */}
      {currentError && (
        <ErrorModal 
          error={currentError} 
          onDismiss={dismissError}
          onRetry={currentError.retryable ? retryLastAction : undefined}
          isRetrying={isProcessing}
        />
      )}
      
      {/* Undo/Redo Floating Controls */}
      <UndoRedoControls />
    </ErrorRecoveryContext.Provider>
  );
}

// Hook to use error recovery
export function useErrorRecovery() {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within ErrorRecoveryProvider');
  }
  return context;
}

// Error Modal Component
function ErrorModal({ 
  error, 
  onDismiss, 
  onRetry,
  isRetrying 
}: {
  error: ErrorInfo;
  onDismiss: () => void;
  onRetry?: () => void;
  isRetrying: boolean;
}) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return '🌐';
      case 'validation':
        return '❌';
      case 'permission':
        return '🔒';
      default:
        return '⚠️';
    }
  };

  const getErrorAdvice = () => {
    switch (error.type) {
      case 'network':
        return 'Check your internet connection and try again.';
      case 'validation':
        return 'Please review your input and correct any errors.';
      case 'permission':
        return 'You may need to log in or request access.';
      default:
        return 'This is unexpected. Please try again or contact support if it persists.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getErrorIcon()}</div>
            <h3 className="text-lg font-bold text-gray-900">{error.title}</h3>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss error message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">{error.message}</p>
          <p className="text-sm text-gray-500">{getErrorAdvice()}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onRetry && (
            <TouchButton
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </TouchButton>
          )}
          
          <TouchButton
            onClick={onDismiss}
            variant="outline"
            className={`${onRetry ? 'flex-1' : 'w-full'} border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            {onRetry ? 'Cancel' : 'OK'}
          </TouchButton>
        </div>
      </div>
    </div>
  );
}

// Floating Undo/Redo Controls
function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo } = useErrorRecovery();
  const [isVisible, setIsVisible] = useState(false);

  // Show controls when actions are available
  useEffect(() => {
    setIsVisible(canUndo || canRedo);
  }, [canUndo, canRedo]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-6 flex flex-col gap-2 z-40">
      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`
          p-3 rounded-full shadow-lg transition-all duration-200 
          ${canUndo 
            ? 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-xl border border-gray-200' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
        title="Undo (Cmd/Ctrl + Z)"
        aria-label="Undo last action"
      >
        <Undo2 className="w-5 h-5" />
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`
          p-3 rounded-full shadow-lg transition-all duration-200
          ${canRedo 
            ? 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-xl border border-gray-200' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
        title="Redo (Cmd/Ctrl + Shift + Z)"
        aria-label="Redo last undone action"
      >
        <Redo2 className="w-5 h-5" />
      </button>
    </div>
  );
}

// Hook for creating trackable actions
export function useTrackableAction() {
  const { addAction, showError } = useErrorRecovery();

  const executeAction = useCallback(async (
    actionConfig: {
      description: string;
      type: string;
      action: () => Promise<any>;
      undo: () => Promise<void> | void;
      redo?: () => Promise<void> | void;
    }
  ): Promise<any | null> => {
    try {
      const result = await actionConfig.action();
      
      // Add to undo stack
      addAction({
        type: actionConfig.type,
        description: actionConfig.description,
        undo: actionConfig.undo,
        redo: actionConfig.redo || actionConfig.action
      });
      
      return result;
    } catch (error: any) {
      // Determine error type
      let errorType: ErrorInfo['type'] = 'unknown';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'network';
      } else if (error.message?.includes('validation') || error.status === 400) {
        errorType = 'validation';
      } else if (error.status === 401 || error.status === 403) {
        errorType = 'permission';
      }

      showError({
        title: 'Action Failed',
        message: error.message || 'We couldn\'t complete this action. Please try again or contact support if the problem persists.',
        type: errorType,
        retryable: errorType !== 'validation',
        context: { actionType: actionConfig.type }
      });
      
      return null;
    }
  }, [addAction, showError]);

  return { executeAction };
}

// Success Toast Component
export function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
      <CheckCircle className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button 
        onClick={onDismiss} 
        className="ml-2 hover:bg-green-700 p-1 rounded"
        aria-label="Dismiss success message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Animation styles
export function ErrorRecoveryStyles() {
  return (
    <style jsx global>{`
      @keyframes scale-in {
        0% { transform: scale(0.9); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes slide-up {
        0% { transform: translateY(100%); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
      
      .animate-slide-up {
        animation: slide-up 0.3s ease-out;
      }
    `}</style>
  );
}