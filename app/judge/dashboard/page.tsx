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

  // Set up Server-Sent Events connection
  useEffect(() => {
    console.log('[Judge Dashboard] 🚀 Setting up SSE connection...');
    setConnectionStatus('connecting');

    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectSSE = () => {
      // Create EventSource connection
      const eventSource = new EventSource('/api/judge/queue/stream');
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        console.log('[Judge Dashboard] ✅ SSE connection opened');
        setConnectionStatus('connected');
        reconnectAttempts = 0; // Reset on successful connection
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Judge Dashboard] 📨 SSE message received:', data.type);

          if (data.type === 'requests') {
            handleSSEData(data.requests || []);
          } else if (data.type === 'connected') {
            console.log('[Judge Dashboard] 🔗 SSE:', data.message);
            setConnectionStatus('connected');
          } else if (data.type === 'heartbeat') {
            // Heartbeat to keep connection alive
            console.log('[Judge Dashboard] 💓 Heartbeat received');
          }
        } catch (error) {
          console.error('[Judge Dashboard] ❌ Error parsing SSE data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('[Judge Dashboard] ❌ SSE error:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
            
            console.log(`[Judge Dashboard] 🔄 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
            
            reconnectTimeout = setTimeout(() => {
              eventSource.close();
              connectSSE();
            }, delay);
          } else {
            console.error('[Judge Dashboard] ❌ Max reconnect attempts reached. Please refresh the page.');
            setConnectionStatus('disconnected');
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          setConnectionStatus('connecting');
        }
      };

      return eventSource;
    };

    const eventSource = connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('[Judge Dashboard] 🧹 Cleaning up SSE connection');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [handleSSEData]);

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
              <span className="text-gray-500">Real-time via SSE</span>
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
