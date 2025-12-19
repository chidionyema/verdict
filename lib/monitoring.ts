/**
 * Monitoring and Alerting System for Payment Operations
 *
 * Provides structured monitoring for critical payment flows:
 * - Payment webhook processing
 * - Credit reconciliation
 * - Transaction failures
 * - System health metrics
 */

import { log } from '@/lib/logger';

export interface PaymentMetrics {
  webhookProcessingTime: number;
  transactionSuccessRate: number;
  creditReconciliationRate: number;
  failureCount: number;
  criticalErrors: number;
}

export interface AlertConfig {
  webhookFailureThreshold: number;
  reconciliationErrorThreshold: number;
  criticalErrorThreshold: number;
  processingTimeThreshold: number;
}

export class PaymentMonitor {
  private static instance: PaymentMonitor;
  private metrics: Map<string, number> = new Map();
  private alertConfig: AlertConfig = {
    webhookFailureThreshold: 5,
    reconciliationErrorThreshold: 3,
    criticalErrorThreshold: 1,
    processingTimeThreshold: 5000 // 5 seconds
  };

  static getInstance(): PaymentMonitor {
    if (!PaymentMonitor.instance) {
      PaymentMonitor.instance = new PaymentMonitor();
    }
    return PaymentMonitor.instance;
  }

  /**
   * Track payment webhook processing
   */
  trackWebhookEvent(eventType: string, processingTime: number, success: boolean, context?: Record<string, unknown>) {
    const metricKey = `webhook_${eventType}`;
    
    log.info('Payment webhook processed', {
      eventType,
      processingTimeMs: processingTime,
      success,
      ...context,
      component: 'payment_webhook',
      timestamp: new Date().toISOString()
    });

    // Update metrics
    this.metrics.set(`${metricKey}_count`, (this.metrics.get(`${metricKey}_count`) || 0) + 1);
    this.metrics.set(`${metricKey}_avg_time`, processingTime);
    
    if (!success) {
      this.metrics.set(`${metricKey}_failures`, (this.metrics.get(`${metricKey}_failures`) || 0) + 1);
      this.checkWebhookFailureAlert(eventType);
    }

    // Check processing time alert
    if (processingTime > this.alertConfig.processingTimeThreshold) {
      log.warn('Webhook processing time exceeded threshold', {
        eventType,
        processingTimeMs: processingTime,
        threshold: this.alertConfig.processingTimeThreshold,
        severity: 'medium',
        component: 'payment_webhook'
      });
    }
  }

  /**
   * Track credit reconciliation operations
   */
  trackReconciliation(
    sessionsProcessed: number,
    discrepanciesFixed: number,
    errors: number,
    duration: number,
    context?: Record<string, unknown>
  ) {
    const errorRate = sessionsProcessed > 0 ? (errors / sessionsProcessed) * 100 : 0;
    const successRate = sessionsProcessed > 0 ? ((sessionsProcessed - errors) / sessionsProcessed) * 100 : 0;

    log.info('Credit reconciliation completed', {
      sessionsProcessed,
      discrepanciesFixed,
      errors,
      errorRate,
      successRate,
      durationMs: duration,
      ...context,
      component: 'credit_reconciliation',
      timestamp: new Date().toISOString()
    });

    // Update metrics
    this.metrics.set('reconciliation_sessions', sessionsProcessed);
    this.metrics.set('reconciliation_errors', errors);
    this.metrics.set('reconciliation_fixes', discrepanciesFixed);

    // Check error threshold
    if (errors > this.alertConfig.reconciliationErrorThreshold) {
      log.error('Reconciliation error threshold exceeded', null, {
        errors,
        threshold: this.alertConfig.reconciliationErrorThreshold,
        errorRate,
        severity: 'high',
        component: 'credit_reconciliation',
        actionRequired: 'Investigate reconciliation failures'
      });
    }
  }

  /**
   * Track critical payment errors
   */
  trackCriticalError(
    operation: string,
    error: Error | unknown,
    context: Record<string, unknown>
  ) {
    const criticalErrors = (this.metrics.get('critical_errors') || 0) + 1;
    this.metrics.set('critical_errors', criticalErrors);

    log.error(`Critical payment error in ${operation}`, error, {
      ...context,
      severity: 'critical',
      component: 'payment_system',
      criticalErrorCount: criticalErrors,
      timestamp: new Date().toISOString(),
      actionRequired: 'Immediate investigation required'
    });

    // Alert on critical errors
    if (criticalErrors >= this.alertConfig.criticalErrorThreshold) {
      this.sendCriticalAlert(operation, error, context);
    }
  }

