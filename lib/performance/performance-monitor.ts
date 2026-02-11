// Performance monitoring and optimization utilities for production
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  url: string;
  userAgent: string;
}

// Silent error handler that logs in development for debugging
const handleAnalyticsError = (endpoint: string) => (error: Error) => {
  // Log in development for debugging, silent in production to avoid UX impact
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[PerformanceMonitor] Analytics request to ${endpoint} failed:`, error.message);
  }
  // In production, we intentionally swallow these errors to not affect UX
  // But we track failure count for observability
  analyticsFailureCount++;
};

// Track analytics failures for observability
let analyticsFailureCount = 0;
export const getAnalyticsFailureCount = () => analyticsFailureCount;

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.initializeMetrics();
    this.setupPerformanceObserver();
  }

  private initializeMetrics() {
    // Track Core Web Vitals
    onCLS((metric: any) => this.recordMetric('CLS', metric));
    onFCP((metric: any) => this.recordMetric('FCP', metric));
    onINP((metric: any) => this.recordMetric('INP', metric));
    onLCP((metric: any) => this.recordMetric('LCP', metric));
    onTTFB((metric: any) => this.recordMetric('TTFB', metric));
  }

  private recordMetric(name: string, metric: any) {
    const performanceMetric: PerformanceMetric = {
      name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      id: metric.id,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.push(performanceMetric);
    
    // Send critical metrics immediately
    if (name === 'CLS' && metric.rating === 'poor') {
      this.sendMetricImmediately(performanceMetric);
    }
    
    // Batch send other metrics
    this.throttledBatchSend();
  }

  private setupPerformanceObserver() {
    // Monitor long tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.recordCustomMetric('long-task', entry.duration, entry.startTime);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Monitor memory usage if available
        if ('memory' in performance) {
          const memoryObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // @ts-ignore
              if (performance.memory) {
                // @ts-ignore
                const memoryInfo = performance.memory;
                this.recordCustomMetric('memory-usage', memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize);
              }
            }
          });
        }
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private recordCustomMetric(name: string, value: number, timestamp?: number) {
    const rating = this.calculateRating(name, value);
    
    this.metrics.push({
      name,
      value,
      rating,
      timestamp: timestamp || Date.now(),
      id: crypto.randomUUID(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  private calculateRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      'long-task': [50, 100],
      'memory-usage': [0.7, 0.9],
      'image-load-time': [500, 1000],
      'api-response-time': [200, 500],
    };

    const [good, poor] = thresholds[name] || [100, 200];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  // Track image loading performance
  public trackImageLoad(src: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.recordCustomMetric('image-load-time', duration);
    
    // Track largest images for LCP optimization
    if (duration > 1000) {
      this.recordSlowImage(src, duration);
    }
  }

  // Track API call performance
  public trackApiCall(endpoint: string, method: string, duration: number, success: boolean) {
    this.recordCustomMetric('api-response-time', duration);
    
    const metric = {
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Send slow API calls immediately
    if (duration > 2000) {
      this.sendSlowApiMetric(metric);
    }
  }

  // Track user interactions
  public trackInteraction(action: string, elementType: string, duration: number) {
    this.recordCustomMetric('interaction-time', duration);
    
    // Track specific interactions
    fetch('/api/analytics/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        elementType,
        duration,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    }).catch(handleAnalyticsError('/api/analytics/interaction'));
  }

  private recordSlowImage(src: string, duration: number) {
    fetch('/api/analytics/slow-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        src,
        duration,
        sessionId: this.sessionId,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(handleAnalyticsError('/api/analytics/slow-image'));
  }

  private sendSlowApiMetric(metric: any) {
    fetch('/api/analytics/slow-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(handleAnalyticsError('/api/analytics/slow-api'));
  }

  private sendMetricImmediately(metric: PerformanceMetric) {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: [metric],
        sessionId: this.sessionId,
        priority: 'critical'
      })
    }).catch(handleAnalyticsError('/api/analytics/performance'));
  }

  private batchSendTimeout: NodeJS.Timeout | null = null;
  private throttledBatchSend = () => {
    if (this.batchSendTimeout) return;
    
    this.batchSendTimeout = setTimeout(() => {
      this.sendBatchMetrics();
      this.batchSendTimeout = null;
    }, 5000); // Send every 5 seconds
  };

  private sendBatchMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = []; // Clear metrics

    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: metricsToSend,
        sessionId: this.sessionId,
        priority: 'batch'
      })
    }).catch(() => {
      // If sending fails, add metrics back to queue
      this.metrics.unshift(...metricsToSend.slice(-10)); // Keep last 10 metrics
    });
  }

  // Get performance insights
  public getInsights() {
    const insights = {
      coreWebVitals: this.getCoreWebVitalsStatus(),
      slowOperations: this.getSlowOperations(),
      memoryUsage: this.getMemoryInsights(),
      recommendations: this.getRecommendations()
    };

    return insights;
  }

  private getCoreWebVitalsStatus() {
    const vitals = ['CLS', 'FCP', 'FID', 'LCP', 'TTFB'];
    const status: Record<string, any> = {};

    vitals.forEach(vital => {
      const metric = this.metrics.find(m => m.name === vital);
      if (metric) {
        status[vital] = {
          value: metric.value,
          rating: metric.rating,
          timestamp: metric.timestamp
        };
      }
    });

    return status;
  }

  private getSlowOperations() {
    return this.metrics
      .filter(m => m.rating === 'poor')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  private getMemoryInsights() {
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory-usage');
    if (memoryMetrics.length === 0) return null;

    const latest = memoryMetrics[memoryMetrics.length - 1];
    return {
      current: latest.value,
      rating: latest.rating,
      trend: this.calculateTrend(memoryMetrics)
    };
  }

  private calculateTrend(metrics: PerformanceMetric[]) {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-3);
    const older = metrics.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private getRecommendations() {
    const recommendations: string[] = [];
    const vitals = this.getCoreWebVitalsStatus();

    if (vitals.LCP?.rating === 'poor') {
      recommendations.push('Optimize largest contentful paint - consider image compression and CDN');
    }
    if (vitals.CLS?.rating === 'poor') {
      recommendations.push('Reduce cumulative layout shift - set image dimensions and avoid dynamic content');
    }
    if (vitals.FID?.rating === 'poor') {
      recommendations.push('Improve first input delay - reduce JavaScript execution time');
    }

    const memoryInsights = this.getMemoryInsights();
    if (memoryInsights?.rating === 'poor') {
      recommendations.push('High memory usage detected - consider reducing bundle size');
    }

    return recommendations;
  }

  // Clean up on page unload
  public destroy() {
    if (this.batchSendTimeout) {
      clearTimeout(this.batchSendTimeout);
      this.sendBatchMetrics(); // Send any remaining metrics
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}