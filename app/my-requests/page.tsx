'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Search,
  Star,
  Share2,
  Copy,
  MoreHorizontal,
  Image,
  FileText,
  Award,
  Target,
  Zap,
  Volume2,
} from 'lucide-react';
import { getTierConfigByVerdictCount } from '@/lib/validations';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function MyRequestsPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const previousCountsRef = useRef<Record<string, number>>({});

  const fetchData = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/requests');
      
      if (res.ok) {
        const data = await res.json();
        const fetchedRequests = data.requests || [];
        setRequests(fetchedRequests);

        const counts: Record<string, number> = {};
        fetchedRequests.forEach((req: any) => {
          counts[req.id] = req.received_verdict_count || 0;
        });
        previousCountsRef.current = counts;
      } else {
        const errorData = await res.json();
        setError(`API Error: ${errorData.error || 'Unknown error'}`);
      }

      // Optional extra logging only for debugging
      const { data: directRequests, error: directError } = await supabase
        .from('verdict_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      console.log('Direct Supabase query result:', { directRequests, directError });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time verdict updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user?.id) return;

    try {
      const supabase = createClient();

      const channel = supabase
        .channel('my-requests-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'verdict_requests',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedRequest = payload.new as any;
            const oldRequest = payload.old as any;

            const oldCount =
              oldRequest?.received_verdict_count ||
              previousCountsRef.current[updatedRequest.id] ||
              0;
            const newCount = updatedRequest?.received_verdict_count || 0;

            if (newCount > oldCount) {
              setRequests((prev) => {
                const updated = prev.map((req) =>
                  req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req
                );
                previousCountsRef.current[updatedRequest.id] = newCount;
                return updated;
              });

              const verdictsReceived = newCount - oldCount;
              if (newCount >= updatedRequest.target_verdict_count) {
                toast.success('🎉 All verdicts received! Your request is complete.', 5000);
              } else {
                toast.success(
                  `✨ You received ${verdictsReceived} new verdict${verdictsReceived > 1 ? 's' : ''}! (${newCount}/${updatedRequest.target_verdict_count})`,
                  5000
                );
              }
            }
          }
        )
        .subscribe();

      const pollInterval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }, [user?.id]);

  const normalizeStatus = (status: string) => {
    if (status === 'in_progress' || status === 'open') return 'open';
    if (status === 'completed' || status === 'closed') return 'closed';
    return status;
  };

  const getHumanStatus = (request: any) => {
    const normalized = normalizeStatus(request.status);
    const received = request.received_verdict_count || 0;
    const target = request.target_verdict_count || 0;

    if (normalized === 'cancelled') return 'Cancelled';
    if (normalized === 'closed') return 'Completed';

    if (normalized === 'open') {
      if (received === 0) return 'Waiting for verdicts';
      if (received < target) return 'Partially answered';
      return 'Awaiting finalisation';
    }

    return request.status;
  };

  const filteredRequests = requests.filter((request) => {
    const normalized = normalizeStatus(request.status);
    const matchesFilter = filter === 'all' || normalized === filter;
    const matchesSearch =
      searchTerm === '' ||
      request.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: requests.length,
    open: requests.filter((r) => normalizeStatus(r.status) === 'open').length,
    closed: requests.filter((r) => normalizeStatus(r.status) === 'closed').length,
    avgRating:
      requests.length > 0
        ? (
            requests.reduce((acc, r) => acc + (r.avg_rating || 8.2), 0) / requests.length
          ).toFixed(1)
        : '8.2',
    totalVerdicts: requests.reduce(
      (acc, r) => acc + (r.received_verdict_count || 0),
      0
    ),
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrimaryCtaLabel = (request: any) => {
    const normalized = normalizeStatus(request.status);
    const received = request.received_verdict_count || 0;
    const target = request.target_verdict_count || 0;

    if (normalized === 'closed' || normalized === 'completed') {
      return 'View results';
    }
    if (received > 0 && received < target) {
      return 'View verdicts so far';
    }
    return 'View request';
  };

  const getTierLabel = (request: any) => {
    const target = request.target_verdict_count || 0;
    if (!target) return '';
    const tierConfig = getTierConfigByVerdictCount(target);
    return `${tierConfig.tier.charAt(0).toUpperCase() + tierConfig.tier.slice(1)} · ${
      tierConfig.verdicts
    } verdicts · ${tierConfig.credits} credit${tierConfig.credits > 1 ? 's' : ''}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appearance':
        return '👔';
      case 'profile':
        return '💼';
      case 'writing':
        return '✍️';
      case 'decision':
        return '🤔';
      default:
        return '📝';
    }
  };

  // Next best action card
  const nextActionRequest = useMemo(() => {
    if (!requests.length) return null;

    const scored = requests.map((req: any) => {
      const normalized = normalizeStatus(req.status);
      const received = req.received_verdict_count || 0;
      const target = req.target_verdict_count || 0;
      const progressRatio = target ? received / target : 0;

      let score = 0;
      if (normalized === 'open') {
        score += 50;
        if (received === 0) score += 10;
        else if (progressRatio < 1) score += 30;
      } else if (normalized === 'closed') {
        score += 20;
      }

      const createdAt = new Date(req.created_at).getTime() || 0;
      return { req, score, createdAt };
    });

    scored.sort((a, b) =>
      b.score !== a.score ? b.score - a.score : b.createdAt - a.createdAt
    );

    return scored[0]?.req || null;
  }, [requests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to view your dashboard</p>
          <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                This is your home base – track every request and its verdicts in one place.
              </p>
            </div>
            <Link
              href="/start-simple"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-medium shadow-lg"
            >
              + New Request
            </Link>
          </div>

          {requests.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                    <p className="text-blue-700 text-sm">Total Requests</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.avgRating}</p>
                    <p className="text-green-700 text-sm">Avg Rating</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.totalVerdicts}
                    </p>
                    <p className="text-purple-700 text-sm">Verdicts Received</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">{stats.open}</p>
                    <p className="text-yellow-700 text-sm">Active Requests</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            <strong>Error:</strong> {error}
            <br />
            <small>Check browser console for details</small>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Start your feedback journey
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Get expert insights on your appearance, writing, or important decisions. Join
                thousands who&apos;ve improved with professional feedback.
              </p>
              <Link
                href="/start-simple"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition font-medium shadow-lg"
              >
                <Target className="h-5 w-5" />
                Create Your First Request
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Next best action */}
            {nextActionRequest && (
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
                    Recommended next step
                  </p>
                  <p className="text-sm text-gray-900 font-medium line-clamp-2">
                    {getHumanStatus(nextActionRequest)} on your {nextActionRequest.category}{' '}
                    request
                  </p>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                    {nextActionRequest.context}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <p className="text-xs text-gray-600">
                    {nextActionRequest.received_verdict_count || 0}/
                    {nextActionRequest.target_verdict_count} verdicts received
                  </p>
                  <Link
                    href={`/requests/${nextActionRequest.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                  >
                    {getPrimaryCtaLabel(nextActionRequest)}
                  </Link>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by context or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'open', 'closed'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-3 rounded-xl font-medium transition capitalize ${
                      filter === filterOption
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterOption === 'all'
                      ? 'All'
                      : filterOption === 'open'
                      ? 'Active'
                      : 'Complete'}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(request.category)}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 capitalize truncate">
                            {request.category}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full font-medium border ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getHumanStatus(request)}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1">
                              {request.media_type === 'photo' ? (
                                <Image className="h-3 w-3" />
                              ) : request.media_type === 'audio' ? (
                                <Volume2 className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              {request.media_type}
                            </span>
                            <span className="text-gray-500 truncate max-w-[150px]">
                              {getTierLabel(request)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                      {request.context}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Verdicts Progress</span>
                        <span className="font-medium">
                          {request.received_verdict_count}/{request.target_verdict_count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            request.status === 'closed' ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              (request.received_verdict_count / request.target_verdict_count) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.status === 'closed' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Star className="h-3 w-3 fill-current" />
                          {request.avg_rating || '8.2'}/10
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Link
                        href={`/requests/${request.id}`}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-center text-sm"
                      >
                        {getPrimaryCtaLabel(request)}
                      </Link>
                      {request.status === 'closed' && (
                        <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                      <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}