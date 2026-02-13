'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, XCircle, Users, Star, MessageSquare, ArrowRight, Sparkles, TrendingUp, Eye, RefreshCw, Bell, Share2, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyStates';

export function QueueLoading() {
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
              ? 'Your session has expired. Please log in again to continue judging.'
              : 'We couldn\'t load your queue. This might be a temporary issue with our servers.'}
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentHour] = useState(new Date().getHours());

  const isPeakHour = currentHour >= 18 && currentHour <= 22;
  const isQuietHour = currentHour >= 23 || currentHour < 6;

  const getTimeMessage = () => {
    if (isPeakHour) {
      return {
        text: 'Peak time! New requests usually appear within minutes.',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    }
    if (isQuietHour) {
      return {
        text: 'Quiet hours. Best time to judge is 6-10 PM.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    }
    return {
      text: 'Requests come in throughout the day. Check back soon!',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    };
  };

  const timeMessage = getTimeMessage();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Main empty state */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 md:p-12"
      >
        <div className="text-center mb-8">
          {/* Animated illustration */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center"
            >
              <Inbox className="h-14 w-14 text-indigo-500" />
            </motion.div>
            {/* Sparkle decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 text-amber-400" />
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            You have reviewed everything in your queue. Great work! New requests come in constantly.
          </p>

          {/* Time-based hint */}
          <div className={`${timeMessage.bg} ${timeMessage.border} border rounded-xl p-4 mb-6 inline-flex items-center gap-2`}>
            <Clock className={`h-5 w-5 ${timeMessage.color}`} />
            <span className={`text-sm font-medium ${timeMessage.color}`}>
              {timeMessage.text}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check for New Requests'}
          </button>
          <button
            onClick={() => router.push('/submit')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition min-h-[48px] inline-flex items-center justify-center gap-2"
          >
            Submit Your Own
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Enable notifications CTA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Want to be notified when new requests arrive?
            </span>
            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission();
                }
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Enable notifications
            </button>
          </div>
        </div>
      </motion.div>

      {/* Helpful tips while waiting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Peak Times</h4>
          <p className="text-sm text-gray-600">
            Evenings (6-10 PM) and weekends typically have more requests
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Auto-Refresh</h4>
          <p className="text-sm text-gray-600">
            Your queue refreshes every 15 seconds automatically
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Star className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Level Up</h4>
          <p className="text-sm text-gray-600">
            Higher ratings unlock access to premium requests
          </p>
        </motion.div>
      </div>

      {/* Invite friends section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invite friends who need feedback</p>
              <p className="text-sm text-gray-600">More seekers = more judging opportunities</p>
            </div>
          </div>
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}?ref=judge`;
              if (navigator.share) {
                navigator.share({
                  title: 'Get honest feedback on Verdict',
                  text: 'I use this to get anonymous feedback from real people. Check it out!',
                  url: shareUrl,
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center gap-2 min-h-[44px]"
          >
            <Share2 className="h-4 w-4" />
            Share Verdict
          </button>
        </div>
      </motion.div>

      {/* Community Feed CTA - Prominent section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-lg border border-indigo-100 p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">While You Wait</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Explore the Community Feed
              </h3>
              <p className="text-gray-600 mb-4 max-w-lg">
                See what others are getting feedback on and get inspired by the community.
              </p>

              {/* What you'll find */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200">
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  Public verdicts
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  Trending
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/feed')}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 min-h-[56px]"
              >
                <span>Browse Community Feed</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
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
