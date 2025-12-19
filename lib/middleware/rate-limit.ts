/**
 * Comprehensive Rate Limiting Middleware
 * 
 * Implements multiple rate limiting strategies to protect against
 * various attack vectors and ensure fair usage
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { log } from '@/lib/logger';
import { metrics } from '@/lib/monitoring/sentry';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limit configurations for different endpoint types
const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
    prefix: '@verdict/auth',
  }) : null,
  
  // Payment endpoints - moderate limits
  payment: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: '@verdict/payment',
  }) : null,
  
  // API endpoints - standard limits
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: '@verdict/api',
  }) : null,
  
  // Upload endpoints - restricted limits
  upload: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 uploads per 5 minutes
    analytics: true,
    prefix: '@verdict/upload',
  }) : null,
  
  // Search endpoints - moderate limits
  search: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 searches per minute
    analytics: true,
    prefix: '@verdict/search',
  }) : null,
  
  // Judge endpoints - higher limits for active judges
  judge: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'), // 120 requests per minute
    analytics: true,
    prefix: '@verdict/judge',
  }) : null,
  
  // Global rate limiter - fallback
  global: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'), // 300 requests per minute total
    analytics: true,
    prefix: '@verdict/global',
  }) : null,
};

// Additional security rate limiters
const securityLimiters = {
  // Prevent rapid-fire attacks
  burst: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 s'), // 20 requests per 10 seconds
    analytics: true,
    prefix: '@verdict/burst',
  }) : null,
  
  // Daily limits for expensive operations
  expensive: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '24 h'), // 100 expensive ops per day
    analytics: true,
    prefix: '@verdict/expensive',
  }) : null,
  
  // IP-based blocking for suspicious activity
  suspicious: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, '24 h'), // Block for 24 hours
    analytics: true,
    prefix: '@verdict/blocked',
  }) : null,
};

// Get rate limiter for endpoint
function getRateLimiter(pathname: string): Ratelimit | null {
  if (!redis) return null;
  
  // Auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    return rateLimiters.auth;
  }
  
  // Payment endpoints
  if (pathname.includes('/billing') || pathname.includes('/payment') || pathname.includes('/checkout')) {
    return rateLimiters.payment;
  }
  
  // Upload endpoints
  if (pathname.includes('/upload')) {
    return rateLimiters.upload;
  }
  
  // Search endpoints
  if (pathname.includes('/search') || pathname.includes('/discover')) {
    return rateLimiters.search;
  }
  
  // Judge endpoints
  if (pathname.includes('/judge')) {
    return rateLimiters.judge;
  }
  
  // Default API limiter
  if (pathname.startsWith('/api/')) {
    return rateLimiters.api;
  }
  
  return rateLimiters.global;
}

// Extract identifier from request
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from various sources
  const userId = 
    request.headers.get('x-user-id') ||
    request.cookies.get('user-id')?.value;
  
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  return `ip:${ip}`;
}

// Check if request should be rate limited
export async function checkRateLimit(
  request: NextRequest,
  options?: {
    identifier?: string;
    cost?: number;
    skipBurst?: boolean;
    expensive?: boolean;
  }
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  reason?: string;
}> {
  try {
    const pathname = request.nextUrl.pathname;
    const identifier = options?.identifier || getIdentifier(request);
    
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development' && !process.env.FORCE_RATE_LIMIT) {
      return { success: true };
    }
    
    // Get appropriate rate limiter
    const limiter = getRateLimiter(pathname);
    if (!limiter) {
      return { success: true };
    }
    
    // Check burst protection
    if (!options?.skipBurst && securityLimiters.burst) {
      const burstResult = await securityLimiters.burst.limit(identifier);
      if (!burstResult.success) {
        log.warn('Burst rate limit exceeded', {
          identifier,
          pathname,
          remaining: burstResult.remaining,
        });
        
        metrics.trackErrorRecovery('rate_limit_burst', false);
        
        return {
          success: false,
          limit: burstResult.limit,
          remaining: burstResult.remaining,
          reset: burstResult.reset,
          reason: 'Too many requests in a short period',
        };
      }
    }
    
    // Check expensive operation limits
    if (options?.expensive && securityLimiters.expensive) {
      const expensiveResult = await securityLimiters.expensive.limit(identifier);
      if (!expensiveResult.success) {
        log.warn('Expensive operation limit exceeded', {
          identifier,
          pathname,
        });
        
        return {
          success: false,
          limit: expensiveResult.limit,
          remaining: expensiveResult.remaining,
          reset: expensiveResult.reset,
          reason: 'Daily limit exceeded for this operation',
        };
      }
    }
    
    // Check main rate limit
    const result = await limiter.limit(identifier, {
      rate: options?.cost || 1,
    });
    
    if (!result.success) {
      log.warn('Rate limit exceeded', {
        identifier,
        pathname,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
      
      // Track in monitoring
      metrics.trackAPICall(pathname, 0, 429);
      
      // Check if this is suspicious activity
      if (result.remaining < -10) {
        // User is significantly over limit
        await markSuspicious(identifier, pathname);
      }
    }
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
    
  } catch (error) {
    log.error('Rate limit check failed', error);
    // Fail open - don't block users if rate limiting fails
    return { success: true };
  }
}

// Mark identifier as suspicious
async function markSuspicious(identifier: string, pathname: string) {
  if (securityLimiters.suspicious) {
    await securityLimiters.suspicious.limit(identifier);
    
    log.error('Suspicious activity detected', null, {
      identifier,
      pathname,
      severity: 'high',
      action: 'blocked_for_24h',
    });
  }
}

// Reset rate limit for identifier (admin use)
export async function resetRateLimit(identifier: string, limiterType?: string) {
  if (!redis) return;
  
  try {
    const prefix = limiterType ? `@verdict/${limiterType}` : '@verdict';
    const pattern = `${prefix}:${identifier}:*`;
    
    // Get all keys matching pattern
    const keys = await redis.keys(pattern);
    
    // Delete all matching keys
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    log.info('Rate limit reset', {
      identifier,
      limiterType,
      keysDeleted: keys.length,
    });
    
  } catch (error) {
    log.error('Failed to reset rate limit', error);
  }
}

// Get rate limit status for identifier
export async function getRateLimitStatus(identifier: string) {
  if (!redis) return null;
  
  const status: Record<string, any> = {};
  
  for (const [name, limiter] of Object.entries(rateLimiters)) {
    if (limiter) {
      try {
        const result = await limiter.limit(identifier, { rate: 0 });
        status[name] = {
          limit: result.limit,
          remaining: result.remaining,
          reset: new Date(result.reset).toISOString(),
        };
      } catch (error) {
        status[name] = { error: 'Failed to get status' };
      }
    }
  }
  
  return status;
}