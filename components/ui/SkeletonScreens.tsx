'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Generic skeleton component with shimmer
export function Skeleton({
  className = '',
  variant = 'rectangular',
  animation = 'shimmer',
  width,
  height,
  delay = 0,
}: {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'shimmer' | 'none';
  width?: string | number;
  height?: string | number;
  delay?: number;
}) {
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded'
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    animationDelay: delay ? `${delay}ms` : undefined,
  };

  if (animation === 'shimmer') {
    return (
      <div
        className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]} ${className}`}
        style={style}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${animation === 'pulse' ? 'animate-pulse' : ''} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Skeleton with staggered animation
export function StaggeredSkeleton({
  count = 3,
  children,
  staggerDelay = 100,
}: {
  count?: number;
  children: (index: number) => React.ReactNode;
  staggerDelay?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * (staggerDelay / 1000) }}
        >
          {children(i)}
        </motion.div>
      ))}
    </>
  );
}

// Skeleton to content transition wrapper
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className = '',
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skeleton for feedback cards
export function FeedbackCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {/* Header with avatar and rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton variant="circular" width={16} height={16} />
        </div>
      </div>

      {/* Feedback content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      {/* Quality indicators */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

// Skeleton for judge dashboard
export function JudgeDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="circular" width={48} height={48} />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>

      {/* Request queue */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton for landing page
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Hero section skeleton */}
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-20 text-center">
        <Skeleton className="h-4 w-32 mx-auto mb-8 rounded-full" />
        <Skeleton className="h-16 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
        
        {/* CTA skeleton */}
        <Skeleton className="h-12 w-64 mx-auto rounded-xl mb-16" />
        
        {/* Social proof skeleton */}
        <div className="flex items-center justify-center gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Features section skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <Skeleton className="h-8 w-64 mx-auto mb-16" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200">
              <Skeleton variant="circular" width={64} height={64} className="mx-auto mb-6" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Progressive loading component
export function ProgressiveLoader({
  children,
  loadingComponent: LoadingComponent,
  loadingStates = [],
  className = ''
}: {
  children: React.ReactNode;
  loadingComponent: React.ComponentType;
  loadingStates?: string[];
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);

  useEffect(() => {
    // Simulate progressive loading states
    if (loadingStates.length > 0) {
      const interval = setInterval(() => {
        setCurrentStateIndex(prev => {
          if (prev >= loadingStates.length - 1) {
            clearInterval(interval);
            setTimeout(() => setIsLoading(false), 500);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      return () => clearInterval(interval);
    } else {
      // Simple loading timeout
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loadingStates.length]);

  if (isLoading) {
    return (
      <div className={`transition-opacity duration-500 ${className}`}>
        <LoadingComponent />
        {loadingStates.length > 0 && (
          <div className="text-center mt-4">
            <div className="text-sm text-gray-600">
              {loadingStates[currentStateIndex]}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2 max-w-xs mx-auto">
              <div 
                className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStateIndex + 1) / loadingStates.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

// Hook for managing progressive loading
export function useProgressiveLoading(steps: Array<{ key: string; duration: number; action?: () => Promise<void> }>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const executeSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        if (steps[i].action) {
          try {
            await steps[i].action!();
          } catch (err) {
            setError(`Failed at step: ${steps[i].key}`);
            return;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }
      
      setIsComplete(true);
    };

    executeSteps();
  }, [steps]);

  return {
    currentStep,
    currentStepKey: steps[currentStep]?.key,
    progress: ((currentStep + 1) / steps.length) * 100,
    isComplete,
    error
  };
}

// Enhanced skeleton with shimmer effect
export function ShimmerSkeleton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
}

// Styles for shimmer animation
export function SkeletonStyles() {
  return (
    <style jsx global>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }

      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .animate-shimmer {
        animation: shimmer 2s ease-in-out infinite;
      }

      .animate-fade-in {
        animation: fade-in 0.6s ease-out;
      }
    `}</style>
  );
}

// ============================================
// Content-Aware Skeletons
// ============================================

// Request Card Skeleton - matches the actual request card layout
export function RequestCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Image area */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Category + time */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Verdict Response Skeleton - matches verdict display
export function VerdictSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      {/* Header with avatar */}
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={44} height={44} />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Response content */}
      <div className="space-y-2 pl-14">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-3 pl-14 pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Profile Card Skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Avatar and basic info */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-7 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

// Comment/Discussion Skeleton
export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-12' : ''}`}>
      <Skeleton variant="circular" width={36} height={36} className="flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-6 w-14 rounded" />
          <Skeleton className="h-6 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton variant="circular" width={44} height={44} />
      </div>
      <div className="flex items-center gap-1 mt-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between py-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>

        {/* Chart bars/lines simulation */}
        <div className="ml-10 h-full flex items-end gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: `${30 + Math.random() * 60}%` }}>
              <Skeleton
                className="w-full h-full rounded-t"
                delay={i * 50}
              />
            </div>
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-3 ml-10">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <div key={i} className="flex-1" style={{ maxWidth: i === 0 ? '30%' : '20%' }}>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="border-b border-gray-100 dark:border-gray-700 last:border-0 p-4"
        >
          <div className="flex items-center gap-4">
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className="flex-1" style={{ maxWidth: colIndex === 0 ? '30%' : '20%' }}>
                <Skeleton className="h-4 w-full" delay={rowIndex * 50} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Notification Item Skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton variant="circular" width={8} height={8} />
    </div>
  );
}

// Form Field Skeleton
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

// Image with Text Skeleton (for feed items)
export function MediaCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Comparison images */}
      <div className="grid grid-cols-2 gap-0.5">
        <Skeleton className="aspect-square rounded-none" />
        <Skeleton className="aspect-square rounded-none" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Dashboard Header Skeleton
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Insight Card Skeleton
export function InsightCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} className="bg-indigo-200 dark:bg-indigo-800" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-indigo-200 dark:bg-indigo-800" />
          <Skeleton className="h-3 w-full bg-indigo-200 dark:bg-indigo-800" />
          <Skeleton className="h-3 w-2/3 bg-indigo-200 dark:bg-indigo-800" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
        <Skeleton className="h-4 w-24 bg-indigo-200 dark:bg-indigo-800" />
      </div>
    </div>
  );
}

// Full Page Loading Skeleton
export function PageLoadingSkeleton({ variant = 'default' }: { variant?: 'default' | 'dashboard' | 'detail' }) {
  if (variant === 'dashboard') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <DashboardHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton height={300} />
          </div>
          <div className="space-y-4">
            <InsightCardSkeleton />
            <InsightCardSkeleton />
            <InsightCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4 pt-6">
          <Skeleton className="h-6 w-32" />
          <VerdictSkeleton />
          <VerdictSkeleton />
        </div>
      </div>
    );
  }

  // Default page loading
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RequestCardSkeleton />
        <RequestCardSkeleton />
        <RequestCardSkeleton />
        <RequestCardSkeleton />
        <RequestCardSkeleton />
        <RequestCardSkeleton />
      </div>
    </div>
  );
}