/**
 * Centralized Error Messages for User-Friendly Error Handling
 *
 * Format: "[What happened] + [Why it might have happened] + [What to do next]"
 *
 * This module provides:
 * - Standardized error messages that are human-readable
 * - Always include a recovery action
 * - Never expose technical details to users
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  retryable: boolean;
}

// Network and API Errors
export const NetworkErrors = {
  OFFLINE: {
    title: 'No Internet Connection',
    message: 'You appear to be offline. Your changes will be saved locally and synced when you reconnect.',
    action: 'refresh',
    actionLabel: 'Check Connection',
    retryable: true,
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    message: 'The server took too long to respond. This might be due to a slow connection or high traffic.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  SERVER_ERROR: {
    title: 'Server Issue',
    message: 'We encountered a problem on our end. Our team has been notified and is working on a fix.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait a moment before trying again.',
    action: 'wait',
    actionLabel: 'Wait and Retry',
    retryable: true,
  },
} as const;

// Authentication Errors
export const AuthErrors = {
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has ended for security reasons. Please sign in again to continue.',
    action: 'login',
    actionLabel: 'Sign In',
    retryable: false,
  },
  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this content. Please sign in with a different account or contact support if you believe this is an error.',
    action: 'login',
    actionLabel: 'Sign In',
    retryable: false,
  },
  INVALID_CREDENTIALS: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect. Please check your details and try again.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  EMAIL_NOT_VERIFIED: {
    title: 'Email Not Verified',
    message: 'Please verify your email address to continue. Check your inbox for a verification link.',
    action: 'resend',
    actionLabel: 'Resend Verification Email',
    retryable: true,
  },
  PASSWORD_RESET_EXPIRED: {
    title: 'Reset Link Expired',
    message: 'This password reset link has expired or has already been used. Please request a new one.',
    action: 'request_new',
    actionLabel: 'Request New Link',
    retryable: false,
  },
} as const;

// Form Validation Errors
export const ValidationErrors = {
  REQUIRED_FIELD: (fieldName: string) => ({
    title: 'Required Field',
    message: `Please enter your ${fieldName} to continue.`,
    retryable: true,
  }),
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address (e.g., name@example.com).',
    retryable: true,
  },
  PASSWORD_TOO_SHORT: {
    title: 'Password Too Short',
    message: 'Your password must be at least 8 characters long.',
    retryable: true,
  },
  PASSWORD_REQUIREMENTS: {
    title: 'Password Requirements',
    message: 'Your password must include at least one uppercase letter, one lowercase letter, and one number.',
    retryable: true,
  },
  PASSWORDS_DONT_MATCH: {
    title: 'Passwords Don\'t Match',
    message: 'The passwords you entered don\'t match. Please try again.',
    retryable: true,
  },
  TEXT_TOO_SHORT: (minLength: number) => ({
    title: 'Content Too Short',
    message: `Please write at least ${minLength} characters to provide meaningful feedback.`,
    retryable: true,
  }),
  TEXT_TOO_LONG: (maxLength: number) => ({
    title: 'Content Too Long',
    message: `Your content exceeds the ${maxLength} character limit. Please shorten it.`,
    retryable: true,
  }),
} as const;

// Payment Errors
export const PaymentErrors = {
  CARD_DECLINED: {
    title: 'Card Declined',
    message: 'Your card was declined. This might be due to insufficient funds or your bank blocking the transaction. Please try a different card or contact your bank.',
    action: 'try_different_card',
    actionLabel: 'Try Different Card',
    retryable: true,
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: 'Your card has insufficient funds. Please try a different card or add funds to your account.',
    action: 'try_different_card',
    actionLabel: 'Try Different Card',
    retryable: true,
  },
  EXPIRED_CARD: {
    title: 'Card Expired',
    message: 'Your card has expired. Please update your card details or use a different payment method.',
    action: 'update_card',
    actionLabel: 'Update Card',
    retryable: true,
  },
  INSUFFICIENT_CREDITS: {
    title: 'Not Enough Credits',
    message: 'You don\'t have enough credits for this action. Earn credits by judging others or purchase more.',
    action: 'get_credits',
    actionLabel: 'Get Credits',
    retryable: false,
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'We couldn\'t process your payment. Please check your card details and try again, or use a different payment method.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
} as const;

// Resource Errors
export const ResourceErrors = {
  NOT_FOUND: {
    title: 'Not Found',
    message: 'We couldn\'t find what you\'re looking for. It may have been moved or deleted.',
    action: 'go_back',
    actionLabel: 'Go Back',
    retryable: false,
  },
  REQUEST_NOT_FOUND: {
    title: 'Request Not Found',
    message: 'This request doesn\'t exist or may have been removed. Browse the feed to find other requests to judge.',
    action: 'browse_feed',
    actionLabel: 'Browse Feed',
    retryable: false,
  },
  ALREADY_COMPLETED: {
    title: 'Already Completed',
    message: 'You\'ve already completed this action. Refresh the page to see your updated status.',
    action: 'refresh',
    actionLabel: 'Refresh Page',
    retryable: false,
  },
  CONTENT_REMOVED: {
    title: 'Content Removed',
    message: 'This content has been removed or is no longer available.',
    action: 'go_back',
    actionLabel: 'Go Back',
    retryable: false,
  },
} as const;

// Data Loading Errors
export const LoadingErrors = {
  FAILED_TO_LOAD: (resourceName: string) => ({
    title: `Couldn't Load ${resourceName}`,
    message: `We had trouble loading your ${resourceName.toLowerCase()}. This might be a temporary issue.`,
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  }),
  PARTIAL_LOAD: {
    title: 'Partial Data Loaded',
    message: 'Some content couldn\'t be loaded. You can continue using the app while we try to load the rest.',
    action: 'retry',
    actionLabel: 'Retry Loading',
    retryable: true,
  },
} as const;

// Submission Errors
export const SubmissionErrors = {
  FAILED_TO_SUBMIT: {
    title: 'Submission Failed',
    message: 'We couldn\'t submit your request. Your draft has been saved. Please check your connection and try again.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'We couldn\'t upload your file. Please check your connection and file size (max 10MB), then try again.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'This file type isn\'t supported. Please upload a JPG, PNG, or GIF image.',
    action: 'select_new',
    actionLabel: 'Select Different File',
    retryable: true,
  },
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'This file is too large. Please select a file smaller than 10MB.',
    action: 'select_new',
    actionLabel: 'Select Smaller File',
    retryable: true,
  },
} as const;

// Report/Moderation Errors
export const ModerationErrors = {
  REPORT_FAILED: {
    title: 'Report Failed',
    message: 'We couldn\'t submit your report. Please try again later.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  },
  ALREADY_REPORTED: {
    title: 'Already Reported',
    message: 'You\'ve already reported this content. Our team will review it soon.',
    retryable: false,
  },
} as const;

/**
 * Get a user-friendly error message from an Error object or unknown error
 */
