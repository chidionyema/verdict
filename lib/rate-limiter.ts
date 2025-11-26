import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiters for different API endpoints using Upstash Redis
 * Works correctly in serverless/multi-instance deployments
 */

// Initialize Redis client - falls back to in-memory for local development
const getRedisClient = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // Fallback for local development - use ephemeral storage
  console.warn('Upstash Redis not configured - using ephemeral rate limiting (not suitable for production)');
  return Redis.fromEnv();
};

// Check if Redis is properly configured
const isRedisConfigured = () => {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
};

// In-memory fallback for local development
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

const createInMemoryLimiter = (requests: number, windowSeconds: number) => {
  return {
    limit: async (key: string) => {
      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      const stored = inMemoryStore.get(key);

      if (!stored || now > stored.resetTime) {
        inMemoryStore.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, remaining: requests - 1, reset: now + windowMs };
      }

      if (stored.count >= requests) {
        return {
          success: false,
          remaining: 0,
          reset: stored.resetTime,
        };
      }

      stored.count++;
      return { success: true, remaining: requests - stored.count, reset: stored.resetTime };
    },
  };
};

// Create rate limiters with Redis or in-memory fallback
const createLimiter = (identifier: string, requests: number, windowSeconds: number) => {
  if (isRedisConfigured()) {
    try {
      const redis = getRedisClient();
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
        prefix: `verdict:ratelimit:${identifier}`,
        analytics: true,
      });
    } catch (error) {
      console.error('Failed to create Redis rate limiter, using in-memory fallback:', error);
      return createInMemoryLimiter(requests, windowSeconds);
    }
  }
  return createInMemoryLimiter(requests, windowSeconds);
};

// Rate limiter instances
// For creating verdict requests (5 requests per minute)
export const requestRateLimiter = createLimiter('request', 5, 60);

// For submitting verdicts (10 verdicts per minute)
export const verdictRateLimiter = createLimiter('verdict', 10, 60);

// For file uploads (3 uploads per minute)
export const uploadRateLimiter = createLimiter('upload', 3, 60);

// For payment/checkout endpoints (5 per minute)
export const paymentRateLimiter = createLimiter('payment', 5, 60);

// For SSE connections (prevent connection spam)
export const sseConnectionRateLimiter = createLimiter('sse', 10, 60);

// General API rate limiter (30 requests per minute)
export const generalApiRateLimiter = createLimiter('general', 30, 60);

// Stricter limiter for auth attempts (5 per 5 minutes)
export const authRateLimiter = createLimiter('auth', 5, 300);

/**
 * Helper function to check rate limit and return appropriate error response
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit | ReturnType<typeof createInMemoryLimiter>,
  key: string
): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  try {
    const result = await rateLimiter.limit(key);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000) || 60;
      return {
        allowed: false,
        error: 'Too many requests, please try again later',
        retryAfter,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return { allowed: true };
  }
}

/**
 * Check if rate limiting is properly configured for production
 */
export function isRateLimitingProduction(): boolean {
  return isRedisConfigured();
}
