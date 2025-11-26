'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
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
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const previousCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Transform API response to match store format
  const transformRequests = useCallback((requests: any[]) => {
    return requests.map((req: any) => ({
      id: req.id,
      mediaUrl: req.media_url || req.text_content || '',
      mediaType: (req.media_type === 'photo' ? 'image' : 'text') as 'image' | 'text',
      category: req.category,
      context: req.context,
      status: (req.status === 'open' ? 'pending' : req.status === 'closed' ? 'completed' : req.status) as 'pending' | 'in_progress' | 'completed',
      verdicts: [],
      createdAt: new Date(req.created_at),
    }));
  }, []);

  // Handle incoming SSE data
  const handleSSEData = useCallback((requests: any[]) => {
    const transformedRequests = transformRequests(requests);
    
    // Check if there are new requests
    const previousCount = previousCountRef.current;
    const newCount = transformedRequests.length;
    if (newCount > previousCount && previousCount > 0) {
      const diff = newCount - previousCount;
      console.log(`[Judge Dashboard] 🎉 ${diff} NEW request(s) detected!`);
      setNewRequestsCount(diff);
      setTimeout(() => setNewRequestsCount(0), 3000);
    }
    previousCountRef.current = newCount;

    setAvailableRequests(transformedRequests);
    setLastFetch(new Date());
    setLoading(false);
    console.log('[Judge Dashboard] ✅ Store updated via SSE');
  }, [setAvailableRequests, transformRequests]);

  // Fallback: Manual refresh function
  const fetchRequests = useCallback(async () => {
    try {
      console.log('[Judge Dashboard] 🔄 Manual refresh...');
      const res = await fetch('/api/judge/queue?limit=20');

      if (!res.ok) {
        throw new Error(`Failed to fetch requests: ${res.status}`);
      }

      const data = await res.json();
      handleSSEData(data.requests || []);
    } catch (error) {
      console.error('[Judge Dashboard] ❌ Manual refresh error:', error);
    }
  }, [handleSSEData]);

  // Set up Server-Sent Events connection with polling fallback
  useEffect(() => {
    console.log('[Judge Dashboard] 🚀 Setting up SSE connection...');
    setConnectionStatus('connecting');

    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollingFallback: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let sseWorking = false;

    const connectSSE = () => {
      // Create EventSource connection
      const eventSource = new EventSource('/api/judge/queue/stream');
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        console.log('[Judge Dashboard] ✅ SSE connection opened');
        setConnectionStatus('connected');
        reconnectAttempts = 0; // Reset on successful connection
        sseWorking = true;
        
        // Clear polling fallback if SSE is working
        if (pollingFallback) {
          clearInterval(pollingFallback);
          pollingFallback = null;
        }
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Judge Dashboard] 📨 SSE message received:', data.type);

          if (data.type === 'requests') {
            console.log('[Judge Dashboard] 📦 Received requests via SSE:', data.requests?.length || 0);
            handleSSEData(data.requests || []);
            sseWorking = true; // Confirm SSE is working
          } else if (data.type === 'connected') {
            console.log('[Judge Dashboard] 🔗 SSE:', data.message);
            setConnectionStatus('connected');
          } else if (data.type === 'heartbeat') {
            // Heartbeat to keep connection alive
            console.log('[Judge Dashboard] 💓 Heartbeat received');
            sseWorking = true;
          }
        } catch (error) {
          console.error('[Judge Dashboard] ❌ Error parsing SSE data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('[Judge Dashboard] ❌ SSE error:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          sseWorking = false;
          setConnectionStatus('disconnected');
          
          // If SSE fails, fall back to polling
          if (!pollingFallback) {
            console.log('[Judge Dashboard] 🔄 SSE failed, falling back to polling...');
            setConnectionStatus('connected'); // Show as connected but using polling
            pollingFallback = setInterval(() => {
              console.log('[Judge Dashboard] 🔄 Polling fallback tick');
              fetchRequests();
            }, 5000);
          }
          
          // Attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(2000 * reconnectAttempts, 10000); // Exponential backoff, max 10s
            
            console.log(`[Judge Dashboard] 🔄 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
            
            reconnectTimeout = setTimeout(() => {
              eventSource.close();
              connectSSE();
            }, delay);
          } else {
            console.log('[Judge Dashboard] ⚠️ SSE reconnection failed, using polling fallback');
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          setConnectionStatus('connecting');
        }
      };

      return eventSource;
    };

    const eventSource = connectSSE();

    // Initial fetch via regular API (fallback if SSE doesn't work immediately)
    fetchRequests();

    // Cleanup on unmount
    return () => {
      console.log('[Judge Dashboard] 🧹 Cleaning up SSE connection');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pollingFallback) {
        clearInterval(pollingFallback);
      }
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [handleSSEData, fetchRequests]);

  // Update "seconds ago" counter every second
  useEffect(() => {
    if (!lastFetch) return;

    const updateTimer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetch.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(updateTimer);
  }, [lastFetch]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* New Request Notification */}
      {newRequestsCount > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <p className="font-semibold">
            🎉 {newRequestsCount} new request{newRequestsCount > 1 ? 's' : ''} available!
          </p>
        </div>
      )}

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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'connected'
                ? 'bg-green-100 text-green-700'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {connectionStatus === 'connected' 
                ? 'Online' 
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Earnings strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold">${earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Completed verdicts today</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">This week (estimate)</p>
                <p className="text-xl font-bold">
                  ${(earnings * 3).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">If you keep today&apos;s pace</p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">All‑time</p>
                <p className="text-xl font-bold">
                  ${(earnings * 10).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalVerdicts} verdicts completed
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
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
                    Updated {secondsAgo}s ago
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
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  connectionStatus === 'connected' 
                    ? 'text-green-600' 
                    : connectionStatus === 'connecting'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' 
                    ? 'Live updates enabled' 
                    : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Disconnected'}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {connectionStatus === 'connected' ? 'Real-time updates' : 'Polling fallback'}
              </span>
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
                    className="border rounded-xl p-4 md:p-5 hover:border-indigo-500 cursor-pointer transition group"
                    onClick={() => router.push(`/judge/verdict/${request.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <p className="font-semibold capitalize text-gray-900">
                            {request.category}
                          </p>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {request.mediaType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                          {request.context}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Claim window: ~4 min remaining
                        </p>
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-[140px]">
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-semibold text-green-600 leading-tight">
                            $0.75
                          </p>
                          <p className="text-xs text-gray-500">
                            Potential earnings
                          </p>
                        </div>
                        <button
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition min-h-[40px]"
                        >
                          Claim &amp; Review
                          <ArrowRight className="h-4 w-4" />
                        </button>
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
