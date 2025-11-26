/**
 * Health Check Endpoint
 *
 * Use this for monitoring, load balancers, and uptime checks.
 * Returns 200 if app is healthy, 503 if not.
 */

import { NextResponse } from 'next/server';
import { createServiceClient, isConnectionPoolingEnabled } from '@/lib/supabase/server';
import { isRateLimitingProduction } from '@/lib/rate-limiter';
import { isLoggingConfigured } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Don't cache this endpoint
export const runtime = 'nodejs';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy' | 'error';
      latency_ms?: number;
    };
    email: {
      configured: boolean;
    };
    stripe: {
      configured: boolean;
    };
    rate_limiting: {
      production_ready: boolean;
    };
    connection_pooling: {
      enabled: boolean;
    };
    logging: {
      configured: boolean;
    };
  };
}

export async function GET() {
  const startTime = Date.now();

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unhealthy' },
      email: { configured: !!process.env.RESEND_API_KEY },
      stripe: {
        configured: !!(
          process.env.STRIPE_SECRET_KEY &&
          !process.env.STRIPE_SECRET_KEY.includes('your_key')
        ),
      },
      rate_limiting: { production_ready: isRateLimitingProduction() },
      connection_pooling: { enabled: isConnectionPoolingEnabled() },
      logging: {
        configured: isLoggingConfigured(),
      },
    },
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    const supabase = createServiceClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStartTime;

    if (error) {
      health.checks.database = { status: 'unhealthy', latency_ms: dbLatency };
      health.status = 'degraded';
    } else {
      health.checks.database = { status: 'healthy', latency_ms: dbLatency };
    }
  } catch (error) {
    health.checks.database = { status: 'error' };
    health.status = 'unhealthy';
  }

  // Determine overall status
  const criticalChecks = [
    health.checks.database.status === 'healthy',
    health.checks.stripe.configured,
  ];

  const productionChecks = [
    health.checks.email.configured,
    health.checks.rate_limiting.production_ready,
    health.checks.logging.configured,
  ];

  if (!criticalChecks.every(Boolean)) {
    health.status = 'unhealthy';
  } else if (
    health.status === 'healthy' &&
    process.env.NODE_ENV === 'production' &&
    !productionChecks.every(Boolean)
  ) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
