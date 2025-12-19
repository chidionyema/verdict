import { NextRequest, NextResponse } from 'next/server';
import { healthMonitor } from '@/lib/monitoring/health-metrics';
import { headers } from 'next/headers';

// GET /api/monitoring/health - Get system health status
export async function GET(request: NextRequest) {
  try {
    // Check for monitoring auth token
    const authHeader = (await headers()).get('authorization');
    const monitoringToken = process.env.MONITORING_TOKEN;
    
    // Allow health checks from internal monitoring tools
    if (monitoringToken && authHeader !== `Bearer ${monitoringToken}`) {
      // Still return basic health for uptime monitors, just not detailed metrics
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      });
    }
    
    // Get detailed health metrics
    const health = await healthMonitor.checkHealth();
    
    // Return appropriate HTTP status based on health
    const httpStatus = 
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 : // Still return 200 for degraded
      503; // Service unavailable for unhealthy
    
    return NextResponse.json(health, { status: httpStatus });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}