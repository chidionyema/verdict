'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
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
  Link2,
  MoreHorizontal,
  Image,
  FileText,
  Award,
  Target,
  Zap,
  Plus,
  Grid,
  List,
  BarChart3,
  Activity,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  Heart,
  MessageSquare,
  Folder,
  Settings,
  Download,
  ExternalLink,
} from 'lucide-react';
import { getTierConfigByVerdictCount } from '@/lib/validations';
import { EmptyState } from '@/components/ui/EmptyStates';
import { FeatureDiscoveryBanner } from '@/components/discovery/FeatureDiscoveryBanner';
import { RetentionDiscountBanner } from '@/components/retention/RetentionDiscountBanner';
import { ReferralWidget } from '@/components/referrals/ReferralDashboard';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import FeatureDiscovery from '@/components/discovery/FeatureDiscovery';
import { MagneticButton, FloatingHearts, BounceCounter, AnimatedProgressRing, PulseElement } from '@/components/ui/MicroInteractions';
import { useMultiURLState, generateShareableURL, deepLinkUtils } from '@/lib/state/urlState';
import { useWorkspaceState, useAppStore } from '@/lib/state/appState';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

type ViewMode = 'overview' | 'active' | 'history' | 'analytics';
type FilterStatus = 'all' | 'open' | 'closed' | 'cancelled';
type SortBy = 'newest' | 'oldest' | 'status' | 'progress';
type DisplayMode = 'grid' | 'list' | 'compact';

