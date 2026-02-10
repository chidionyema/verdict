/**
 * Supabase Query Timeout Utilities
 *
 * Provides timeout wrappers for Supabase queries to prevent
 * long-running operations from blocking the application.
 */

// Default timeout durations
export const QUERY_TIMEOUTS = {
  fast: 5000,      // 5 seconds - for simple reads
  default: 10000,  // 10 seconds - for most operations
  slow: 30000,     // 30 seconds - for complex queries/writes
  long: 60000,     // 60 seconds - for bulk operations
} as const;

export type TimeoutDuration = keyof typeof QUERY_TIMEOUTS | number;

/**
 * TimeoutError class for identifying timeout-specific errors
 */
export class QueryTimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'QueryTimeoutError';
  }
}

/**
 * Execute a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new QueryTimeoutError(
          `Query timed out after ${timeoutMs}ms${operationName ? ` (${operationName})` : ''}`,
          timeoutMs,
          operationName
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Get timeout duration from duration key or number
 */
export function getTimeoutMs(duration: TimeoutDuration): number {
  if (typeof duration === 'number') {
    return duration;
  }
  return QUERY_TIMEOUTS[duration];
}

/**
 * Wrapper for Supabase query execution with timeout
 *
 * Usage:
 * ```ts
 * const { data, error } = await executeWithTimeout(
 *   supabase.from('users').select('*').eq('id', userId),
 *   'default',
 *   'fetch user by id'
 * );
 * ```
 */
export async function executeWithTimeout<T>(
  query: PromiseLike<T>,
  timeout: TimeoutDuration = 'default',
  operationName?: string
): Promise<T> {
  const timeoutMs = getTimeoutMs(timeout);
  return withTimeout(Promise.resolve(query), timeoutMs, operationName);
}

/**
 * Create a query executor with default timeout settings
 */
export function createQueryExecutor(defaultTimeout: TimeoutDuration = 'default') {
  const defaultTimeoutMs = getTimeoutMs(defaultTimeout);

  return {
    /**
     * Execute a query with the default timeout
     */
    execute: <T>(
      query: PromiseLike<T>,
      operationName?: string
    ): Promise<T> => {
      return withTimeout(Promise.resolve(query), defaultTimeoutMs, operationName);
    },

    /**
     * Execute a query with a custom timeout
     */
    executeWithTimeout: <T>(
      query: PromiseLike<T>,
      timeout: TimeoutDuration,
      operationName?: string
    ): Promise<T> => {
      const timeoutMs = getTimeoutMs(timeout);
      return withTimeout(Promise.resolve(query), timeoutMs, operationName);
    },

    /**
     * Execute a fast query (5s timeout)
     */
    fast: <T>(query: PromiseLike<T>, operationName?: string): Promise<T> => {
      return withTimeout(Promise.resolve(query), QUERY_TIMEOUTS.fast, operationName);
    },

    /**
     * Execute a slow query (30s timeout)
     */
    slow: <T>(query: PromiseLike<T>, operationName?: string): Promise<T> => {
      return withTimeout(Promise.resolve(query), QUERY_TIMEOUTS.slow, operationName);
    },
  };
}

/**
 * Retry a query with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    timeout?: TimeoutDuration;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    timeout = 'default',
    operationName,
  } = options;

  const timeoutMs = getTimeoutMs(timeout);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs, operationName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's a timeout error (the operation is taking too long)
      if (error instanceof QueryTimeoutError) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
}

/**
 * Default query executor instance
 */
export const queryExecutor = createQueryExecutor('default');
