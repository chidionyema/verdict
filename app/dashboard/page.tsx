'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Image, FileText, Clock, CheckCircle, XCircle, Search, Filter, SortAsc, SortDesc, Sparkles, TrendingUp, Activity, Users, Award, Target, BarChart3, Star, ArrowRight, Crown, Heart, MessageSquare, Eye } from 'lucide-react';
import type { VerdictRequest, Profile } from '@/lib/database.types';
import Breadcrumb from '@/components/Breadcrumb';
import { FeatureDiscoveryBanner } from '@/components/discovery/FeatureDiscoveryBanner';
import { RetentionDiscountBanner } from '@/components/retention/RetentionDiscountBanner';
import { ReferralWidget } from '@/components/referrals/ReferralDashboard';
import { JudgePerformanceDashboard } from '@/components/judge/JudgePerformanceDashboard';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { SmartCreditSuggestions, useSmartCreditSuggestions } from '@/components/credits/SmartCreditSuggestions';
import { SocialProofWidget, useSocialProof } from '@/components/social-proof/SocialProofWidget';
import { RetentionHooks, useRetentionHooks } from '@/components/retention/RetentionHooks';
// Removed ProgressiveOnboarding - component deleted in cleanup
import { toast } from '@/components/ui/toast';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'closed' | 'cancelled';
type SortBy = 'newest' | 'oldest' | 'status' | 'progress';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<VerdictRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showProgressiveOnboarding, setShowProgressiveOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const previousCountsRef = useRef<Record<string, number>>({});
  
  // Smart credit suggestions
  const shouldShowCreditSuggestions = useSmartCreditSuggestions(profile);
  
  // Social proof
  const { shouldShow: shouldShowSocialProof, dismiss: dismissSocialProof } = useSocialProof();
  
  // Retention hooks
  const { retentionData, updateRetentionData } = useRetentionHooks(profile?.id || '');

  const fetchData = async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Fetch profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
        
        // Show progressive onboarding for new users
        if (profileData) {
          const isNewUser = !(profileData as any).display_name || (profileData as any).total_submissions === 0;
          const hasSeenWelcome = localStorage.getItem(`welcome-shown-${user.id}`);
          setShowProgressiveOnboarding(isNewUser && !hasSeenWelcome);
        }
      }

      // Fetch requests
      const res = await fetch('/api/requests');
      if (res.ok) {
        const { requests: requestsData } = await res.json();
        setRequests(requestsData || []);
      } else {
        const errorData = await res.json();
        console.error('Failed to fetch requests:', res.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for stored redirect after OAuth
    if (typeof window !== 'undefined') {
      const storedRedirect = sessionStorage.getItem('verdict_redirect_to');
      if (storedRedirect && storedRedirect !== '/dashboard' && storedRedirect !== window.location.pathname) {
        sessionStorage.removeItem('verdict_redirect_to');
        window.location.href = storedRedirect;
        return;
      }

      // Check for payment status in URL
      const params = new URLSearchParams(window.location.search);
      const purchaseStatus = params.get('purchase');
      const creditsAdded = params.get('credits');

      if (purchaseStatus === 'success') {
        setNotification({
          type: 'success',
          message: creditsAdded
            ? `Payment successful! ${creditsAdded} credits have been added to your account.`
            : 'Payment successful! Your credits have been added.',
        });
        // Clear the URL params without reload
        window.history.replaceState({}, '', '/dashboard');
      } else if (purchaseStatus === 'cancelled') {
        setNotification({
          type: 'info',
          message: 'Payment was cancelled. No charges were made.',
        });
        window.history.replaceState({}, '', '/dashboard');
      }

      // Auto-dismiss notification after 8 seconds
      if (purchaseStatus) {
        setTimeout(() => setNotification(null), 8000);
      }
    }
  }, []);

  // Real-time subscription for verdict updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user?.id) return;

    try {
      const supabase = createClient();
      
      const channel = supabase
        .channel('dashboard-updates')
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
                  `🎉 Request complete! All ${newCount} verdicts received.`
                );
              } else {
                const remaining = updatedRequest.target_verdict_count - newCount;
                toast.success(
                  `📝 New verdict received! ${remaining} more to go.`
                );
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'verdict_requests',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newRequest = payload.new as any;
            setRequests((prev) => [newRequest, ...prev]);
            toast.success(
              `✨ New request "${newRequest.context?.substring(0, 50) || 'created'}" is now live!`
            );
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Awaiting judges';
      case 'in_progress':
        return 'Being judged';
      case 'closed':
        return 'Complete';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'yellow';
      case 'in_progress':
        return 'blue';
      case 'closed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getProgressPercentage = (received: number, target: number) => {
    return Math.min((received / target) * 100, 100);
  };

  // Filtered and sorted requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.context.toLowerCase().includes(lowercaseSearch) ||
        request.category.toLowerCase().includes(lowercaseSearch) ||
        (request.text_content && request.text_content.toLowerCase().includes(lowercaseSearch))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status':
          const statusOrder = { 'open': 0, 'in_progress': 1, 'closed': 2, 'cancelled': 3 };
          return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        case 'progress':
          const progressA = a.received_verdict_count / a.target_verdict_count;
          const progressB = b.received_verdict_count / b.target_verdict_count;
          return progressB - progressA;
        default:
          return 0;
      }
    });

    return sorted;
  }, [requests, filterStatus, searchTerm, sortBy]);

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return requests.length;
    return requests.filter(request => request.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-40 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment/Action Notification Banner */}
      {notification && (
        <div className={`px-4 py-3 ${
          notification.type === 'success' ? 'bg-green-50 border-b border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-b border-red-200' :
          'bg-blue-50 border-b border-blue-200'
        }`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notification.type === 'success' && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )}
              {notification.type === 'error' && (
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
              {notification.type === 'info' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              )}
              <p className={`font-medium ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`p-1 rounded-full hover:bg-white/50 transition ${
                notification.type === 'success' ? 'text-green-600' :
                notification.type === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Feature Discovery Banner */}
      <FeatureDiscoveryBanner />

      {/* Retention Discount Banner */}
      {profile && (
        <RetentionDiscountBanner
          userId={profile.id}
          hasCompletedRequest={requests.some(r => r.status === 'closed')}
        />
      )}

      {/* Progressive Onboarding */}
      {showProgressiveOnboarding && user && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <ProgressiveOnboarding
            user={user}
            onDismiss={() => setShowProgressiveOnboarding(false)}
            context="dashboard"
          />
        </div>
      )}

      {/* Referral Program Widget */}
      {profile && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <ReferralWidget userId={profile.id} />
        </div>
      )}

      {/* Judge Performance Dashboard */}
      {profile && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <JudgePerformanceDashboard 
            judgeId={profile.id} 
            className="w-full"
          />
        </div>
      )}

      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6" />

          {/* TODO: Add smart credit suggestions after launch */}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your requests and progress •{' '}
              {profile?.credits || 0}{' '}
              {profile?.credits === 1 ? 'request left' : 'requests left'} •{' '}
              {filteredAndSortedRequests.length} of {requests.length} requests
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base min-h-[48px]"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-medium transition flex items-center justify-center min-h-[48px] ${
                showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
            
            <Link
              href="/start"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center min-h-[48px] whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Request
            </Link>
          </div>
        </div>

        {/* Smart Credit Suggestions */}
        {shouldShowCreditSuggestions && profile && (
          <SmartCreditSuggestions
            userId={profile.id}
            userProfile={{
              credits: profile.credits || 0,
              total_submissions: requests.length,
              total_reviews: 0, // TODO: Add to profile schema
              last_review_date: undefined,
              signup_date: profile.created_at
            }}
            currentPage="dashboard"
          />
        )}

        {/* Social Proof Widget */}
        {shouldShowSocialProof && (
          <div className="mb-6">
            <SocialProofWidget 
              variant="compact" 
              placement="dashboard"
              showUserActivity={false}
              showStats={true}
              showRecentActivity={true}
            />
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filter by Status</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'all', label: 'All Requests', color: 'gray', icon: <Target className="h-4 w-4" /> },
                    { value: 'open', label: 'Awaiting Judges', color: 'yellow', icon: <Clock className="h-4 w-4" /> },
                    { value: 'in_progress', label: 'Being Judged', color: 'blue', icon: <Activity className="h-4 w-4" /> },
                    { value: 'closed', label: 'Completed', color: 'green', icon: <CheckCircle className="h-4 w-4" /> },
                    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: <XCircle className="h-4 w-4" /> },
                  ].map(({ value, label, color, icon }) => (
                    <button
                      key={value}
                      onClick={() => setFilterStatus(value as FilterStatus)}
                      className={`w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-between ${
                        filterStatus === value
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          filterStatus === value
                            ? 'bg-white/20'
                            : 'bg-indigo-100'
                        }`}>
                          {icon}
                        </div>
                        <span className="font-semibold">{label}</span>
                      </div>
                      <span className={`text-sm px-3 py-1.5 rounded-full font-bold ${
                        filterStatus === value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getStatusCount(value as FilterStatus)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sort by</label>
                <div className="space-y-2">
                  {[
                    { value: 'newest', label: 'Newest First', icon: SortDesc },
                    { value: 'oldest', label: 'Oldest First', icon: SortAsc },
                    { value: 'status', label: 'By Status', icon: Filter },
                    { value: 'progress', label: 'By Progress', icon: Clock },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value as SortBy)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center min-h-[48px] ${
                        sortBy === value
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Quick Actions</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setSortBy('newest');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition min-h-[48px] flex items-center"
                  >
                    Clear all filters
                  </button>
                  <button
                    onClick={() => setFilterStatus('open')}
                    className="w-full text-left px-4 py-3 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition min-h-[48px] flex items-center"
                  >
                    Show active only
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Requests Grid */}
        {requests.length === 0 ? (
          <EmptyState 
            type="dashboard" 
            userProfile={{
              credits: profile?.credits || 0,
              total_submissions: requests.length || 0,
              total_reviews: 0, // TODO: Add total_reviews to profile schema
              name: profile?.display_name || undefined
            }}
          />
        ) : filteredAndSortedRequests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No requests match your filters
            </h3>
            <p className="text-gray-600 mb-8">
              Try adjusting your search terms or filters to find what you're looking for
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }}
                className="bg-white text-gray-700 px-6 py-3 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-gray-200 font-semibold"
              >
                Clear Filters
              </button>
              <Link
                href="/start"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 font-semibold"
              >
                New Request
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            {(searchTerm || filterStatus !== 'all') && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Showing {filteredAndSortedRequests.length} of {requests.length} requests
                  {searchTerm && <span> for "{searchTerm}"</span>}
                  {filterStatus !== 'all' && <span> with status "{filterStatus}"</span>}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredAndSortedRequests.map((request) => {
                const categoryConfig = {
                  appearance: { icon: <Eye className="h-5 w-5" />, color: 'from-pink-500 to-rose-500', emoji: '👔' },
                  profile: { icon: <Heart className="h-5 w-5" />, color: 'from-red-500 to-pink-500', emoji: '💼' },
                  writing: { icon: <FileText className="h-5 w-5" />, color: 'from-blue-500 to-cyan-500', emoji: '✍️' },
                  decision: { icon: <Target className="h-5 w-5" />, color: 'from-green-500 to-emerald-500', emoji: '🤔' },
                }[request.category] || { icon: <Sparkles className="h-5 w-5" />, color: 'from-gray-500 to-slate-500', emoji: '📝' };
                
                return (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group relative"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryConfig.color} rounded-full mix-blend-multiply filter blur-3xl opacity-5 group-hover:opacity-10 transition-opacity`} />
                {/* Enhanced Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                  {request.media_type === 'photo' && request.media_url ? (
                    <>
                      <img
                        src={request.media_url}
                        alt="Request"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </>
                  ) : (
                    <div className="p-6 text-center relative z-10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{categoryConfig.emoji}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                        {request.text_content || request.context}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Info Section */}
                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r ${categoryConfig.color} text-white shadow-lg`}>
                        {categoryConfig.icon}
                        {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                      </span>
                      {/* Show average rating if available */}
                      {(request as any).avg_rating != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          {(request as any).avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl font-semibold shadow-sm ${
                      request.status === 'closed'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : request.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : request.status === 'cancelled'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {getStatusIcon(request.status)}
                      <span>{getStatusLabel(request.status)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2 mb-6 leading-relaxed">
                    {request.context}
                  </p>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-700">
                        Expert Opinions
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {request.received_verdict_count}/{request.target_verdict_count}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                            request.status === 'closed' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : request.status === 'cancelled'
                              ? 'bg-gradient-to-r from-red-500 to-pink-500'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${getProgressPercentage(request.received_verdict_count, request.target_verdict_count)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                        </div>
                      </div>
                      
                      {/* Progress Dots */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
                        {[...Array(request.target_verdict_count)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < request.received_verdict_count
                                ? 'bg-white shadow-lg'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.status === 'closed' && (
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Complete!
                        </span>
                      )}
                      {request.status === 'in_progress' && (
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          <Activity className="h-3 w-3 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
                );
              })}
            </div>
          </>
        )}
        </div>
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
