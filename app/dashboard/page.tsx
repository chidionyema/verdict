'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Image, FileText, Clock, CheckCircle, XCircle, Search, Filter, SortAsc, SortDesc, Sparkles, TrendingUp, Activity, Users, Award, Target, BarChart3, Star, ArrowRight, Crown, Heart, MessageSquare, Eye, CreditCard, Coins } from 'lucide-react';
import type { VerdictRequest, Profile } from '@/lib/database.types';
import Breadcrumb from '@/components/Breadcrumb';
import { RetryButton } from '@/components/ui/RetryButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { FeatureDiscoveryBanner } from '@/components/discovery/FeatureDiscoveryBanner';
import { RetentionDiscountBanner } from '@/components/retention/RetentionDiscountBanner';
import { ReferralWidget } from '@/components/referrals/ReferralDashboard';
import { JudgePerformanceDashboard } from '@/components/judge/JudgePerformanceDashboard';
import { CrossRolePrompt } from '@/components/ui/CrossRolePrompt';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'closed' | 'cancelled';
type SortBy = 'newest' | 'oldest' | 'status' | 'progress';

const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 1745, name: 'Starter', price: '£17.45' },
  popular: { credits: 10, price_cents: 3490, name: 'Popular', price: '£34.90' },
  value: { credits: 25, price_cents: 8725, name: 'Value', price: '£87.25' },
};

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<VerdictRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [daysSinceLastVisit, setDaysSinceLastVisit] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [newVerdictsCount, setNewVerdictsCount] = useState(0);

  // Check for returning users
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastVisit = localStorage.getItem('verdict_last_dashboard_visit');
      const now = Date.now();

      if (lastVisit) {
        const daysSince = Math.floor((now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
        if (daysSince >= 3) { // Show welcome back if away 3+ days
          setDaysSinceLastVisit(daysSince);
          setShowWelcomeBack(true);
        }
      }

      // Update last visit
      localStorage.setItem('verdict_last_dashboard_visit', now.toString());
    }
  }, []);

  const fetchData = async () => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Reset error state on retry
    setError(null);

    try {
      const supabase = createClient();

      // Fetch profile
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        setError('Please log in to view your dashboard.');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Please log in to view your dashboard.');
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }
      setProfile(profileData);

      // Fetch requests and notifications in parallel
      const [requestsRes, notificationsRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/notifications?unread_only=true&limit=50')
      ]);

      if (requestsRes.ok) {
        const { requests: requestsData } = await requestsRes.json();
        setRequests(requestsData || []);

        // Count new verdicts for welcome back (requests with recent verdicts)
        const lastVisit = localStorage.getItem('verdict_last_dashboard_visit');
        if (lastVisit) {
          const lastVisitDate = new Date(parseInt(lastVisit));
          const requestsWithNewVerdicts = (requestsData || []).filter((r: any) => {
            const updatedAt = new Date(r.updated_at);
            return updatedAt > lastVisitDate && r.received_verdict_count > 0;
          });
          setNewVerdictsCount(requestsWithNewVerdicts.length);
        }
      } else if (requestsRes.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        const errorData = await requestsRes.json().catch(() => ({}));
        console.error('Failed to fetch requests:', requestsRes.status, errorData);
        setError('Failed to load your requests. Please try again.');
      }

      if (notificationsRes.ok) {
        const { unread_count } = await notificationsRes.json();
        setUnreadNotifications(unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Something went wrong. Please check your connection and try again.');
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

      // Check for URL params (payment status, welcome, profile setup)
      const params = new URLSearchParams(window.location.search);
      const purchaseStatus = params.get('purchase');
      const creditsAdded = params.get('credits');
      const isWelcome = params.get('welcome');
      const profileSetup = params.get('profile_setup');

      // Handle welcome message for new users
      if (isWelcome === 'true') {
        setNotification({
          type: 'success',
          message: 'Welcome! You have 3 free submissions. Each submission gets you 3 detailed feedback reports from real people.',
        });
        window.history.replaceState({}, '', '/dashboard');
      }

      // Handle profile setup warning
      if (profileSetup === 'pending') {
        setNotification({
          type: 'info',
          message: 'Your account setup is still in progress. Some features may be limited until setup completes.',
        });
        window.history.replaceState({}, '', '/dashboard');
      }

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

  // Escape key to close modals (WCAG accessibility)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreditsModal) {
        setShowCreditsModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCreditsModal]);

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

  const handlePurchaseCredits = async (packageId: string) => {
    setPurchasingPackage(packageId);
    setPurchaseError(null); // Clear previous errors
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      });

      const data = await res.json();

      if (data.demo) {
        // Demo mode - credits added directly
        setNotification({
          type: 'success',
          message: data.message || `Added ${data.credits_added} credits!`,
        });
        setShowCreditsModal(false);
        setPurchaseError(null);
        // Refresh data
        fetchData();
      } else if (data.checkout_url) {
        // Show full-screen loading overlay during redirect
        setIsRedirectingToCheckout(true);
        window.location.href = data.checkout_url;
      } else {
        const errorMessage = data.error || 'Failed to start checkout. Please try again.';
        setPurchaseError(errorMessage);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseError('Connection error. Please check your internet and try again.');
    } finally {
      setPurchasingPackage(null);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <RetryButton
                onRetry={async () => {
                  setLoading(true);
                  await fetchData();
                  if (error) throw new Error(error);
                }}
                maxRetries={3}
                label="Try Again"
                retryingLabel="Loading..."
              />
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition min-h-[44px] flex items-center"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen loading overlay for payment redirect */}
      <LoadingOverlay
        isVisible={isRedirectingToCheckout}
        title="Redirecting to Payment..."
        description="You're being securely redirected to Stripe to complete your purchase."
      />

      {/* Credits Purchase Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Buy Credits</h2>
                    <p className="text-sm text-gray-600">One-time purchase, no subscription</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Close credits modal"
                >
                  <XCircle className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Prefer to earn free credits?</p>
                    <p className="text-xs text-green-700 mt-1">Judge 3 submissions to earn 1 credit</p>
                  </div>
                  <Link
                    href="/feed?earn=true"
                    onClick={() => setShowCreditsModal(false)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    Start Earning
                  </Link>
                </div>
              </div>

              {/* Purchase Error Display */}
              {purchaseError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Payment Failed</p>
                      <p className="text-sm text-red-700 mt-1">{purchaseError}</p>
                      <button
                        onClick={() => setPurchaseError(null)}
                        className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
                <button
                  key={id}
                  onClick={() => handlePurchaseCredits(id)}
                  disabled={purchasingPackage !== null}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                    id === 'popular'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${purchasingPackage === id ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      id === 'popular' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="font-bold">{pkg.credits}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{pkg.name}</span>
                        {id === 'popular' && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{pkg.credits} credits</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-gray-900">{pkg.price}</span>
                    {purchasingPackage === id && (
                      <div className="text-sm text-indigo-600">Processing...</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 text-center">
                Secure payment powered by Stripe. Credits never expire.
              </p>
            </div>
          </div>
        </div>
      )}

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
              aria-label="Dismiss notification"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Back Banner for Returning Users */}
      {showWelcomeBack && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900">
                  Welcome back! {daysSinceLastVisit >= 7 ? "We've missed you" : "Good to see you again"}
                </p>
                <p className="text-sm text-indigo-700">
                  {/* Show summary of what happened while away */}
                  {(() => {
                    const updates: string[] = [];
                    if (newVerdictsCount > 0) {
                      updates.push(`${newVerdictsCount} new verdict${newVerdictsCount > 1 ? 's' : ''}`);
                    }
                    if (unreadNotifications > 0) {
                      updates.push(`${unreadNotifications} notification${unreadNotifications > 1 ? 's' : ''}`);
                    }
                    const activeCount = requests.filter(r => r.status === 'open' || r.status === 'in_progress').length;
                    if (activeCount > 0) {
                      updates.push(`${activeCount} active request${activeCount > 1 ? 's' : ''}`);
                    }
                    return updates.length > 0
                      ? `You have ${updates.join(', ')}`
                      : "Ready to get feedback on something new?";
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {newVerdictsCount > 0 && (
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  {newVerdictsCount} new verdict{newVerdictsCount > 1 ? 's' : ''}
                </span>
              )}
              <Link
                href="/submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition text-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Submission
              </Link>
              <button
                onClick={() => setShowWelcomeBack(false)}
                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                aria-label="Dismiss welcome back banner"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Credits Alert */}
      {profile && profile.credits === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">You're out of credits!</p>
                <p className="text-sm text-amber-700">
                  Review 3 submissions to earn 1 free credit, or buy credits instantly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/feed?earn=true"
                className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition text-sm flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Earn Credit (~15 min)
              </Link>
              <button
                onClick={() => setShowCreditsModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition text-sm"
              >
                Buy Credits
              </button>
            </div>
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

      {/* Cross-Role Discovery - Encourage seekers to try judging */}
      {profile && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <CrossRolePrompt
            currentRole="seeker"
            userId={profile.id}
            variant="banner"
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
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your feedback requests •{' '}
              <span className="font-medium text-indigo-600">{profile?.credits || 0} {profile?.credits === 1 ? 'credit' : 'credits'}</span>{' '}
              (1 credit = 1 submission with 3 feedback reports)
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
              href="/feed?earn=true"
              className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center min-h-[48px] whitespace-nowrap"
            >
              <Users className="h-5 w-5 mr-2" />
              Earn Credits
            </Link>

            <button
              onClick={() => setShowCreditsModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center min-h-[48px] whitespace-nowrap shadow-lg"
            >
              <Coins className="h-5 w-5 mr-2" />
              Buy Credits
            </button>

            <Link
              href="/submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center min-h-[48px] whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Request
            </Link>
          </div>
        </div>

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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
                <Sparkles className="h-16 w-16 text-white" />
              </div>
              
              <div className="mb-8">
                <h3 className="text-4xl font-bold text-gray-900 mb-4">
                  Ready for Your First Verdict?
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform uncertainty into confidence. Upload content, ask questions, get expert feedback from real people in minutes.
                </p>
              </div>
              
              <Link
                href="/submit"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg hover:-translate-y-1 group mb-8"
              >
                <Sparkles className="h-6 w-6 animate-spin" />
                Create Your First Request
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/50 backdrop-blur rounded-2xl p-6 border border-white/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">3 Free Credits Included</h4>
                  <p className="text-gray-600 text-sm">No upfront cost, start immediately</p>
                </div>
                
                <div className="bg-white/50 backdrop-blur rounded-2xl p-6 border border-white/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Results within 2 Hours</h4>
                  <p className="text-gray-600 text-sm">Lightning-fast expert feedback</p>
                </div>
              </div>
            </div>
          </div>
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
                href="/submit"
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
                      {(request.status === 'in_progress' || request.status === 'open') && (
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          <Activity className="h-3 w-3 animate-pulse" />
                          {(() => {
                            const created = new Date(request.created_at);
                            const now = new Date();
                            const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                            if (request.received_verdict_count >= request.target_verdict_count) return 'Completing...';
                            if (hoursElapsed < 1) return '~1-2 hrs';
                            if (request.received_verdict_count > 0) return '~30 min';
                            return '~2 hrs';
                          })()}
                        </span>
                      )}
                    </div>

                    {/* First Verdict Notification & View Results Quick-Link */}
                    {request.received_verdict_count > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {request.received_verdict_count === 1 && request.status !== 'closed' && (
                          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-sm font-medium text-green-700">
                              First verdict received!
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                            request.status === 'closed'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                          {request.status === 'closed'
                            ? `View All ${request.received_verdict_count} Results`
                            : `See ${request.received_verdict_count} Verdict${request.received_verdict_count > 1 ? 's' : ''} So Far`
                          }
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    )}
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
