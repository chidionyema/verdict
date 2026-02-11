'use client';

// ============================================
// UX Analytics Types
// ============================================

interface PageViewEvent {
  type: 'page_view';
  path: string;
  referrer: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface FeatureUsageEvent {
  type: 'feature_usage';
  feature: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface ErrorEvent {
  type: 'error';
  errorType: string;
  message: string;
  stack?: string;
  componentName?: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface PerformanceEvent {
  type: 'performance';
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  sessionId: string;
}

interface UserFlowEvent {
  type: 'user_flow';
  flowName: string;
  step: string;
  stepNumber: number;
  totalSteps: number;
  status: 'started' | 'completed' | 'abandoned';
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface InteractionEvent {
  type: 'interaction';
  element: string;
  action: 'click' | 'hover' | 'focus' | 'scroll' | 'swipe';
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

type AnalyticsEvent =
  | PageViewEvent
  | FeatureUsageEvent
  | ErrorEvent
  | PerformanceEvent
  | UserFlowEvent
  | InteractionEvent;

// ============================================
// Analytics Queue & Batching
// ============================================

class AnalyticsQueue {
  private queue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 20;
  private readonly flushInterval = 5000; // 5 seconds
  private readonly endpoint = '/api/analytics/events';

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
      // Flush on visibility change (tab switch)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  add(event: AnalyticsEvent) {
    this.queue.push(event);

    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          this.endpoint,
          JSON.stringify({ events })
        );
      } else {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
          keepalive: true,
        });
      }
    } catch (error) {
      // Re-queue events on failure
      this.queue = [...events, ...this.queue];
      console.error('Failed to flush analytics:', error);
    }
  }
}

// ============================================
// Session Management
// ============================================

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('user_id') || undefined;
}

// ============================================
// Analytics Instance
// ============================================

const analyticsQueue = typeof window !== 'undefined' ? new AnalyticsQueue() : null;

// ============================================
// Public API
// ============================================

export const analytics = {
  /**
   * Track a page view
   */
  pageView(path: string) {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'page_view',
      path,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getUserId(),
    });
  },

  /**
   * Track feature usage
   */
  trackFeature(feature: string, action: string, metadata?: Record<string, any>) {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'feature_usage',
      feature,
      action,
      metadata,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getUserId(),
    });
  },

  /**
   * Track an error
   */
  trackError(errorType: string, message: string, options?: { stack?: string; componentName?: string }) {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'error',
      errorType,
      message,
      stack: options?.stack,
      componentName: options?.componentName,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getUserId(),
    });
  },

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'performance',
      metric,
      value,
      rating,
      timestamp: Date.now(),
      sessionId: getSessionId(),
    });
  },

  /**
   * Track user flow progress
   */
  trackFlow(flowName: string, step: string, stepNumber: number, totalSteps: number, status: 'started' | 'completed' | 'abandoned') {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'user_flow',
      flowName,
      step,
      stepNumber,
      totalSteps,
      status,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getUserId(),
    });
  },

  /**
   * Track user interaction
   */
  trackInteraction(element: string, action: InteractionEvent['action'], metadata?: Record<string, any>) {
    if (!analyticsQueue) return;

    analyticsQueue.add({
      type: 'interaction',
      element,
      action,
      metadata,
      timestamp: Date.now(),
      sessionId: getSessionId(),
    });
  },

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_id', userId);
    }
  },

  /**
   * Clear user ID
   */
  clearUserId() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_id');
    }
  },

  /**
   * Force flush the event queue
   */
  flush() {
    analyticsQueue?.flush();
  },
};

// ============================================
// React Hooks
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Track page views automatically
 */
export function usePageViewTracking() {
  const pathname = usePathname();

  useEffect(() => {
    analytics.pageView(pathname);
  }, [pathname]);
}

/**
 * Track feature usage with automatic cleanup
 */
export function useFeatureTracking(feature: string) {
  const trackAction = useCallback((action: string, metadata?: Record<string, any>) => {
    analytics.trackFeature(feature, action, metadata);
  }, [feature]);

  return { trackAction };
}

/**
 * Track user flow through multi-step processes
 */
export function useFlowTracking(flowName: string, totalSteps: number) {
  const currentStep = useRef(0);
  const hasStarted = useRef(false);

  const startFlow = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    currentStep.current = 1;
    analytics.trackFlow(flowName, 'start', 1, totalSteps, 'started');
  }, [flowName, totalSteps]);

  const advanceStep = useCallback((stepName: string) => {
    currentStep.current += 1;
    analytics.trackFlow(flowName, stepName, currentStep.current, totalSteps, 'started');
  }, [flowName, totalSteps]);

  const completeFlow = useCallback(() => {
    analytics.trackFlow(flowName, 'complete', totalSteps, totalSteps, 'completed');
    hasStarted.current = false;
    currentStep.current = 0;
  }, [flowName, totalSteps]);

  const abandonFlow = useCallback(() => {
    if (!hasStarted.current) return;
    analytics.trackFlow(flowName, 'abandoned', currentStep.current, totalSteps, 'abandoned');
    hasStarted.current = false;
    currentStep.current = 0;
  }, [flowName, totalSteps]);

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      if (hasStarted.current) {
        abandonFlow();
      }
    };
  }, [abandonFlow]);

  return { startFlow, advanceStep, completeFlow, abandonFlow, currentStep: currentStep.current };
}

/**
 * Track time spent on a component/page
 */
export function useTimeTracking(feature: string) {
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      if (startTime.current) {
        const timeSpent = Date.now() - startTime.current;
        analytics.trackFeature(feature, 'time_spent', { duration: timeSpent });
      }
    };
  }, [feature]);
}

/**
 * Track scroll depth
 */
export function useScrollDepthTracking(feature: string) {
  const maxDepth = useRef(0);
  const milestones = useRef(new Set<number>());

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const depth = Math.round((scrolled / scrollHeight) * 100);

      if (depth > maxDepth.current) {
        maxDepth.current = depth;

        // Track milestones at 25%, 50%, 75%, 100%
        [25, 50, 75, 100].forEach(milestone => {
          if (depth >= milestone && !milestones.current.has(milestone)) {
            milestones.current.add(milestone);
            analytics.trackInteraction(feature, 'scroll', { depth: milestone });
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [feature]);

  return { maxDepth: maxDepth.current };
}

/**
 * Track click events on specific elements
 */
export function useClickTracking(elementName: string) {
  const trackClick = useCallback((metadata?: Record<string, any>) => {
    analytics.trackInteraction(elementName, 'click', metadata);
  }, [elementName]);

  return { trackClick };
}

// ============================================
// Performance Tracking
// ============================================

export function initPerformanceTracking() {
  if (typeof window === 'undefined') return;

  // Track Web Vitals
  try {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const value = lastEntry.startTime;
      const rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      analytics.trackPerformance('LCP', value, rating);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const value = entry.processingStart - entry.startTime;
        const rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
        analytics.trackPerformance('FID', value, rating);
      });
    }).observe({ type: 'first-input', buffered: true });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const rating = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';
        analytics.trackPerformance('CLS', clsValue, rating);
      }
    });

    // TTFB (Time to First Byte)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart;
      const rating = ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor';
      analytics.trackPerformance('TTFB', ttfb, rating);
    }
  } catch (error) {
    // PerformanceObserver not supported
    console.warn('Performance tracking not supported:', error);
  }
}

export default analytics;
