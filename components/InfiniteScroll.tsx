'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps<T> {
  loadMore: (page: number) => Promise<{
    items: T[];
    hasMore: boolean;
    totalPages?: number;
  }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  initialPage?: number;
  pageSize?: number;
}

export default function InfiniteScroll<T extends { id: string | number }>({
  loadMore,
  renderItem,
  loadingComponent,
  emptyComponent,
  errorComponent,
  className = '',
  threshold = 200,
  initialPage = 1,
  pageSize = 20,
}: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [initialLoad, setInitialLoad] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const loadItems = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await loadMore(pageNum);
      
      setItems(prevItems => {
        if (reset) {
          return result.items;
        }
        
        // Deduplicate items by ID
        const newItems = result.items.filter(
          newItem => !prevItems.some(existingItem => existingItem.id === newItem.id)
        );
        
        return [...prevItems, ...newItems];
      });
      
      setHasMore(result.hasMore);
      setPage(pageNum + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [loadMore, loading]);

  // Load initial data
  useEffect(() => {
    loadItems(initialPage, true);
  }, [initialPage]); // Only run on mount or when initialPage changes

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadingRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          loadItems(page);
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, page, loadItems, threshold]);

  const retry = useCallback(() => {
    setError(null);
    loadItems(page);
  }, [page, loadItems]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    loadItems(initialPage, true);
  }, [initialPage, loadItems]);

  // Show initial loading state
  if (initialLoad && loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        {loadingComponent || (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (error && items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        {errorComponent || (
          <div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={retry}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show empty state
  if (!loading && items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        {emptyComponent || (
          <div>
            <p className="text-gray-500 mb-4">No items found</p>
            <button
              onClick={refresh}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Render items */}
      <div>
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading indicator / Observer target */}
      {hasMore && (
        <div
          ref={loadingRef}
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            loadingComponent || (
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading more...</p>
              </div>
            )
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-400">Scroll for more</p>
            </div>
          )}
        </div>
      )}

      {/* Error state for additional loads */}
      {error && items.length > 0 && (
        <div className="text-center py-4">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={retry}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">You've reached the end!</p>
          <button
            onClick={refresh}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}