'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  Star,
  Share2,
  Copy,
  MoreHorizontal,
  Image,
  FileText,
  Award,
  Target,
  Zap,
  Coins,
  Repeat2,
} from 'lucide-react';
import { getTierConfigByVerdictCount } from '@/lib/validations';
import { EmptyState } from '@/components/ui/EmptyStates';
import { RoleIndicator } from '@/components/ui/RoleIndicator';
import { RequestActions } from '@/components/request/RequestActions';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function MyRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userCredits, setUserCredits] = useState<number>(0);
  const previousCountsRef = useRef<Record<string, number>>({});

  const fetchData = async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Fetch user credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profile && 'credits' in profile) {
        setUserCredits((profile as any).credits || 0);
      }

      // Fetch requests using the API
      const res = await fetch('/api/requests');

      if (res.ok) {
        const data = await res.json();
        const fetchedRequests = data.requests || [];
        setRequests(fetchedRequests);

        // Store initial counts for comparison
        const counts: Record<string, number> = {};
        fetchedRequests.forEach((req: any) => {
          counts[req.id] = req.received_verdict_count || 0;
        });
        previousCountsRef.current = counts;
      } else {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        setError(`API Error: ${errorData.error || 'Unknown error'}`);
      }
      
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

  // Set up real-time subscription for verdict updates
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    if (!user?.id) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isSubscribed = false;

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

            // Check if verdict count increased
            const oldCount = oldRequest?.received_verdict_count || previousCountsRef.current[updatedRequest.id] || 0;
            const newCount = updatedRequest?.received_verdict_count || 0;

            if (newCount > oldCount) {
              // Update the request in state
              setRequests((prev) => {
                const updated = prev.map((req) =>
                  req.id === updatedRequest.id
                    ? { ...req, ...updatedRequest }
                    : req
                );

                // Update previous counts
                previousCountsRef.current[updatedRequest.id] = newCount;

                return updated;
              });

              // Show notification
              const verdictsReceived = newCount - oldCount;
              if (newCount >= updatedRequest.target_verdict_count) {
                toast.success(
                  `🎉 All verdicts received! Your request is complete.`,
                  5000
                );
              } else {
                toast.success(
                  `✨ You received ${verdictsReceived} new verdict${verdictsReceived > 1 ? 's' : ''}! (${newCount}/${updatedRequest.target_verdict_count})`,
                  5000
                );
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
            // Clear polling if it was started as fallback
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            isSubscribed = false;
            // Start polling as fallback when subscription fails
            if (!pollInterval) {
              pollInterval = setInterval(() => {
                fetchData();
              }, 10000);
            }
          }
        });

      // Start polling initially as a safety net, will be cleared once subscription is confirmed
      pollInterval = setInterval(() => {
        // Only poll if subscription is not active
        if (!isSubscribed) {
          fetchData();
        }
      }, 10000);

      return () => {
        supabase.removeChannel(channel);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      // Fallback to polling if subscription setup fails entirely
      pollInterval = setInterval(() => {
        fetchData();
      }, 10000);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
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

  // Filter and search logic
  const filteredRequests = requests.filter(request => {
    const normalized = normalizeStatus(request.status);
    const matchesFilter = filter === 'all' || normalized === filter;
    const matchesSearch = searchTerm === '' || 
      request.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: requests.length,
    open: requests.filter((r) => {
      const s = normalizeStatus(r.status);
      return s === 'open';
    }).length,
    closed: requests.filter((r) => {
      const s = normalizeStatus(r.status);
      return s === 'closed';
    }).length,
    avgRating: requests.length > 0 ? (requests.reduce((acc, r) => acc + (r.avg_rating || 8.2), 0) / requests.length).toFixed(1) : '8.2',
    totalVerdicts: requests.reduce((acc, r) => acc + (r.received_verdict_count || 0), 0)
  };

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (status) {
      case 'open':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
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

  const getCategoryIcon = (category: string, requestType?: string) => {
    // Special handling for comparison and split test types
    if (requestType === 'comparison') {
      return '⚖️';
    }
    if (requestType === 'split_test') {
      return '🔄';
    }
    
    switch (category) {
      case 'appearance':
        return '👔';
      case 'profile':
        return '💼';
      case 'writing':
        return '✍️';
      case 'decision':
        return '🤔';
      case 'comparison':
        return '⚖️';
      case 'split_test':
        return '🔄';
      default:
        return '📝';
    }
  };

  const getRequestTypeLabel = (requestType: string) => {
    switch (requestType) {
      case 'verdict':
        return 'Standard';
      case 'comparison':
        return 'Comparison';
      case 'split_test':
        return 'Split Test';
      default:
        return 'Standard';
    }
  };

  const getRequestTypeColor = (requestType: string) => {
    switch (requestType) {
      case 'verdict':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comparison':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'split_test':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded w-80 animate-pulse"></div>
              </div>
              <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filter skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Request cards skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="min-w-0 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-4 bg-gray-100 rounded w-16"></div>
                          <div className="h-4 bg-gray-100 rounded w-12"></div>
                          <div className="h-4 bg-gray-100 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </div>

                  {/* Context */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-8"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"></div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to view your requests</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600 mt-1">
                This is your home base – track every request and its verdicts in one place.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <RoleIndicator role="submitter" />
              <Link
                href="/submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-medium shadow-lg"
              >
                + New Request
              </Link>
            </div>
          </div>
          {/* Credit Balance - Always visible */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-900">{userCredits}</p>
                  <p className="text-amber-700 text-sm">Credits Available</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-600 mb-2">1 credit = 1 submission</p>
                <Link
                  href="/feed?earn=true"
                  className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  Earn more credits →
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Row */}
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
                    <p className="text-2xl font-bold text-purple-900">{stats.totalVerdicts}</p>
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
          <EmptyState 
            variant="first-time"
            title="Start your feedback journey"
            description="Get expert insights on your appearance, writing, or important decisions. Join thousands who've improved with professional feedback."
          />
        ) : (
          <>
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
              <div className="flex gap-2 flex-wrap">
                {['all', 'open', 'closed', 'cancelled'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-3 rounded-xl font-medium transition capitalize min-h-[44px] ${
                      filter === filterOption
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(request.category, request.request_type)}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 capitalize truncate">
                            {request.category}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full font-medium border ${getRequestTypeColor(
                                request.request_type || 'verdict'
                              )}`}
                            >
                              {getRequestTypeLabel(request.request_type || 'verdict')}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full font-medium border ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getHumanStatus(request)}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1">
                              {request.media_type === 'photo' ||
                              request.media_type === 'comparison' ||
                              request.media_type === 'split_test' ? (
                                <Image className="h-3 w-3" />
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
                      <button
                        onClick={() => {
                          const viewUrl = request.view_url || `/requests/${request.id}`;
                          window.location.href = viewUrl;
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="View details"
                        aria-label="View request details"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Context Preview */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                      {request.context}
                    </p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Verdicts Progress</span>
                        <span className="font-medium">{request.received_verdict_count}/{request.target_verdict_count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            request.status === 'closed' ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${Math.min((request.received_verdict_count / request.target_verdict_count) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.status === 'closed' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Star className="h-3 w-3 fill-current" />
                          {request.avg_rating || '8.2'}/10
                        </span>
                      ) : (request.status === 'open' || request.status === 'in_progress') && (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Clock className="h-3 w-3" />
                          {(() => {
                            const created = new Date(request.created_at);
                            const now = new Date();
                            const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                            const remaining = request.received_verdict_count;
                            const target = request.target_verdict_count;

                            if (remaining >= target) return 'Completing...';
                            if (hoursElapsed < 1) return '~1-2 hrs left';
                            if (hoursElapsed < 2 && remaining > 0) return '~30 min left';
                            if (remaining === 0) return '~2 hrs expected';
                            return `~${Math.max(1, Math.ceil((target - remaining) * 0.5))} hr${Math.ceil((target - remaining) * 0.5) > 1 ? 's' : ''} left`;
                          })()}
                        </span>
                      )}
                    </div>

                    {/* Verdict Preview - Show snippet of latest feedback */}
                    {request.verdict_preview && request.received_verdict_count > 0 && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <Star className="h-4 w-4 text-indigo-600 fill-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-indigo-800 mb-1">Latest feedback:</p>
                            <p className="text-sm text-indigo-700 italic line-clamp-2">
                              "{request.verdict_preview}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verdict Notification - Enhanced visibility */}
                    {request.received_verdict_count > 0 && request.status !== 'closed' && (
                      <Link
                        href={request.view_url || `/requests/${request.id}`}
                        className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-700 flex-1">
                          {request.received_verdict_count === 1
                            ? 'First verdict is in! Tap to see it.'
                            : `${request.received_verdict_count} verdicts received! View feedback →`}
                        </span>
                        <Eye className="h-4 w-4 text-green-600" />
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Link
                        href={request.view_url || `/requests/${request.id}`}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-center text-sm"
                      >
                        {getPrimaryCtaLabel(request)}
                      </Link>
                      {/* Edit/Cancel actions for open requests */}
                      {(request.status === 'open' || request.status === 'in_progress') && request.request_type === 'verdict' && (
                        <RequestActions
                          requestId={request.id}
                          status={request.status}
                          createdAt={request.created_at}
                          receivedVerdictCount={request.received_verdict_count || 0}
                          targetVerdictCount={request.target_verdict_count || 3}
                          onStatusChange={fetchData}
                          compact
                        />
                      )}
                      {request.status === 'closed' && (
                        <button
                          onClick={async () => {
                            const shareUrl = `${window.location.origin}${request.view_url || `/requests/${request.id}`}`;
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: 'Check out my verdict results',
                                  text: request.context?.substring(0, 100) || 'My verdict request results',
                                  url: shareUrl,
                                });
                              } catch (err) {
                                // User cancelled or share failed, fallback to copy
                                await navigator.clipboard.writeText(shareUrl);
                                toast.success('Link copied to clipboard!');
                              }
                            } else {
                              await navigator.clipboard.writeText(shareUrl);
                              toast.success('Link copied to clipboard!');
                            }
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                          title="Share results"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const requestUrl = `${window.location.origin}${request.view_url || `/requests/${request.id}`}`;
                          try {
                            await navigator.clipboard.writeText(requestUrl);
                            toast.success('Link copied to clipboard!');
                          } catch (err) {
                            toast.error('Failed to copy link');
                          }
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Encode the context and category for URL params
                          const params = new URLSearchParams({
                            category: request.category || '',
                            context: request.context?.substring(0, 500) || '',
                            request_type: request.request_type || 'verdict',
                            duplicate: 'true',
                          });
                          router.push(`/submit?${params.toString()}`);
                          toast.success('Creating similar request...');
                        }}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition cursor-pointer"
                        title="Submit similar request"
                      >
                        <Repeat2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRequests.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm && filter !== 'all'
                    ? `No ${filter} requests matching "${searchTerm}"`
                    : searchTerm
                    ? `No requests matching "${searchTerm}"`
                    : filter !== 'all'
                    ? `No ${filter} requests found`
                    : 'No requests found'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(searchTerm || filter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition min-h-[48px]"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/submit')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
                  >
                    Create New Request
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Premium Styling */}
      <style jsx>{`
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}