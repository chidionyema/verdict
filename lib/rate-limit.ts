// Rate limiting utilities for API endpoints
// Prevents abuse and ensures fair usage

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string | Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (key: string) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      onLimitReached: () => {},
      ...config,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private defaultKeyGenerator = (req: Request): string => {
    // Try to get real IP from headers (for proxied requests)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }

    // Fallback to a default key (not ideal for production)
    return 'unknown-ip';
  };

  async check(req: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
  }> {
    const key = await this.config.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.store.get(key);

    // If no entry or entry is outside current window, create new one
    if (!entry || entry.firstRequest < windowStart) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, entry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime,
        totalRequests: 1,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    const allowed = entry.count <= this.config.maxRequests;
    
    if (!allowed) {
      this.config.onLimitReached(key);
    }

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      totalRequests: entry.count,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  reset(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  getStats(): {
    totalKeys: number;
    memoryUsage: number;
  } {
    return {
      totalKeys: this.store.size,
      memoryUsage: JSON.stringify([...this.store.entries()]).length,
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    onLimitReached: (key) => console.warn(`Rate limit exceeded for ${key}`),
  }),

  // Authentication endpoints (more restrictive)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    onLimitReached: (key) => console.warn(`Auth rate limit exceeded for ${key}`),
  }),

  // File uploads (very restrictive)
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
    onLimitReached: (key) => console.warn(`Upload rate limit exceeded for ${key}`),
  }),

  // Search endpoints
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  }),

  // Support ticket creation
  support: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 5, // 5 tickets per day
    keyGenerator: async (req) => {
      // For authenticated endpoints, use user ID instead of IP
      try {
        const authorization = req.headers.get('authorization');
        if (authorization) {
          // Extract user ID from token (simplified)
          return `user-support-limit`;
        }
      } catch (error) {
        // Fallback to IP-based limiting
      }
      
      const forwardedFor = req.headers.get('x-forwarded-for');
      return forwardedFor?.split(',')[0].trim() || 'unknown-ip';
    },
  }),

  // Email sending (notifications, etc.)
  email: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 emails per hour per user
  }),
};

// Middleware function to apply rate limiting
export async function applyRateLimit(
  req: Request,
  limiter: RateLimiter
): Promise<Response | null> {
  try {
    const result = await limiter.check(req);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    // These will be added by the API route handler
    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block requests if rate limiting fails
    return null;
  }
}

// Utility to add rate limit headers to responses
export function addRateLimitHeaders(
  response: Response,
  result: {
    remaining: number;
    resetTime: number;
    totalRequests: number;
  },
  maxRequests: number
): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Limit', maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Higher-order function to wrap API handlers with rate limiting
export function withRateLimit(limiter: RateLimiter) {
  return function (handler: (req: Request, ...args: any[]) => Promise<Response>) {
    return async function (req: Request, ...args: any[]): Promise<Response> {
      const rateLimitResponse = await applyRateLimit(req, limiter);
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
      
      // Get rate limit info for headers
      const result = await limiter.check(req);
      const response = await handler(req, ...args);
      
      return addRateLimitHeaders(response, result, limiter['config'].maxRequests);
    };
  };
}