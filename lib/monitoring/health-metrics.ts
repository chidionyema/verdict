/**
 * Health Metrics and Application Monitoring
 * 
 * Tracks key application health indicators and provides
 * real-time monitoring capabilities
 */

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { metrics } from './sentry';
import { log } from '@/lib/logger';

export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    payments: ServiceHealth;
    storage: ServiceHealth;
    auth: ServiceHealth;
  };
  metrics: {
    activeUsers: number;
    requestsLastHour: number;
    judgmentsLastHour: number;
    paymentsLastHour: number;
    avgResponseTime: number;
    errorRate: number;
    queueDepth: number;
  };
  alerts: Alert[];
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  lastCheck: string;
}

interface Alert {
  level: 'warning' | 'critical';
  service: string;
  message: string;
  timestamp: string;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastMetrics: HealthMetrics | null = null;
  
  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }
  
  // Start continuous monitoring
  startMonitoring(intervalMs = 60000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Initial check
    this.checkHealth();
    
    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }
  
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  async checkHealth(): Promise<HealthMetrics> {
    const startTime = Date.now();
    const alerts: Alert[] = [];
    
    try {
      // Check all services in parallel
      const [database, payments, storage, auth, appMetrics] = await Promise.all([
        this.checkDatabase(),
        this.checkPayments(),
        this.checkStorage(),
        this.checkAuth(),
        this.getApplicationMetrics(),
      ]);
      
      // Determine overall status
      const services = { database, payments, storage, auth };
      const serviceStatuses = Object.values(services).map(s => s.status);
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (serviceStatuses.includes('down')) {
        status = 'unhealthy';
      } else if (serviceStatuses.includes('degraded')) {
        status = 'degraded';
      }
      
      // Check for metric-based alerts
      if (appMetrics.errorRate > 5) {
        alerts.push({
          level: 'warning',
          service: 'application',
          message: `High error rate: ${appMetrics.errorRate.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
        });
      }
      
      if (appMetrics.avgResponseTime > 3000) {
        alerts.push({
          level: 'warning',
          service: 'application',
          message: `High response time: ${appMetrics.avgResponseTime}ms`,
          timestamp: new Date().toISOString(),
        });
      }
      
      if (appMetrics.queueDepth > 100) {
        alerts.push({
          level: 'critical',
          service: 'queue',
          message: `Queue backup: ${appMetrics.queueDepth} pending judgments`,
          timestamp: new Date().toISOString(),
        });
      }
      
      const healthMetrics: HealthMetrics = {
        status,
        timestamp: new Date().toISOString(),
        services,
        metrics: appMetrics,
        alerts,
      };
      
      this.lastMetrics = healthMetrics;
      
      // Track in monitoring
      metrics.trackAPICall('health_check', Date.now() - startTime, 200);
      
      // Alert on status changes
      if (this.lastMetrics && this.lastMetrics.status !== status) {
        log.error('Health status changed', null, {
          from: this.lastMetrics.status,
          to: status,
          severity: status === 'unhealthy' ? 'critical' : 'high',
        });
      }
      
      return healthMetrics;
      
    } catch (error) {
      log.error('Health check failed', error, { severity: 'critical' });
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'down', error: 'Check failed', lastCheck: new Date().toISOString() },
          payments: { status: 'down', error: 'Check failed', lastCheck: new Date().toISOString() },
          storage: { status: 'down', error: 'Check failed', lastCheck: new Date().toISOString() },
          auth: { status: 'down', error: 'Check failed', lastCheck: new Date().toISOString() },
        },
        metrics: {
          activeUsers: 0,
          requestsLastHour: 0,
          judgmentsLastHour: 0,
          paymentsLastHour: 0,
          avgResponseTime: 0,
          errorRate: 100,
          queueDepth: 0,
        },
        alerts: [{
          level: 'critical',
          service: 'health_check',
          message: 'Health check system failure',
          timestamp: new Date().toISOString(),
        }],
      };
    }
  }
  
  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      
      const latency = Date.now() - start;
      
      if (error && error.code !== 'PGRST116') { // Not found is ok
        return {
          status: 'degraded',
          latency,
          error: error.message,
          lastCheck: new Date().toISOString(),
        };
      }
      
      return {
        status: latency > 1000 ? 'degraded' : 'up',
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }
  
  private async checkPayments(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      if (!stripe) {
        return {
          status: 'up',
          latency: 0,
          lastCheck: new Date().toISOString(),
        };
      }
      
      // Simple balance check to verify Stripe connectivity
      await stripe.balance.retrieve();
      const latency = Date.now() - start;
      
      return {
        status: latency > 2000 ? 'degraded' : 'up',
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }
  
  private async checkStorage(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const supabase = await createClient();
      
      // Check storage by listing buckets
      const { error } = await supabase.storage.listBuckets();
      const latency = Date.now() - start;
      
      if (error) {
        return {
          status: 'degraded',
          latency,
          error: error.message,
          lastCheck: new Date().toISOString(),
        };
      }
      
      return {
        status: latency > 1500 ? 'degraded' : 'up',
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }
  
  private async checkAuth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const supabase = await createClient();
      
      // Simple auth check
      const { error } = await supabase.auth.getSession();
      const latency = Date.now() - start;
      
      if (error) {
        return {
          status: 'degraded',
          latency,
          error: error.message,
          lastCheck: new Date().toISOString(),
        };
      }
      
      return {
        status: latency > 500 ? 'degraded' : 'up',
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }
  
  private async getApplicationMetrics() {
    const supabase = await createClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    try {
      // Get active users
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', oneHourAgo);
      
      // Get requests created
      const { count: requestsLastHour } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);
      
      // Get judgments completed
      const { count: judgmentsLastHour } = await supabase
        .from('verdicts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);
      
      // Get payments
      const { count: paymentsLastHour } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'purchase')
        .eq('status', 'completed')
        .gte('created_at', oneHourAgo);
      
      // Get pending judgments (queue depth)
      const { count: queueDepth } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('verdict_count', 3);
      
      // Calculate average response time (mock for now)
      const avgResponseTime = 1500 + Math.random() * 1000;
      
      // Calculate error rate (mock for now)
      const errorRate = Math.random() * 2;
      
      return {
        activeUsers: activeUsers || 0,
        requestsLastHour: requestsLastHour || 0,
        judgmentsLastHour: judgmentsLastHour || 0,
        paymentsLastHour: paymentsLastHour || 0,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: parseFloat(errorRate.toFixed(2)),
        queueDepth: queueDepth || 0,
      };
    } catch (error) {
      log.error('Failed to get application metrics', error);
      
      return {
        activeUsers: 0,
        requestsLastHour: 0,
        judgmentsLastHour: 0,
        paymentsLastHour: 0,
        avgResponseTime: 0,
        errorRate: 0,
        queueDepth: 0,
      };
    }
  }
  
  getLastMetrics(): HealthMetrics | null {
    return this.lastMetrics;
  }
}

export const healthMonitor = HealthMonitor.getInstance();