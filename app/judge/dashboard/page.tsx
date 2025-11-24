'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, TrendingUp, Clock, Award, ArrowRight, History, RefreshCw } from 'lucide-react';

export default function JudgeDashboard() {
  const router = useRouter();
  const availableRequests = useStore((state) => state.availableRequests);
  const setAvailableRequests = useStore((state) => state.setAvailableRequests);
  const [earnings] = useState(47.5);
  const [qualityScore] = useState(4.6);
  const [totalVerdicts] = useState(95);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Fetch available requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/judge/queue?limit=20');
      if (!res.ok) throw new Error('Failed to fetch requests');

      const data = await res.json();

      // Transform API response to match store format
      const transformedRequests = (data.requests || []).map((req: any) => ({
        id: req.id,
        mediaUrl: req.media_url || req.text_content || '',
        mediaType: req.media_type === 'photo' ? 'image' : 'text',
        category: req.category,
        context: req.context,
        status: req.status,
        verdicts: [],
        createdAt: new Date(req.created_at),
      }));

      setAvailableRequests(transformedRequests);
      setLastFetch(new Date());
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [setAvailableRequests]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Set up polling for new requests (every 5 seconds)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchRequests]);

  // Set up Supabase Realtime subscription for instant updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('judge-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verdict_requests',
          filter: 'status=in.("in_progress","pending")',
        },
        () => {
          // New request created - fetch immediately
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'verdict_requests',
        },
        () => {
          // Request updated (might be closed) - refresh list
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Judge Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/judge/history"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              <History className="h-4 w-4" />
              My Verdicts
            </Link>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Online
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Earnings</p>
                <p className="text-2xl font-bold">${earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {Math.floor(earnings / 2.5)} coffees
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold">{qualityScore}/5.0</p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Verdicts</p>
                <p className="text-2xl font-bold">{totalVerdicts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">47s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Available Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Available Requests</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Help people with life decisions and earn $0.40-0.50 each
                </p>
              </div>
              <div className="flex items-center gap-3">
                {lastFetch && (
                  <span className="text-xs text-gray-400">
                    Updated {Math.floor((Date.now() - lastFetch.getTime()) / 1000)}s ago
                  </span>
                )}
                <button
                  onClick={fetchRequests}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  title="Refresh now"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Live updates enabled</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Auto-refreshing every 5s</span>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No requests available right now.</p>
                <p className="text-gray-400 text-sm mt-2">
                  New requests will appear automatically when they arrive!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition group"
                    onClick={() => router.push(`/judge/verdict/${request.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold capitalize">
                            {request.category}
                          </p>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {request.mediaType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.context}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Claim window expires in 4:32
                        </p>
                      </div>
                      <div className="text-right flex items-center space-x-4">
                        <div>
                          <p className="text-lg font-semibold text-green-600">
                            $0.75
                          </p>
                          <p className="text-xs text-gray-500">
                            Potential earnings
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-3">Tips for Quality Verdicts</h3>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li>- Be specific and constructive in your feedback</li>
            <li>- Consider the context provided by the seeker</li>
            <li>- Respond quickly to earn speed bonuses</li>
            <li>- Maintain a quality score above 4.0 for priority access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