export function getUserFriendlyError(error: unknown, context?: string): UserFriendlyError {
  // Handle string errors
  if (typeof error === 'string') {
    return parseErrorString(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return NetworkErrors.OFFLINE;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return NetworkErrors.TIMEOUT;
    }

    // Auth errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return AuthErrors.SESSION_EXPIRED;
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return AuthErrors.UNAUTHORIZED;
    }

    // Payment errors
    if (message.includes('payment') || message.includes('card')) {
      return PaymentErrors.PAYMENT_FAILED;
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return ResourceErrors.NOT_FOUND;
    }

    // Server errors
    if (message.includes('500') || message.includes('server')) {
      return NetworkErrors.SERVER_ERROR;
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate') || message.includes('too many')) {
      return NetworkErrors.RATE_LIMITED;
    }
  }

  // Default fallback
  return {
    title: 'Something Went Wrong',
    message: context
      ? `We couldn't complete this action. ${context} Please try again or contact support if the problem persists.`
      : 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
    action: 'retry',
    actionLabel: 'Try Again',
    retryable: true,
  };
}

/**
 * Parse error strings into user-friendly messages
 */
function parseErrorString(error: string): UserFriendlyError {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('network') || lowerError.includes('offline')) {
    return NetworkErrors.OFFLINE;
  }
  if (lowerError.includes('timeout')) {
    return NetworkErrors.TIMEOUT;
  }
  if (lowerError.includes('unauthorized') || lowerError.includes('session')) {
    return AuthErrors.SESSION_EXPIRED;
  }
  if (lowerError.includes('not found')) {
    return ResourceErrors.NOT_FOUND;
  }

  return {
    title: 'Error',
    message: error,
    retryable: true,
  };
}

/**
 * Get error message for HTTP status codes
 */
export function getErrorForStatusCode(status: number, context?: string): UserFriendlyError {
  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: context || 'The information you provided is invalid. Please check your input and try again.',
        retryable: true,
      };
    case 401:
      return AuthErrors.SESSION_EXPIRED;
    case 403:
      return AuthErrors.UNAUTHORIZED;
    case 404:
      return ResourceErrors.NOT_FOUND;
    case 402:
      return PaymentErrors.INSUFFICIENT_CREDITS;
    case 409:
      return ResourceErrors.ALREADY_COMPLETED;
    case 429:
      return NetworkErrors.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
    case 504:
      return NetworkErrors.SERVER_ERROR;
    default:
      return {
        title: 'Something Went Wrong',
        message: 'We encountered an unexpected error. Please try again.',
        retryable: true,
      };
  }
}

/**
 * Format an error for displaying in a toast notification
 */
export function formatErrorForToast(error: UserFriendlyError): string {
  return `${error.title}: ${error.message}`;
}
