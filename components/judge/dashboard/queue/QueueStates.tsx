'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, XCircle, RefreshCw, Inbox, Sparkles, ArrowRight } from 'lucide-react';

export function QueueLoading() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Loading queue...</h3>
      <p className="text-gray-600">Finding requests for you</p>
    </div>
  );
}

interface QueueErrorProps {
  error: string;
  onRetry: () => void;
}

export function QueueError({ error, onRetry }: QueueErrorProps) {
  const router = useRouter();

  const errorConfig = {
    timeout: {
      title: 'Request Timed Out',
      message: 'The server took too long to respond. Please try again.',
    },
    network: {
      title: 'Connection Problem',
      message: 'Please check your internet connection and try again.',
    },
    auth: {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
    },
    default: {
      title: 'Failed to Load Queue',
      message: "We couldn't load your queue. Please try again.",
    },
  };

  const config = errorConfig[error as keyof typeof errorConfig] || errorConfig.default;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{config.message}</p>
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
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px] inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

interface EmptyQueueProps {
  onRefresh: () => void;
  /** Total verdicts the user has submitted (0 = new judge) */
  totalVerdicts?: number;
}

export function EmptyQueue({ onRefresh, totalVerdicts = 0 }: EmptyQueueProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isNewJudge = totalVerdicts === 0;
  const currentHour = new Date().getHours();
  const isPeakHour = currentHour >= 18 && currentHour <= 22;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 md:p-12"
    >
      <div className="text-center">
        {/* Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center"
          >
            <Inbox className="h-10 w-10 text-indigo-500" />
          </motion.div>
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-5 w-5 text-amber-400" />
          </motion.div>
        </div>

        {/* Context-aware messaging */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isNewJudge ? 'No requests available' : 'All caught up!'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          {isNewJudge
            ? 'There are no requests in the queue right now. Check back soon — new requests come in throughout the day.'
            : 'You\'ve reviewed everything available. Great work! New requests come in constantly.'}
        </p>

        {/* Time hint */}
        {!isPeakHour && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              Peak time is 6-10 PM — more requests available then
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check for New'}
          </button>
          <button
            onClick={() => router.push('/feed')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition min-h-[48px] inline-flex items-center justify-center gap-2"
          >
            Browse Feed
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface NoMatchingResultsProps {
  onClearFilters: () => void;
}

export function NoMatchingResults({ onClearFilters }: NoMatchingResultsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Inbox className="h-10 w-10 text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No matching requests</h3>
      <p className="text-gray-600 mb-6">Try adjusting your filters to see more requests.</p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
      >
        Clear Filters
      </button>
    </div>
  );
}
