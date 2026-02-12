'use client';

import { useRouter } from 'next/navigation';
import { Clock, XCircle, Users, Star, MessageSquare, ArrowRight, Sparkles, TrendingUp, Eye } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyStates';

interface QueueLoadingProps {}

export function QueueLoading({}: QueueLoadingProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading your queue...</h3>
      <p className="text-gray-600">Finding requests that match your expertise</p>
    </div>
  );
}

interface QueueErrorProps {
  error: string;
  onRetry: () => void;
}

export function QueueError({ error, onRetry }: QueueErrorProps) {
  const router = useRouter();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {error === 'timeout'
          ? 'Request Timed Out'
          : error === 'network'
            ? 'Connection Problem'
            : error === 'auth'
              ? 'Session Expired'
              : 'Failed to Load Queue'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {error === 'timeout'
          ? 'The server took too long to respond. This might be due to high traffic.'
          : error === 'network'
            ? 'Please check your internet connection and try again.'
            : error === 'auth'
              ? 'Your session has expired. Please log in again.'
              : 'Something went wrong while loading your queue.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {error === 'auth' ? (
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
          >
            Log In Again
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => router.push('/feed')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition min-h-[48px]"
        >
          Browse Community Feed
        </button>
      </div>
    </div>
  );
}

interface EmptyQueueProps {
  onRefresh: () => void;
}

export function EmptyQueue({ onRefresh }: EmptyQueueProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Main empty state */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No requests available right now</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            The queue is temporarily empty. New requests come in frequently!
          </p>
        </div>

        {/* Refresh button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px] inline-flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh Queue
          </button>
        </div>

        {/* Helpful tips while waiting */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Peak Times</h4>
            <p className="text-xs text-blue-700">
              Evenings (6-10 PM) and weekends typically have more requests
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-900 text-sm mb-1">Auto-Refresh</h4>
            <p className="text-xs text-green-700">Your queue refreshes every 15 seconds automatically</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-purple-900 text-sm mb-1">Build Your Profile</h4>
            <p className="text-xs text-purple-700">Higher ratings unlock access to premium requests</p>
          </div>
        </div>
      </div>

      {/* Community Feed CTA - Prominent section */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl shadow-xl border border-amber-200/50 p-6 md:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">While You Wait</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Explore the Community Feed
              </h3>
              <p className="text-gray-600 mb-4 max-w-lg">
                See what others are getting feedback on, discover interesting requests,
                and get inspired by the community. It's a great way to learn and stay engaged!
              </p>

              {/* What you'll find */}
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200">
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  Public verdicts
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  Trending requests
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                  Community discussions
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/feed')}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 min-h-[56px]"
              >
                <span>Browse Community Feed</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for getting more requests - smaller section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 text-sm border border-indigo-100">
        <p className="font-medium text-indigo-900 mb-2">Want more requests?</p>
        <ul className="text-indigo-700 space-y-1 text-xs">
          <li>• Complete more verdicts to build your reputation</li>
          <li>• Maintain high quality scores to unlock expert requests</li>
          <li>• Check back during peak hours for more opportunities</li>
        </ul>
      </div>
    </div>
  );
}

interface NoMatchingResultsProps {
  onClearFilters: () => void;
}

export function NoMatchingResults({ onClearFilters }: NoMatchingResultsProps) {
  const router = useRouter();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12">
      <EmptyState
        variant="no-requests"
        title="No matching requests"
        description="Try adjusting your filters or search to see more requests."
        actions={[
          {
            label: 'Clear Filters',
            action: onClearFilters,
            variant: 'secondary' as const,
          },
          {
            label: 'Browse Community Feed',
            action: () => router.push('/feed'),
            variant: 'primary' as const,
            icon: Users,
          },
        ]}
      />
    </div>
  );
}