function WorkspacePageContent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // URL-synced state management
  const { states: urlStates, updateState: updateURLState } = useMultiURLState({
    view: 'overview',
    filter: 'all', 
    search: '',
    sort: 'newest',
    display: 'grid',
  }, { replace: true }); // Use replace to avoid cluttering browser history
  
  // Destructure URL states with proper typing
  const viewMode = urlStates.view as ViewMode;
  const filter = urlStates.filter as FilterStatus;
  const searchTerm = urlStates.search as string;
  const sortBy = urlStates.sort as SortBy;
  const displayMode = urlStates.display as DisplayMode;
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const previousCountsRef = useRef<Record<string, number>>({});

  const fetchData = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get user and profile
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }

      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Fetch requests using the API
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        const fetchedRequests = data.requests || [];
        setRequests(fetchedRequests);

        // Store initial counts for notifications
        const counts: Record<string, number> = {};
        fetchedRequests.forEach((req: any) => {
          counts[req.id] = req.received_verdict_count || 0;
        });
        previousCountsRef.current = counts;

        // Check if user should see onboarding
        if (user && fetchedRequests.length === 0) {
          const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
          if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        const errorDetails = errorData.details ? `: ${errorData.details}` : '';
        setError(`${errorData.error || 'Request failed'}${errorDetails}`);
        console.error('API request failed:', { status: res.status, errorData });
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

  // Real-time subscription for verdict updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user?.id) return;

    try {
      const supabase = createClient();
      
      const channel = supabase
        .channel('workspace-updates')
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
            
            const oldCount = oldRequest?.received_verdict_count || previousCountsRef.current[updatedRequest.id] || 0;
            const newCount = updatedRequest?.received_verdict_count || 0;
            
            if (newCount > oldCount) {
              setRequests((prev) => {
                const updated = prev.map((req) =>
                  req.id === updatedRequest.id
                    ? { ...req, ...updatedRequest }
                    : req
                );
                
                previousCountsRef.current[updatedRequest.id] = newCount;
                return updated;
              });

              // Smart notification
              const verdictsReceived = newCount - oldCount;
              if (newCount >= updatedRequest.target_verdict_count) {
                toast.success(
                  `🎉 Request complete! All ${newCount} verdicts received.`,
                  5000
                );
              } else {
                toast.success(
                  `✨ +${verdictsReceived} new verdict${verdictsReceived > 1 ? 's' : ''}! (${newCount}/${updatedRequest.target_verdict_count})`,
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

  // Computed values
  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter(r => ['open', 'in_progress'].includes(r.status)).length;
    const closed = requests.filter(r => r.status === 'closed').length;
    const totalVerdicts = requests.reduce((acc, r) => acc + (r.received_verdict_count || 0), 0);
    const avgRating = requests.length > 0 
      ? (requests.reduce((acc, r) => acc + (r.avg_rating || 8.2), 0) / requests.length).toFixed(1) 
      : '8.2';
    
    return { total, open, closed, totalVerdicts, avgRating };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Apply view mode filter
    if (viewMode === 'active') {
      filtered = filtered.filter(r => ['open', 'in_progress'].includes(r.status));
    } else if (viewMode === 'history') {
      filtered = filtered.filter(r => ['closed', 'cancelled'].includes(r.status));
    }

    // Apply status filter
    if (filter !== 'all') {
      const normalizeStatus = (status: string) => {
        if (status === 'in_progress') return 'open';
        return status;
      };
      filtered = filtered.filter(r => normalizeStatus(r.status) === filter);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.context.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term) ||
        (r.text_content && r.text_content.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status':
          const statusOrder = { 'open': 0, 'in_progress': 1, 'closed': 2, 'cancelled': 3 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 99) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 99);
        case 'progress':
          const progressA = (a.received_verdict_count || 0) / (a.target_verdict_count || 1);
          const progressB = (b.received_verdict_count || 0) / (b.target_verdict_count || 1);
          return progressB - progressA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [requests, viewMode, filter, searchTerm, sortBy]);

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHumanStatus = (request: any) => {
    const received = request.received_verdict_count || 0;
    const target = request.target_verdict_count || 0;

    if (request.status === 'cancelled') return 'Cancelled';
    if (request.status === 'closed') return 'Complete';
    
    if (received === 0) return 'Finding judges';
    if (received < target) return `${received}/${target} verdicts`;
    return 'Finalizing';
  };

  const getCategoryIcon = (category: string, requestType?: string) => {
    if (requestType === 'comparison') return '⚖️';
    if (requestType === 'split_test') return '🔄';
    
    switch (category) {
      case 'appearance': return '👔';
      case 'profile': return '💼';
      case 'writing': return '✍️';
      case 'decision': return '🤔';
      case 'comparison': return '⚖️';
      case 'split_test': return '🔄';
      default: return '📝';
    }
  };

  const getRequestTypeLabel = (requestType: string) => {
    switch (requestType) {
      case 'verdict': return 'Standard';
      case 'comparison': return 'Comparison';
      case 'split_test': return 'Split Test';
      default: return 'Standard';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-white/60 rounded-xl mb-8 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/60 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-white/60 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Your Workspace</h2>
          <p className="text-gray-600 mb-8">Please log in to view your requests and progress</p>
          <Link 
            href="/auth/login" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Smart Onboarding */}
      {showOnboarding && user && (
        <OnboardingFlow
          user={user}
          onComplete={() => setShowOnboarding(false)}
          allowSkip={true}
        />
      )}
      
      {/* Feature Discovery */}
      <FeatureDiscoveryBanner />
      
      {/* Retention & Referral */}
      {profile && (
        <>
          <RetentionDiscountBanner
            userId={profile.id}
            hasCompletedRequest={requests.some(r => r.status === 'closed')}
          />
          <div className="max-w-7xl mx-auto px-4 mb-6">
            <ReferralWidget userId={profile.id} />
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Workspace
              </h1>
              <p className="text-gray-600 mt-2">
                Your unified command center • {profile?.credits || 0} credits remaining • {stats.total} total requests
              </p>
            </div>
            <MagneticButton
              onClick={() => {
                setShowHearts(true);
                setTimeout(() => window.location.href = '/create', 200);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold flex items-center gap-3 group relative overflow-hidden"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              New Request
              <FloatingHearts trigger={showHearts} />
            </MagneticButton>
          </div>

          {/* Quick Stats with Micro-interactions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <PulseElement intensity="low" color="blue">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <BounceCounter value={stats.total} className="text-2xl font-bold text-gray-900" />
                    <p className="text-gray-600 text-sm">Total Requests</p>
                  </div>
                </div>
              </div>
            </PulseElement>
            
            <PulseElement intensity={stats.open > 0 ? "medium" : "low"} color="orange">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-yellow-600" />
                  <div>
                    <BounceCounter value={stats.open} className="text-2xl font-bold text-gray-900" />
                    <p className="text-gray-600 text-sm">Active</p>
                  </div>
                </div>
              </div>
            </PulseElement>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                  <p className="text-gray-600 text-sm">Avg Rating</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-purple-600" />
                <div>
                  <BounceCounter value={stats.totalVerdicts} className="text-2xl font-bold text-gray-900" />
                  <p className="text-gray-600 text-sm">Total Verdicts</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-white/50 shadow-lg">
              {[
                { key: 'overview', label: 'Overview', icon: Grid },
                { key: 'active', label: 'Active', icon: Zap, count: stats.open },
                { key: 'history', label: 'History', icon: Clock, count: stats.closed },
                { key: 'analytics', label: 'Analytics', icon: BarChart3 },
              ].map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => updateURLState({ view: key })}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === key
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {count !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      viewMode === key ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Share Current View */}
              <button
                onClick={() => {
                  const shareUrl = generateShareableURL('/dashboard', {
                    view: viewMode,
                    filter: filter,
                    search: searchTerm,
                    sort: sortBy,
                    display: displayMode
                  });
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Workspace link copied to clipboard!');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg hover:bg-gray-100 transition-all shadow-lg"
                title="Share current workspace view"
              >
                <Link2 className="h-4 w-4" />
                Share
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => updateURLState({ search: e.target.value })}
                  className="pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg w-64"
                />
              </div>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-white/80 text-gray-700 hover:bg-gray-100/80'
                } backdrop-blur-sm border border-white/50 shadow-lg`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>

              {/* Display Mode */}
              <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-white/50 shadow-lg">
                {[
                  { key: 'grid', icon: Grid },
                  { key: 'list', icon: List },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => updateURLState({ display: key })}
                    className={`p-2 rounded-lg transition-all ${
                      displayMode === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Requests' },
                      { value: 'open', label: 'Active' },
                      { value: 'closed', label: 'Complete' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateURLState({ filter: value })}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          filter === value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                  <div className="space-y-2">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'status', label: 'By Status' },
                      { value: 'progress', label: 'By Progress' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateURLState({ sort: value })}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          sortBy === value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quick Actions</label>
                  <button
                    onClick={() => {
                      updateURLState({ search: '', filter: 'all', sort: 'newest' });
                    }}
                    className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {viewMode === 'analytics' ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-8">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600">
                Detailed insights about your request performance and verdict trends.
              </p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="h-12 w-12 text-white animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your Workspace
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get expert feedback on anything – your appearance, writing, decisions, or creative work.
              Start with 3 free requests and join thousands getting better every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/create"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg hover:-translate-y-1 group"
              >
                <Sparkles className="h-6 w-6 animate-spin" />
                Create Your First Request
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Feature Discovery for New Users */}
            <div className="max-w-3xl mx-auto">
              <FeatureDiscovery
                userId={user?.id}
                userProfile={profile}
                requestHistory={[]}
                compact={false}
              />
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-8 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No requests match your filters</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                updateURLState({ search: '', filter: 'all', view: 'overview' });
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Smart Feature Discovery for Existing Users */}
            <div className="mb-6">
              <FeatureDiscovery
                userId={user?.id}
                userProfile={profile}
                requestHistory={requests}
                compact={true}
              />
            </div>
            
            <div className={
              displayMode === 'grid' 
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredRequests.map((request) => (
                <div
                key={request.id}
                className={`bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  displayMode === 'grid' ? 'rounded-xl' : 'rounded-lg'
                }`}
              >
                {/* Request Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(request.category, request.request_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {request.category}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {getRequestTypeLabel(request.request_type || 'verdict')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getHumanStatus(request)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {request.context}
                  </p>

                  {/* Progress */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Progress</span>
                        <span className="font-medium">{request.received_verdict_count}/{request.target_verdict_count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min((request.received_verdict_count / request.target_verdict_count) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    <AnimatedProgressRing
                      progress={Math.min((request.received_verdict_count / request.target_verdict_count) * 100, 100)}
                      size={40}
                      strokeWidth={3}
                      color="#6366f1"
                      showLabel={false}
                      className="flex-shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
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

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Link
                      href={request.view_url || `/requests/${request.id}`}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-center text-sm"
                    >
                      View Details
                    </Link>
                    <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">Something went wrong</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    setLoading(true);
                    fetchData();
                  }}
                  className="text-sm font-medium text-red-700 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// Wrap in Suspense for useSearchParams (via useMultiURLState)
export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-white/60 rounded-xl mb-8 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/60 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <WorkspacePageContent />
    </Suspense>
  );
}