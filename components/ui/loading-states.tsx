import * as React from "react"
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Skeleton components for consistent loading states
export function Skeleton({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// Page-level loading component
interface PageLoadingProps {
  title?: string;
  subtitle?: string;
}

export function PageLoading({
  title = "Loading...",
  subtitle = "Please wait while we fetch your data"
}: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8" role="status" aria-live="polite" aria-busy="true">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{subtitle}</p>
            <span className="sr-only">Loading content, please wait.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card skeleton for lists
export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid of card skeletons
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b border-gray-100 p-4">
              <div className="flex gap-4">
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Error states
interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'error' | 'network' | 'empty' | 'unauthorized';
  className?: string;
}

export function ErrorState({ 
  title,
  description,
  action,
  type = 'error',
  className 
}: ErrorStateProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          defaultTitle: 'Connection Error',
          defaultDescription: 'Please check your internet connection and try again.',
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'empty':
        return {
          icon: AlertCircle,
          defaultTitle: 'No Data Found',
          defaultDescription: 'There\'s nothing to show here yet.',
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50'
        };
      case 'unauthorized':
        return {
          icon: AlertCircle,
          defaultTitle: 'Access Denied',
          defaultDescription: 'You don\'t have permission to view this content.',
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: 'Unable to Load',
          defaultDescription: 'We encountered an issue loading this content. Please try again or check back later.',
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("p-12", className)} role="alert" aria-live="assertive">
      <CardContent className="text-center">
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", config.bgColor)}>
          <Icon className={cn("w-8 h-8", config.iconColor)} aria-hidden="true" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title || config.defaultTitle}
        </h3>

        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description || config.defaultDescription}
        </p>

        {action && (
          <Button
            onClick={action.onClick}
            variant="primary"
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Full page error state
export function PageError({ 
  title,
  description, 
  action,
  type = 'error' 
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="py-20">
          <ErrorState 
            title={title}
            description={description}
            action={action}
            type={type}
          />
        </div>
      </div>
    </div>
  );
}

// Loading spinner for buttons and inline use
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={cn("animate-spin text-current", sizeClasses[size], className)} />
  );
}

// Loading overlay for forms and content areas
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({ loading, children, message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="relative" aria-busy={loading}>
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-600">{message}</p>
            <span className="sr-only">Loading, please wait.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty state component for when lists/content are empty
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <CardContent className="text-center">
        {Icon ? (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
        
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}