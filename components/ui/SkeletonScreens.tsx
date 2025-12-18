'use client';

import { useState, useEffect } from 'react';

// Generic skeleton component
export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height 
}: {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}) {
  const baseClasses = 'bg-gray-200 animate-pulse';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
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