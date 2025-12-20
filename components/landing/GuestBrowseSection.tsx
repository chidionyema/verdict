'use client';

import { useState, useEffect } from 'react';
import { Eye, Heart, MessageSquare, Clock, TrendingUp, Star, Users } from 'lucide-react';
import Link from 'next/link';
// import { toast } from '@/components/ui/toast';

interface FeedbackRequest {
  id: string;
  category: string;
  subcategory?: string;
  context: string;
  media_type?: string;
  media_url?: string;
  text_content?: string;
  created_at: string;
  view_count: number;
  featured?: boolean;
  average_rating?: number;
  response_count: number;
  preview_text: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface DiscoverData {
  featured: FeedbackRequest[];
  trending: FeedbackRequest[];
  recent_activity: FeedbackRequest[];
  popular_categories: { category: string; count: number }[];
}

export function GuestBrowseSection() {
  const [discoverData, setDiscoverData] = useState<DiscoverData | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'recent'>('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscoverData() {
      try {
        const response = await fetch('/api/discover');
        if (response.ok) {
          const data = await response.json();
          setDiscoverData(data);
        }
      } catch (error) {
        console.error('Error fetching discover data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscoverData();
  }, []);

  const handleViewRequest = (requestId: string) => {
    // Show alert for now, can enhance later
    alert('Sign up to view full requests and submit your own!');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Browse Real Feedback Requests
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentData = discoverData 
    ? activeTab === 'featured' ? discoverData.featured
      : activeTab === 'trending' ? discoverData.trending  
      : discoverData.recent_activity
    : [];

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full px-4 py-2 mb-6">
            <Eye className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">Live Examples</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            See What Others Are Asking
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse real feedback requests from our community. Get inspired, see the quality, 
            then submit your own for honest opinions.
          </p>
        </div>

        {/* Popular Categories */}
        {discoverData?.popular_categories && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Popular Categories</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {discoverData.popular_categories.slice(0, 6).map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {cat.category.replace('_', ' ')}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md border border-gray-200">
            {(['featured', 'trending', 'recent'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'featured' && <Star className="h-4 w-4 inline mr-2" />}
                {tab === 'trending' && <TrendingUp className="h-4 w-4 inline mr-2" />}
                {tab === 'recent' && <Clock className="h-4 w-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Request Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentData.slice(0, 6).map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden group cursor-pointer"
              onClick={() => handleViewRequest(request.id)}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full capitalize">
                    {request.category.replace('_', ' ')}
                  </span>
                  {request.featured && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs">Featured</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed">
                  {request.preview_text}
                </p>
              </div>

              {/* Media Preview */}
              {request.media_type && (
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      {request.media_type === 'image' ? '🖼️' : '📄'}
                    </div>
                    <span className="text-xs capitalize">{request.media_type} content</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {request.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {request.response_count || 0}
                    </span>
                    {request.average_rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        {request.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="mt-2 text-center">
                  <div className="inline-block bg-indigo-600 text-white text-xs px-3 py-1 rounded-full group-hover:bg-indigo-700 transition-colors">
                    View Full Request →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-semibold text-gray-900">Ready to Join?</span>
          </div>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Sign up to view full requests, submit your own for feedback, and become part of our 
            honest feedback community. It's free to start!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              I Have an Account
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">✓ Free to browse</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">✓ Real feedback</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">✓ Anonymous & safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}