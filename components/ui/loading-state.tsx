'use client';

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  status?: 'loading' | 'success' | 'error' | 'idle';
  message?: string;
  submessage?: string;
  progress?: number;
  estimatedTime?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  status = 'loading',
  message = 'Loading...',
  submessage,
  progress,
  estimatedTime,
  className = '',
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className={`${iconSizes[size]} animate-spin text-blue-600`} />;
      case 'success':
        return <CheckCircle2 className={`${iconSizes[size]} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconSizes[size]} text-red-600`} />;
      default:
        return null;
    }
  };

  const getMessageColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      {renderIcon()}
      
      <div className="mt-4 space-y-2">
        <p className={`font-medium ${textSizes[size]} ${getMessageColor()}`}>
          {message}
        </p>
        
        {submessage && (
          <p className="text-sm text-gray-600 max-w-md">
            {submessage}
          </p>
        )}

        {progress !== undefined && (
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {estimatedTime && (
          <p className="text-xs text-gray-500">
            Estimated time remaining: {estimatedTime}
          </p>
        )}
      </div>
    </div>
  );
}

// Specialized loading states for common scenarios
export function UploadingState({ progress, filename }: { progress?: number; filename?: string }) {
  return (
    <LoadingState
      status="loading"
      message="Uploading your content..."
      submessage={filename ? `Uploading ${filename}` : undefined}
      progress={progress}
      estimatedTime={progress ? `${Math.max(1, Math.round((100 - progress) * 0.1))} seconds` : undefined}
    />
  );
}

export function ProcessingState({ step, total }: { step?: number; total?: number }) {
  const progress = step && total ? (step / total) * 100 : undefined;
  
  return (
    <LoadingState
      status="loading"
      message="Processing your request..."
      submessage="Finding qualified judges and preparing your submission"
      progress={progress}
      estimatedTime="1-2 minutes"
    />
  );
}

export function WaitingForVerdictsState({ 
  received, 
  total = 10,
  estimatedTimeRemaining 
}: { 
  received: number; 
  total?: number;
  estimatedTimeRemaining?: string;
}) {
  const progress = (received / total) * 100;
  
  return (
    <LoadingState
      status="loading"
      message={`Collecting verdicts... (${received}/${total})`}
      submessage="Judges are reviewing your submission and providing feedback"
      progress={progress}
      estimatedTime={estimatedTimeRemaining || "2-4 hours"}
    />
  );
}

export function SuccessState({ message, submessage }: { message: string; submessage?: string }) {
  return (
    <LoadingState
      status="success"
      message={message}
      submessage={submessage}
    />
  );
}

export function ErrorState({
  message = "We encountered an issue. Please try again.",
  submessage,
  actionText,
  onAction
}: { 
  message?: string; 
  submessage?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <LoadingState
        status="error"
        message={message}
        submessage={submessage}
      />
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}