/**
 * Production Monitoring with Sentry
 * 
 * Provides comprehensive error tracking, performance monitoring,
 * and custom metrics for production visibility
 */

// @ts-ignore - Sentry types may not match exactly
import * as Sentry from '@sentry/nextjs';
import { log } from '@/lib/logger';

// Initialize Sentry only in production
export function initMonitoring() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production',
    
    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% for launch, reduce later
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur
    
    // Integrations
    integrations: [
      // @ts-ignore
      new (Sentry as any).BrowserTracing({
        // Navigation transactions
        // @ts-ignore
        routingInstrumentation: (Sentry as any).nextRouterInstrumentation,
        
        // API call tracing
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.verdict\.com/,
        ],
      }),
      // @ts-ignore
      new (Sentry as any).Replay({
        // Mask sensitive content
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
        
        // Privacy
        maskTextClass: 'sentry-mask',
        blockClass: 'sentry-block',
      }),
    ],
    
    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      
      // Network errors
      /NetworkError/i,
      /Failed to fetch/i,
    ],
    
    // Before send hook for PII scrubbing
    beforeSend(event: any, hint: any) {
      // Remove sensitive data
      if (event.request) {
        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // Remove sensitive query params
        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/token=[^&]+/g, 'token=***')
            .replace(/session=[^&]+/g, 'session=***');
        }
      }
      
      // Remove user emails from error messages
      if (event.exception?.values) {
        event.exception.values.forEach((exception: any) => {
          if (exception.value) {
            exception.value = exception.value.replace(
              /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
              '***@***.***'
            );
          }
        });
      }
      
      return event;
    },
  });
}

// Custom error boundary reporting
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
) {
  log.error('Captured exception', error, context);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        section: context?.section || 'unknown',
      },
      extra: context,
    });
  }
}

// Performance monitoring
export function measurePerformance(
  transactionName: string,
  operation: () => Promise<any>
) {
  // @ts-ignore
  const transaction = (Sentry as any).startTransaction({
    name: transactionName,
    op: 'custom',
  });
  
  // @ts-ignore
  (Sentry as any).getCurrentHub().configureScope((scope: any) => {
    scope.setSpan(transaction);
  });
  
  return operation()
    .then(result => {
      transaction.setStatus('ok');
      return result;
    })
    .catch(error => {
      transaction.setStatus('internal_error');
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

// Custom metrics tracking
export const metrics = {
  // Payment metrics
  trackPaymentSuccess: (amount: number, credits: number) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('payment.success', 1);
      // @ts-ignore
      (Sentry as any).metrics?.distribution?.('payment.amount', amount);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  trackPaymentFailure: (error: string, amount?: number) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('payment.failure', 1);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  // Request metrics
  trackRequestCreated: (type: string, mode: string) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('request.created', 1);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  trackJudgmentCompleted: (responseTime: number) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('judgment.completed', 1);
      // @ts-ignore
      (Sentry as any).metrics?.distribution?.('judgment.response_time', responseTime);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  // User journey metrics
  trackOnboardingStep: (step: string, completed: boolean) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('onboarding.step', 1);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  trackOnboardingComplete: (duration: number) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('onboarding.completed', 1);
      // @ts-ignore
      (Sentry as any).metrics?.distribution?.('onboarding.duration', duration);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  // API performance
  trackAPICall: (endpoint: string, duration: number, status: number) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.distribution?.('api.duration', duration);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
  
  // Error tracking
  trackErrorRecovery: (errorType: string, recovered: boolean) => {
    try {
      // @ts-ignore
      (Sentry as any).metrics?.increment?.('error.recovery', 1);
    } catch (e) {
      // Metrics not available, ignore
    }
  },
};

// Breadcrumb tracking for better error context
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

// User context tracking (privacy-safe)
export function setUserContext(userId: string, traits?: {
  plan?: string;
  totalRequests?: number;
  isJudge?: boolean;
}) {
  Sentry.setUser({
    id: userId,
    // Don't send email or other PII
    data: {
      plan: traits?.plan || 'free',
      total_requests: traits?.totalRequests || 0,
      is_judge: traits?.isJudge || false,
    },
  });
}

// Feature flag tracking
export function trackFeatureFlag(flag: string, value: boolean | string) {
  Sentry.setTag(`feature.${flag}`, value.toString());
}

// Helper functions
function getAmountRange(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 10) return '0-10';
  if (dollars < 25) return '10-25';
  if (dollars < 50) return '25-50';
  if (dollars < 100) return '50-100';
  return '100+';
}

function getCreditPackage(credits: number): string {
  if (credits <= 3) return 'starter';
  if (credits <= 10) return 'basic';
  if (credits <= 25) return 'pro';
  if (credits <= 50) return 'business';
  return 'enterprise';
}