/**
 * Query caching layer for expensive database operations
 * Critical for handling 100+ concurrent users
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Prevent memory exhaustion
  
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const queryCache = new QueryCache();

// Cache wrapper for database queries
export async function cachedQuery<T>(
  key: string, 
  queryFn: () => Promise<T>, 
  ttlSeconds: number = 300
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Execute query and cache result
  const result = await queryFn();
  queryCache.set(key, result, ttlSeconds);
  
  return result;
}

// Specific cache helpers for common expensive queries
export async function cachedJudgeReputation(judgeId: string, supabase: any) {
  return cachedQuery(
    `judge_reputation_${judgeId}`,
    () => supabase
      .from('judge_reputation')
      .select('*')
      .eq('judge_id', judgeId)
      .single(),
    180 // 3 minutes
  );
}

export async function cachedUserProfile(userId: string, supabase: any) {
  return cachedQuery(
    `profile_${userId}`,
    () => supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    600 // 10 minutes  
  );
}

export async function cachedJudgeQueue(filters: any, supabase: any) {
  const filterKey = JSON.stringify(filters);
  return cachedQuery(
    `judge_queue_${filterKey}`,
    () => supabase
      .from('verdict_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    30 // 30 seconds - fresh queue
  );
}

// Invalidation helpers for cache consistency
export function invalidateUserCache(userId: string) {
  queryCache.invalidate(`profile_${userId}`);
  queryCache.invalidate(`judge_reputation_${userId}`);
}

export function invalidateRequestCache() {
  queryCache.invalidate('judge_queue');
  queryCache.invalidate('requests_');
}