  /**
   * Track transaction status changes
   */
  trackTransactionStatus(
    sessionId: string,
    userId: string,
    status: 'pending' | 'completed' | 'failed',
    context?: Record<string, unknown>
  ) {
    log.info('Transaction status updated', {
      sessionId,
      userId,
      status,
      ...context,
      component: 'transaction_tracking',
      timestamp: new Date().toISOString()
    });

    const statusKey = `transaction_${status}`;
    this.metrics.set(statusKey, (this.metrics.get(statusKey) || 0) + 1);
  }

  /**
   * Get current system health metrics
   */
  getHealthMetrics(): PaymentMetrics {
    const totalWebhooks = this.metrics.get('webhook_checkout.session.completed_count') || 0;
    const webhookFailures = this.metrics.get('webhook_checkout.session.completed_failures') || 0;
    const reconciliationErrors = this.metrics.get('reconciliation_errors') || 0;
    const reconciliationSessions = this.metrics.get('reconciliation_sessions') || 0;

    return {
      webhookProcessingTime: this.metrics.get('webhook_checkout.session.completed_avg_time') || 0,
      transactionSuccessRate: totalWebhooks > 0 ? ((totalWebhooks - webhookFailures) / totalWebhooks) * 100 : 100,
      creditReconciliationRate: reconciliationSessions > 0 ? ((reconciliationSessions - reconciliationErrors) / reconciliationSessions) * 100 : 100,
      failureCount: webhookFailures + reconciliationErrors,
      criticalErrors: this.metrics.get('critical_errors') || 0
    };
  }

  /**
   * Reset metrics (useful for testing or daily resets)
   */
  resetMetrics() {
    this.metrics.clear();
    log.info('Payment monitoring metrics reset', {
      component: 'payment_monitor',
      timestamp: new Date().toISOString()
    });
  }

  private checkWebhookFailureAlert(eventType: string) {
    const failureCount = this.metrics.get(`webhook_${eventType}_failures`) || 0;
    
    if (failureCount >= this.alertConfig.webhookFailureThreshold) {
      log.error('Webhook failure threshold exceeded', null, {
        eventType,
        failureCount,
        threshold: this.alertConfig.webhookFailureThreshold,
        severity: 'high',
        component: 'payment_webhook',
        actionRequired: 'Investigate webhook processing failures'
      });
    }
  }

  private sendCriticalAlert(operation: string, error: Error | unknown, context: Record<string, unknown>) {
    // In production, this would send alerts to:
    // - Slack/Discord
    // - Email notifications
    // - PagerDuty
    // - SMS alerts
    
    log.error('CRITICAL PAYMENT ALERT', error, {
      operation,
      ...context,
      severity: 'critical',
      alertLevel: 'IMMEDIATE',
      component: 'payment_system',
      requiresImmediateAttention: true,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement actual alerting mechanisms
    // - await sendSlackAlert(...)
    // - await sendEmailAlert(...)
    // - await triggerPagerDuty(...)
  }
}

// Singleton instance
export const paymentMonitor = PaymentMonitor.getInstance();

// Convenience functions for common monitoring patterns
export const trackPaymentWebhook = (eventType: string, processingTime: number, success: boolean, context?: Record<string, unknown>) => {
  paymentMonitor.trackWebhookEvent(eventType, processingTime, success, context);
};

export const trackPaymentReconciliation = (
  sessionsProcessed: number,
  discrepanciesFixed: number,
  errors: number,
  duration: number,
  context?: Record<string, unknown>
) => {
  paymentMonitor.trackReconciliation(sessionsProcessed, discrepanciesFixed, errors, duration, context);
};

export const trackCriticalPaymentError = (operation: string, error: Error | unknown, context: Record<string, unknown>) => {
  paymentMonitor.trackCriticalError(operation, error, context);
};

export const trackTransactionUpdate = (sessionId: string, userId: string, status: 'pending' | 'completed' | 'failed', context?: Record<string, unknown>) => {
  paymentMonitor.trackTransactionStatus(sessionId, userId, status, context);
};

export const getPaymentSystemHealth = () => {
  return paymentMonitor.getHealthMetrics();
};