/**
 * Rate Limiting Wrapper for API Routes
 * 
 * Provides easy rate limiting for API route handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { log } from '@/lib/logger';

type RateLimitOptions = {
  cost?: number;
  skipBurst?: boolean;
  expensive?: boolean;
  customIdentifier?: (req: NextRequest) => string;
};

type RouteHandler = (
  request: NextRequest,
  params?: any
) => Promise<NextResponse | Response> | NextResponse | Response;

/**
 * Wraps an API route handler with rate limiting
 */
export function withRateLimit(
  handler: RouteHandler,
  options?: RateLimitOptions
): RouteHandler {
  return async (request: NextRequest, params?: any) => {
    try {
      // Get custom identifier if provided
      const identifier = options?.customIdentifier?.(request);
      
      // Check rate limit
      const rateLimitResult = await checkRateLimit(request, {
        identifier,
        cost: options?.cost,
        skipBurst: options?.skipBurst,
        expensive: options?.expensive,
      });
      
      if (!rateLimitResult.success) {
        log.warn('API rate limit exceeded', {
          path: request.nextUrl.pathname,
          identifier,
          remaining: rateLimitResult.remaining,
        });
        
        const retryAfter = rateLimitResult.reset 
          ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
          : 60;
        
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: rateLimitResult.reason || 'Rate limit exceeded. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '60',
              'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
              'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request, params);
      
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit?.toString() || '60');
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining?.toString() || '60');
        if (rateLimitResult.reset) {
          response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
        }
      }
      
      return response;
    } catch (error) {
      log.error('Rate limit wrapper error', error);
      // If rate limiting fails, still run the handler
      return handler(request, params);
    }
  };
}

/**
 * Rate limit configurations for common scenarios
 */
export const rateLimitPresets = {
  // Strict - for auth, password reset, etc.
  strict: {
    cost: 1,
    expensive: false,
  },
  
  // Standard - for regular API calls
  standard: {
    cost: 1,
    skipBurst: false,
  },
  
  // Expensive - for resource-intensive operations
  expensive: {
    cost: 5,
    expensive: true,
  },
  
  // Upload - for file uploads
  upload: {
    cost: 10,
    expensive: true,
  },
  
  // Search - for search queries
  search: {
    cost: 2,
    skipBurst: false,
  },
  
  // Judge - higher limits for judges
  judge: {
    cost: 1,
    skipBurst: true,
  },

  // Default - alias for standard
  default: {
    cost: 1,
    skipBurst: false,
  },
};

/**
 * Helper to create user-specific rate limiter
 */
export function userRateLimit(getUserId: (req: NextRequest) => string | null) {
  return {
    customIdentifier: (req: NextRequest) => {
      const userId = getUserId(req);
      if (userId) {
        return `user:${userId}`;
      }
      // Fall back to IP
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return `ip:${ip}`;
    },
  };
}