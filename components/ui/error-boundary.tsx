'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { TouchButton } from './touch-button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'feature';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  lastResetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      lastResetKeys: props.resetKeys,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorId = Math.random().toString(36).substring(2, 9);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    const { resetKeys } = props;
    const { lastResetKeys, hasError } = state;

    // Reset error state when resetKeys change
    if (
      hasError &&
      resetKeys &&
      lastResetKeys &&
      resetKeys.some((key, idx) => key !== lastResetKeys[idx])
    ) {
      return {
        hasError: false,
        error: null,
        errorId: null,
        lastResetKeys: resetKeys,
      };
    }

    if (resetKeys !== lastResetKeys) {
      return { lastResetKeys: resetKeys };
    }

    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Report to error tracking service
    this.props.onError?.(error, errorInfo);

    // Also send to performance monitor if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        errorId={this.state.errorId}
        level={this.props.level}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  level?: 'page' | 'component' | 'feature';
  onRetry: () => void;
  onReload: () => void;
}

function ErrorFallback({ error, errorId, level = 'component', onRetry, onReload }: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isComponentLevel = level === 'component';

  return (
    <div className={`
      flex flex-col items-center justify-center text-center
      ${isPageLevel ? 'min-h-[60vh] px-6' : 'p-6'}
      ${isComponentLevel ? 'border border-red-200 rounded-lg bg-red-50' : ''}
    `}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {isPageLevel ? 'Something went wrong' : 'Component Error'}
      </h2>

      <p className="text-gray-600 mb-4 max-w-md">
        {isPageLevel 
          ? 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'
          : 'This component encountered an error and couldn\'t be displayed properly.'
        }
      </p>

      {/* Error details (development only) */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer mb-2">
            Error Details (Dev Only)
          </summary>
          <div className="bg-gray-100 rounded p-3 text-xs text-gray-700 font-mono overflow-auto max-w-md max-h-32">
            <div className="text-red-600 font-bold">{error.name}</div>
            <div className="mb-2">{error.message}</div>
            {error.stack && (
              <div className="text-gray-500 text-xs whitespace-pre-wrap">
                {error.stack.split('\n').slice(0, 5).join('\n')}
              </div>
            )}
          </div>
        </details>
      )}

      {/* Error ID for support */}
      {errorId && (
        <p className="text-xs text-gray-400 mb-4">
          Error ID: {errorId}
        </p>
      )}

      <div className="flex gap-3">
        <TouchButton
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </TouchButton>

        {isPageLevel && (
          <TouchButton
            onClick={onReload}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Reload Page
          </TouchButton>
        )}
      </div>

      {/* Contact support link */}
      {isPageLevel && (
        <p className="text-sm text-gray-500 mt-6">
          Still having issues?{' '}
          <a 
            href="/support" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Contact Support
          </a>
        </p>
      )}
    </div>
  );
}

// Convenience wrappers for different error boundary levels
export function PageErrorBoundary({ children, ...props }: Omit<Props, 'level'>) {
  return (
    <ErrorBoundary {...props} level="page">
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, ...props }: Omit<Props, 'level'>) {
  return (
    <ErrorBoundary {...props} level="component">
      {children}
    </ErrorBoundary>
  );
}

export function FeatureErrorBoundary({ children, ...props }: Omit<Props, 'level'>) {
  return (
    <ErrorBoundary {...props} level="feature">
      {children}
    </ErrorBoundary>
  );
}

// Hook for manual error throwing (useful for async errors)
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}