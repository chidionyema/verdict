'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-label="Loading..."
      role="status"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


