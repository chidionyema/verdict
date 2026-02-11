'use client';

import { useRouter } from 'next/navigation';
import { Clock, XCircle, Users, Star, MessageSquare } from 'lucide-react';
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

      {/* Helpful tips while waiting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          <p className="text-xs text-green-700">Your queue refreshes every 30 seconds automatically</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Star className="h-5 w-5 text-purple-600" />
          </div>
          <h4 className="font-semibold text-purple-900 text-sm mb-1">Build Your Profile</h4>
          <p className="text-xs text-purple-700">Higher ratings unlock access to premium requests</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px] inline-flex items-center justify-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Refresh Now
        </button>
        <button
          onClick={() => router.push('/feed')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition min-h-[48px] inline-flex items-center justify-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Browse Community Feed
        </button>
      </div>

      {/* Tips for getting more requests */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 text-sm">
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
