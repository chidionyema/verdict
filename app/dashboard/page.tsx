'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Image, FileText, Clock, CheckCircle, XCircle, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import type { VerdictRequest, Profile } from '@/lib/database.types';
import Breadcrumb from '@/components/Breadcrumb';
import { FeatureDiscoveryBanner } from '@/components/discovery/FeatureDiscoveryBanner';
import { RetentionDiscountBanner } from '@/components/retention/RetentionDiscountBanner';

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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }

      // Fetch requests
      const res = await fetch('/api/requests');
      if (res.ok) {
        const { requests: requestsData } = await res.json();
        console.log('Fetched requests:', requestsData);
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
      }
    }
  }, []);

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
      {/* Feature Discovery Banner */}
      <FeatureDiscoveryBanner />

      {/* Retention Discount Banner */}
      {profile && (
        <RetentionDiscountBanner
          userId={profile.id}
          hasCompletedRequest={requests.some(r => r.status === 'closed')}
        />
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
              href="/start-simple"
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Requests', color: 'gray' },
                    { value: 'open', label: 'Awaiting Judges', color: 'yellow' },
                    { value: 'in_progress', label: 'Being Judged', color: 'blue' },
                    { value: 'closed', label: 'Completed', color: 'green' },
                    { value: 'cancelled', label: 'Cancelled', color: 'red' },
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setFilterStatus(value as FilterStatus)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between min-h-[48px] ${
                        filterStatus === value
                          ? `bg-${color}-100 text-${color}-800 border-${color}-200 border`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        filterStatus === value
                          ? `bg-${color}-200 text-${color}-800`
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

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to get your first verdict?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload a photo, share some text, or ask for advice on a decision. 
              Get honest feedback from 10 real people in minutes.
            </p>
            <Link
              href="/start-simple"
              className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg min-h-[48px]"
            >
              Create Your First Request
            </Link>
            <div className="mt-6 space-y-1">
              <p className="text-sm text-gray-500">✨ 3 free requests included</p>
              <p className="text-sm text-gray-500">⏱️ Results in under 15 minutes</p>
            </div>
          </div>
        ) : filteredAndSortedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No requests match your filters
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters to find what you're looking for
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
              <Link
                href="/start-simple"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {request.media_type === 'photo' && request.media_url ? (
                    <img
                      src={request.media_url}
                      alt="Request"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {request.text_content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-indigo-600 capitalize bg-indigo-50 px-3 py-1 rounded-full">
                      {request.category}
                    </span>
                    <div className={`flex items-center text-sm px-3 py-1 rounded-full bg-${getStatusColor(request.status)}-50 text-${getStatusColor(request.status)}-700`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-2 font-medium">{getStatusLabel(request.status)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {request.context}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Verdict Progress
                      </span>
                      <span className="text-xs text-gray-500">
                        {request.received_verdict_count}/{request.target_verdict_count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          request.status === 'closed' ? 'bg-green-500' : 
                          request.status === 'cancelled' ? 'bg-red-500' : 
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${getProgressPercentage(request.received_verdict_count, request.target_verdict_count)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    {request.status === 'closed' && (
                      <span className="text-green-600 font-medium">✓ Ready to view</span>
                    )}
                    {request.status === 'in_progress' && (
                      <span className="text-blue-600 font-medium animate-pulse">⏱ Active</span>
                    )}
                  </div>
                </div>
              </Link>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
