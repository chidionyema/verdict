'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { InsightCard, type Insight } from './InsightCard';

interface InsightsSectionProps {
  userType: 'judge' | 'requester';
  maxInsights?: number;
  className?: string;
  showHeader?: boolean;
}

function InsightSkeleton() {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-full mb-1" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function InsightsSection({
  userType,
  maxInsights = 3,
  className = '',
  showHeader = true,
}: InsightsSectionProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/analytics/insights?user_type=${userType}`);
      if (!res.ok) {
        if (res.status === 403) {
          // Not a judge yet - this is OK, just show empty
          setInsights([]);
          return;
        }
        throw new Error('Failed to fetch insights');
      }
      const data = await res.json();
      setInsights((data.insights || []).slice(0, maxInsights));
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError('Unable to load insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userType, maxInsights]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchInsights(true);
    }
  };

  // Always render container to prevent layout shift, but hide visually when empty
  const isEmpty = !loading && !error && insights.length === 0;

  return (
    <div className={`${className} ${isEmpty ? 'hidden' : ''}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Insights for You
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh insights"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[1, 2, 3].map((i) => (
              <InsightSkeleton key={i} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"
          >
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => fetchInsights()}
              className="mt-2 text-red-700 text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {insights.map((insight, index) => (
              <InsightCard
                key={`${insight.title}-${index}`}
                insight={insight}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
