'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Image,
  FileText,
  Eye,
  ArrowRight,
  Loader2
} from 'lucide-react';
import type { VerdictRequest } from '@/lib/database.types';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';

interface TabCounts {
  all: number;
  waiting: number;
  complete: number;
}

export default function MyVerdictsPage() {
  const [requests, setRequests] = useState<VerdictRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'complete'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Only initialize Supabase client in browser
    if (typeof window !== 'undefined') {
      fetchRequests();
    }
  }, []);

  const fetchRequests = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by tab
    if (activeTab === 'waiting') {
      filtered = filtered.filter(req =>
        req.status === 'open' || req.status === 'in_progress'
      );
    } else if (activeTab === 'complete') {
      filtered = filtered.filter(req =>
        req.status === 'closed' || req.status === 'cancelled'
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.context?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [requests, activeTab, searchTerm]);

  // Calculate tab counts
  const tabCounts: TabCounts = useMemo(() => {
    return {
      all: requests.length,
      waiting: requests.filter(req =>
        req.status === 'open' || req.status === 'in_progress'
      ).length,
      complete: requests.filter(req =>
        req.status === 'closed' || req.status === 'cancelled'
      ).length,
    };
  }, [requests]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: Clock, 
          text: 'Waiting for reviewers', 
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200' 
        };
      case 'in_progress':
        return { 
          icon: Loader2, 
          text: 'Being reviewed', 
          color: 'text-blue-600 bg-blue-50 border-blue-200' 
        };
      case 'completed':
        return { 
          icon: CheckCircle, 
          text: 'Complete', 
          color: 'text-green-600 bg-green-50 border-green-200' 
        };
      case 'closed':
        return { 
          icon: CheckCircle, 
          text: 'Closed', 
          color: 'text-gray-600 bg-gray-50 border-gray-200' 
        };
      default:
        return { 
          icon: XCircle, 
          text: 'Unknown', 
          color: 'text-gray-600 bg-gray-50 border-gray-200' 
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading your verdicts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
            <p className="text-gray-600">
              Browse all the requests you&apos;ve created and the feedback you&apos;ve received.
            </p>
          </div>
          
          <TouchButton
            onClick={() => window.location.href = '/start-simple'}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New request
          </TouchButton>
        </div>

        {/* Quick Stats */}
        {requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Waiting</p>
                    <p className="text-2xl font-bold text-gray-900">{tabCounts.waiting}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Complete</p>
                    <p className="text-2xl font-bold text-gray-900">{tabCounts.complete}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All', count: tabCounts.all },
              { key: 'waiting', label: 'Waiting', count: tabCounts.waiting },
              { key: 'complete', label: 'Complete', count: tabCounts.complete },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search your requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <Card className="p-12">
            <CardContent className="text-center">
              {requests.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first request for honest feedback.
                  </p>
                  <TouchButton
                    onClick={() => window.location.href = '/start-simple'}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Create your first request
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </TouchButton>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filters
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Link key={request.id} href={`/requests/${request.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={`${statusInfo.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                        
                        <div className="flex items-center text-gray-400">
                          {request.media_type === 'photo' ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Content Preview */}
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {request.category ? `${request.category.charAt(0).toUpperCase()}${request.category.slice(1)} Request` : 'Request'}
                      </h3>
                      
                      {request.context && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {request.context}
                        </p>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          View details
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}