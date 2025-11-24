// In-memory cache implementation with TTL support
// For production, consider Redis or other distributed cache solutions

interface CacheItem<T> {
  value: T;
  expiry: number;
  created: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, {
      value,
      expiry,
      created: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  stats(): {
    size: number;
    expired: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
    };
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cache key generators
export const cacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userCredits: (userId: string) => `user:credits:${userId}`,
  judgeStats: (judgeId: string) => `judge:stats:${judgeId}`,
  requestDetails: (requestId: string) => `request:${requestId}`,
  requestResponses: (requestId: string) => `request:responses:${requestId}`,
  categoryStats: () => 'stats:categories',
  trendingRequests: () => 'trending:requests',
  helpArticles: (category?: string) => category ? `help:${category}` : 'help:all',
  searchSuggestions: (query: string) => `search:suggestions:${query.toLowerCase()}`,
  analytics: (userId: string, type: string, timeframe: string) => 
    `analytics:${userId}:${type}:${timeframe}`,
  notifications: (userId: string) => `notifications:${userId}`,
  paymentMethods: (userId: string) => `payment:methods:${userId}`,
};

// Cache utilities
export const cacheUtils = {
  // Cached API response wrapper
  async cached<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fetcher();
    cache.set(key, result, ttlMs);
    return result;
  },

  // Invalidate related cache entries
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const keys = [...cache['cache'].keys()];
    
    for (const key of keys) {
      if (key.includes(pattern)) {
        cache.delete(key);
        invalidated++;
      }
    }
    
    return invalidated;
  },

  // Warm up cache with commonly accessed data
  async warmup(): Promise<void> {
    try {
      // Could pre-load frequently accessed data
      console.log('Cache warmup completed');
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  },
};

// Cache cleanup interval (run every 10 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}

// Cache middleware for API routes
export function withCache<T>(
  key: string | ((...args: any[]) => string),
  ttlMs?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(cacheKey, result, ttlMs);
      
      return result;
    };

    return descriptor;
  };
}