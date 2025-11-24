// Performance optimization utilities
// Includes debouncing, throttling, lazy loading, and batch processing

// Debounce function - delays execution until after wait time has elapsed
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>): ReturnType<T> | undefined => {
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) return func(...args);
  }) as T;
}

// Throttle function - limits execution to once per wait period
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let inThrottle = false;
  
  return ((...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!inThrottle) {
      const result = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
      return result;
    }
  }) as T;
}

// Batch processor for API calls
export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private maxBatchSize = 10,
    private maxWaitMs = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);
    const items = batch.map(b => b.item);

    try {
      const results = await this.processor(items);
      
      batch.forEach((b, index) => {
        if (results[index] !== undefined) {
          b.resolve(results[index]);
        } else {
          b.reject(new Error('No result for batch item'));
        }
      });
    } catch (error) {
      batch.forEach(b => b.reject(error as Error));
    }
  }
}

// Lazy loading utility for components
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  // This would typically use React hooks in a real implementation
  // For now, providing the interface structure
  
  const load = async (): Promise<void> => {
    try {
      const result = await loader();
      // Set data
    } catch (error) {
      // Set error
    }
  };

  return {
    data: null,
    loading: false,
    error: null,
    retry: load,
  };
}

// Image optimization utilities
export const imageOptimization = {
  // Generate srcset for responsive images
  generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=80 ${size}w`)
      .join(', ');
  },

  // Get optimized image URL
  getOptimizedUrl(
    url: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    
    return `${url}?${params.toString()}`;
  },

  // Preload critical images
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  },
};

// Database query optimization utilities
export const dbOptimization = {
  // Pagination helper
  paginate<T>(items: T[], page: number, limit: number): {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  // Build efficient select queries
  buildSelectQuery(
    fields: string[],
    relations: Record<string, string[]> = {}
  ): string {
    let query = fields.join(', ');
    
    Object.entries(relations).forEach(([table, tableFields]) => {
      query += `, ${table}(${tableFields.join(', ')})`;
    });
    
    return query;
  },

  // Batch database operations
  async batchOperation<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize = 50
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await operation(batch);
      results.push(...batchResults);
    }
    
    return results;
  },
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  async measureTime<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  },

  // Create a performance mark
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  },

  // Measure between marks
  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;
      return measure?.duration || null;
    }
    return null;
  },

  // Get page load metrics
  getPageLoadMetrics(): {
    fcp: number | null; // First Contentful Paint
    lcp: number | null; // Largest Contentful Paint
    cls: number | null; // Cumulative Layout Shift
    fid: number | null; // First Input Delay
  } | null {
    if (typeof window === 'undefined') return null;

    return {
      fcp: null, // Would be implemented with PerformanceObserver
      lcp: null, // Would be implemented with PerformanceObserver
      cls: null, // Would be implemented with PerformanceObserver
      fid: null, // Would be implemented with PerformanceObserver
    };
  },
};

// Memory management utilities
export const memoryOptimization = {
  // WeakMap for automatic cleanup
  createWeakCache<K extends object, V>(): WeakMap<K, V> {
    return new WeakMap<K, V>();
  },

  // Clean up event listeners
  cleanupListeners(
    element: Element | Window | Document,
    events: Array<{ type: string; listener: EventListener }>
  ): void {
    events.forEach(({ type, listener }) => {
      element.removeEventListener(type, listener);
    });
  },

  // Abort controller for cancelling requests
  createAbortController(): {
    controller: AbortController;
    signal: AbortSignal;
    cleanup: () => void;
  } {
    const controller = new AbortController();
    
    return {
      controller,
      signal: controller.signal,
      cleanup: () => controller.abort(),
    };
  },
};

// Bundle size optimization helpers
export const bundleOptimization = {
  // Dynamic import with error handling
  async dynamicImport<T>(
    importFn: () => Promise<T>
  ): Promise<T | null> {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Feature detection for conditional loading
  supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },

  supportsIntersectionObserver(): boolean {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
  },
};