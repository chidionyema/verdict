'use client';

import { useState } from 'react';
import { RefreshCw, AlertTriangle, Wifi, Upload, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorRecoveryProps {
  error: {
    type: 'upload' | 'network' | 'submission' | 'auth' | 'quota' | 'file_format';
    message: string;
    retryable: boolean;
    context?: any;
  };
  onRetry: () => void;
  onAlternative?: () => void;
  onSupport?: () => void;
  isRetrying?: boolean;
}

const ERROR_SOLUTIONS = {
  upload: {
    title: "Upload Failed",
    icon: Upload,
    color: "orange",
    solutions: [
      "Check your internet connection",
      "Try a smaller file size (under 10MB)",
      "Make sure the file format is supported",
      "Clear your browser cache and try again"
    ],
    alternatives: [
      { label: "Try Different File", action: "change_file" },
      { label: "Use Text Instead", action: "switch_to_text" }
    ]
  },
  network: {
    title: "Connection Problem",
    icon: Wifi,
    color: "red",
    solutions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Switch to a different network if available",
      "Wait a moment and try again"
    ],
    alternatives: [
      { label: "Save Draft", action: "save_draft" },
      { label: "Try Again Later", action: "retry_later" }
    ]
  },
  submission: {
    title: "Submission Failed",
    icon: AlertTriangle,
    color: "red",
    solutions: [
      "All your content has been saved",
      "Check your credit balance",
      "Verify all required fields are filled",
      "Try submitting again"
    ],
    alternatives: [
      { label: "Review Content", action: "review_content" },
      { label: "Contact Support", action: "contact_support" }
    ]
  },
  auth: {
    title: "Authentication Issue",
    icon: AlertTriangle,
    color: "yellow",
    solutions: [
      "Your session may have expired",
      "Please log in again",
      "Your content will be saved"
    ],
    alternatives: [
      { label: "Log In", action: "login" },
      { label: "Create Account", action: "signup" }
    ]
  },
  quota: {
    title: "Not Enough Credits",
    icon: AlertTriangle,
    color: "blue",
    solutions: [
      "You need more credits to submit this request",
      "Earn credits by reviewing others' submissions",
      "Or purchase credits instantly"
    ],
    alternatives: [
      { label: "Review Others", action: "go_review" },
      { label: "Buy Credits", action: "buy_credits" }
    ]
  },
  file_format: {
    title: "Unsupported File",
    icon: Upload,
    color: "orange",
    solutions: [
      "This file format isn't supported",
      "Try JPG, PNG, or GIF for images",
      "Try MP3 or WAV for audio",
      "Convert your file and try again"
    ],
    alternatives: [
      { label: "Try Different File", action: "change_file" },
      { label: "Get Help", action: "contact_support" }
    ]
  }
};

export function ErrorRecovery({ error, onRetry, onAlternative, onSupport, isRetrying = false }: ErrorRecoveryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const solution = ERROR_SOLUTIONS[error.type];

  const handleAlternative = (action: string) => {
    if (onAlternative) {
      onAlternative();
    }
    
    // Handle specific actions
    switch (action) {
      case 'contact_support':
        if (onSupport) onSupport();
        break;
      case 'save_draft':
        localStorage.setItem('verdict_error_draft', JSON.stringify(error.context));
        break;
      // Add more action handlers as needed
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${
          solution.color === 'red' ? 'from-red-500 to-red-600' :
          solution.color === 'orange' ? 'from-orange-500 to-orange-600' :
          solution.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
          solution.color === 'blue' ? 'from-blue-500 to-blue-600' :
          'from-gray-500 to-gray-600'
        } text-white p-6`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <solution.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{solution.title}</h3>
              <p className="text-white/90">{error.message}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Solutions */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">What you can try:</h4>
            <ul className="space-y-2">
              {solution.solutions.map((sol, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  {sol}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {error.retryable && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </>
                )}
              </button>
            )}

            {/* Alternative Actions */}
            <div className="grid grid-cols-2 gap-3">
              {solution.alternatives.map((alt, index) => (
                <button
                  key={index}
                  onClick={() => handleAlternative(alt.action)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-1"
                >
                  {alt.label}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Need more help?
            </button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-xs text-gray-600 mb-2">
                    Error details: {error.type} - {error.message}
                  </p>
                  {onSupport && (
                    <button
                      onClick={onSupport}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Contact Support →
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Hook for using error recovery
export function useErrorRecovery() {
  const [error, setError] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = (errorType: string, message: string, context?: any, retryable: boolean = true) => {
    setError({
      type: errorType,
      message,
      context,
      retryable
    });
  };

  const retry = async (retryFn: () => Promise<void>) => {
    setIsRetrying(true);
    try {
      await retryFn();
      setError(null);
    } catch (err) {
      // Handle retry failure
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const clearError = () => {
    setError(null);
    setIsRetrying(false);
  };

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError
  };
}