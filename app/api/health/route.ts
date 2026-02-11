/**
 * Health Check Endpoint
 *
 * Use this for monitoring, load balancers, and uptime checks.
 * Returns 200 if app is healthy, 503 if not.
 *
 * SECURITY: In production, only returns status (healthy/degraded/unhealthy).
 * Detailed checks are only available in development or with admin auth.
 */

import { NextResponse } from 'next/server';
import { createServiceClient, isConnectionPoolingEnabled } from '@/lib/supabase/server';
import { isRateLimitingProduction } from '@/lib/rate-limiter';
import { isLoggingConfigured } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Don't cache this endpoint
export const runtime = 'nodejs';

// Public health response - minimal info for load balancers
interface PublicHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
}

// Detailed health response - only for development/admin
interface DetailedHealthCheck extends PublicHealthCheck {
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy' | 'error';
      latency_ms?: number;
    };
    services: {
      status: 'ready' | 'not_ready';
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let dbStatus: 'healthy' | 'unhealthy' | 'error' = 'unhealthy';
  let dbLatency: number | undefined;

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    const supabase = createServiceClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    dbLatency = Date.now() - dbStartTime;

    if (error) {
      dbStatus = 'unhealthy';
      status = 'degraded';
    } else {
      dbStatus = 'healthy';
    }
  } catch {
    dbStatus = 'error';
    status = 'unhealthy';
  }

  // Check critical services (without exposing which ones)
  const criticalServicesReady = !!(
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('your_key')
  );

  if (!criticalServicesReady || dbStatus !== 'healthy') {
    status = status === 'healthy' ? 'degraded' : status;
  }

  // Production readiness checks (internal only, don't expose details)
  if (isProduction) {
    const productionReady =
      !!process.env.RESEND_API_KEY &&
      isRateLimitingProduction() &&
      isLoggingConfigured();

    if (!productionReady && status === 'healthy') {
      status = 'degraded';
    }
  }

  const statusCode = status === 'unhealthy' ? 503 : 200;

  // In production, return minimal response to avoid info disclosure
  if (isProduction) {
    const publicHealth: PublicHealthCheck = {
      status,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(publicHealth, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  }

  // In development, return detailed response for debugging
  const detailedHealth: DetailedHealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      services: {
        status: criticalServicesReady ? 'ready' : 'not_ready',
      },
    },
  };

  return NextResponse.json(detailedHealth, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
