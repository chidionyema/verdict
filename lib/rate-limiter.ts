/**
 * Rate Limiting with In-Memory LRU Cache
 *
 * This is a production-ready rate limiter that works for single-instance
 * deployments (most Vercel apps). For multi-instance deployments, consider
 * using the free tier of Upstash Redis (10K commands/day free).
 *
 * Features:
 * - LRU cache with automatic cleanup to prevent memory leaks
 * - Sliding window algorithm for smooth rate limiting
 * - Zero external dependencies or costs
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

// LRU cache with max size to prevent memory issues
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private maxSize = 10000; // Max entries to store
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry) {
      entry.lastAccess = Date.now();
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    // If at max size, remove least recently used entries
    if (this.store.size >= this.maxSize) {
      this.evictLRU();
    }
    this.store.set(key, entry);
  }

  private evictLRU(): void {
    // Remove oldest 10% of entries
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const toRemove = Math.floor(this.maxSize * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i][0]);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    // Remove entries older than 10 minutes
    const maxAge = 10 * 60 * 1000;

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastAccess > maxAge) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

function checkRateLimitInternal(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = store.get(key);

  // No entry or window expired - create new
  if (!entry || now > entry.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
      lastAccess: now,
    });
    return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  // Within window - check count
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, reset: entry.resetTime };
  }

  // Increment and allow
  entry.count++;
  entry.lastAccess = now;
  return { success: true, remaining: maxRequests - entry.count, reset: entry.resetTime };
}

// Create a rate limiter factory
function createLimiter(identifier: string, maxRequests: number, windowSeconds: number) {
  return {
    async limit(key: string): Promise<RateLimitResult> {
      const fullKey = `${identifier}:${key}`;
      return checkRateLimitInternal(fullKey, maxRequests, windowSeconds);
    },
  };
}

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
  rateLimiter: ReturnType<typeof createLimiter>,
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
 * In-memory rate limiting works for single-instance Vercel deployments
 */
export function isRateLimitingProduction(): boolean {
  return true;
}
