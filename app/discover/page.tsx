'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Star, 
  Eye, 
  MessageSquare, 
  Flame, 
  Clock, 
  Search,
  ChevronRight,
  Tag,
  Users,
  Zap
} from 'lucide-react';

interface DiscoverData {
  featured?: any[];
  trending?: any[];
  popular_categories?: { category: string; count: number }[];
  popular_tags?: any[];
  recent_activity?: any[];
  popular_searches?: { search_query: string; search_count: number }[];
  metadata?: {
    section: string;
    generated_at: string;
    cache_duration: number;
  };
}

export default function DiscoverPage() {
  const [data, setData] = useState<DiscoverData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/discover?section=all');
      if (!response.ok) {
        throw new Error('Failed to fetch discovery data');
      }

      const discoverData = await response.json();
      setData(discoverData);
    } catch (err) {
      setError('Failed to load content. Please try again.');
      console.error('Discover error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  const CategoryCard = ({ category, count }: { category: string; count: number }) => {
    const categoryInfo = {
      appearance: { icon: '👔', description: 'Photos and styling advice', color: 'bg-purple-500' },
      profile: { icon: '👤', description: 'Dating and professional profiles', color: 'bg-blue-500' },
      writing: { icon: '✍️', description: 'Text content and communication', color: 'bg-green-500' },
      decision: { icon: '🤔', description: 'Life choices and purchases', color: 'bg-yellow-500' },
    };
    
    const info = categoryInfo[category as keyof typeof categoryInfo] || { 
      icon: '📝', 
      description: 'General requests', 
      color: 'bg-gray-500' 
    };

    return (
      <Link
        href={`/search?category=${category}`}
        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${info.color} rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
            {info.icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500">requests</div>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 capitalize">{category}</h3>
        <p className="text-sm text-gray-600">{info.description}</p>
        <div className="mt-4 flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors">
          <span className="text-sm font-medium">Explore</span>
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    );
  };

  const RequestCard = ({ request, featured = false }: { request: any; featured?: boolean }) => (
    <Link
      href={`/requests/${request.id}`}
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
    >
      {request.media_type === 'photo' && request.media_url && (
        <div className="w-full h-40 rounded-t-lg overflow-hidden bg-gray-100">
          <img
            src={request.media_url}
            alt="Request preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
            {request.category}
          </span>
          {featured && (
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Featured</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
          {request.preview_text || request.context}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {request.view_count}
            </div>
            {request.response_count > 0 && (
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {request.response_count}
              </div>
            )}
          </div>
          <span>{formatTimeAgo(request.created_at)}</span>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading discovery content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDiscoverData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
          <p className="text-gray-600">Explore trending requests, popular categories, and featured content</p>
        </div>

        {/* Featured Content */}
        {data.featured && data.featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Requests</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.featured.slice(0, 6).map(request => (
                <RequestCard key={request.id} request={request} featured />
              ))}
            </div>
            {data.featured.length > 6 && (
              <div className="text-center mt-6">
                <Link
                  href="/search?featured=true"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all featured content
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Popular Categories */}
        {data.popular_categories && data.popular_categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Flame className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.popular_categories.map(({ category, count }) => (
                <CategoryCard key={category} category={category} count={count} />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Trending Requests */}
          <div className="lg:col-span-2">
            {data.trending && data.trending.length > 0 && (
              <section>
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-6 w-6 text-green-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Trending This Week</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.trending.slice(0, 4).map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/search?sort=most_viewed"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all trending
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Popular Tags */}
            {data.popular_tags && data.popular_tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Tag className="h-5 w-5 text-indigo-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Popular Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.popular_tags.slice(0, 8).map(tag => (
                    <Link
                      key={tag.name}
                      href={`/search?q=${encodeURIComponent(tag.name)}`}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {data.popular_searches && data.popular_searches.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Search className="h-5 w-5 text-purple-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Popular Searches</h3>
                </div>
                <div className="space-y-2">
                  {data.popular_searches.slice(0, 6).map(search => (
                    <Link
                      key={search.search_query}
                      href={`/search?q=${encodeURIComponent(search.search_query)}`}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">
                        {search.search_query}
                      </span>
                      <span className="text-xs text-gray-500">{search.search_count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {data.recent_activity && data.recent_activity.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {data.recent_activity.slice(0, 5).map(request => (
                    <Link
                      key={request.id}
                      href={`/requests/${request.id}`}
                      className="block group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 group-hover:text-indigo-700 transition-colors line-clamp-2">
                            {request.preview_text}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span className="capitalize">{request.category}</span>
                            <span className="mx-1">•</span>
                            <span>{formatTimeAgo(request.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <section className="text-center bg-indigo-600 rounded-lg p-8 text-white">
          <Zap className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Ready to Get Your Verdict?</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join thousands of users getting honest feedback on photos, profiles, and writing. 
            Start with 3 free credits!
          </p>
          <Link
            href="/start"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Get Your First Verdict
          </Link>
        </section>
      </div>
    </div>
  );
}