// @ts-nocheck
/**
 * Health Check Endpoint
 *
 * Use this for monitoring, load balancers, and uptime checks.
 * Returns 200 if app is healthy, 503 if not.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic'; // Don't cache this endpoint

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: 'unknown',
  };

  try {
    // Check database connectivity
    const supabase = createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      checks.database = 'unhealthy';
      checks.status = 'degraded';
      return NextResponse.json(checks, { status: 503 });
    }

    checks.database = 'healthy';
    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    checks.status = 'unhealthy';
    checks.database = 'error';
    return NextResponse.json(checks, { status: 503 });
  }
}
