'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Star, 
  Eye, 
  MessageSquare,
  TrendingUp,
  Clock,
  Grid,
  List
} from 'lucide-react';

interface SearchResult {
  id: string;
  category: string;
  subcategory?: string;
  context: string;
  media_type: string;
  media_url?: string;
  text_content?: string;
  status: string;
  created_at: string;
  view_count: number;
  featured: boolean;
  average_rating: number;
  response_count: number;
  preview_text: string;
  search_score?: number;
}

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
  filters_applied: {
    query: string;
    category?: string;
    status?: string;
    sort: string;
  };
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'profile', label: 'Profile' },
  { value: 'writing', label: 'Writing' },
  { value: 'decision', label: 'Decision' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_responses', label: 'Most Responses' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialSort = searchParams.get('sort') || 'relevance';
  const initialPage = parseInt(searchParams.get('page') || '1');

  // State
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string, searchCategory: string, searchStatus: string, searchSort: string, page: number = 1) => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: page.toString(),
          limit: '20',
        });

        if (searchCategory) params.set('category', searchCategory);
        if (searchStatus) params.set('status', searchStatus);
        if (searchSort) params.set('sort', searchSort);

        const response = await fetch(`/api/search?${params}`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSearchData(data);

        // Update URL without triggering a page reload
        const newParams = new URLSearchParams();
        if (searchQuery) newParams.set('q', searchQuery);
        if (searchCategory) newParams.set('category', searchCategory);
        if (searchStatus) newParams.set('status', searchStatus);
        if (searchSort && searchSort !== 'relevance') newParams.set('sort', searchSort);
        if (page > 1) newParams.set('page', page.toString());

        const newUrl = `/search${newParams.toString() ? '?' + newParams.toString() : ''}`;
        router.replace(newUrl);

      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Load suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialCategory, initialStatus, initialSort, initialPage);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== initialQuery || category !== initialCategory || status !== initialStatus || sortBy !== initialSort) {
        performSearch(query, category, status, sortBy, 1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, category, status, sortBy]);

  useEffect(() => {
    loadSuggestions(query);
  }, [query, loadSuggestions]);

  const handlePageChange = (newPage: number) => {
    performSearch(query, category, status, sortBy, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    if (suggestion.category && suggestion.type === 'category') {
      setCategory(suggestion.category);
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

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow ${
      viewMode === 'list' ? 'flex space-x-4 p-4' : 'p-6'
    }`}>
      {result.media_type === 'photo' && result.media_url && (
        <div className={`${viewMode === 'list' ? 'w-20 h-20 flex-shrink-0' : 'w-full h-48 mb-4'} rounded-lg overflow-hidden bg-gray-100`}>
          <img
            src={result.media_url}
            alt="Request preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
              {result.category}
            </span>
            {result.subcategory && (
              <span className="text-xs text-gray-500">{result.subcategory}</span>
            )}
            {result.featured && (
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            result.status === 'completed' 
              ? 'bg-green-100 text-green-800'
              : result.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {result.status}
          </span>
        </div>
        
        <p className={`text-gray-700 mb-3 ${viewMode === 'list' ? 'text-sm' : ''}`}>
          {result.preview_text}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {result.view_count}
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {result.response_count}
            </div>
            {result.average_rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400" />
                {result.average_rating.toFixed(1)}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {formatTimeAgo(result.created_at)}
          </div>
        </div>
        
        <div className="mt-4">
          <Link
            href={`/requests/${result.id}`}
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            View Request
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Requests</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search for requests..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{suggestion.text}</span>
                      <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Filters Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Extended Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {STATUSES.map(stat => (
                      <option key={stat.value} value={stat.value}>
                        {stat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Searching...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {searchData && !loading && (
          <>
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found {searchData.pagination.total.toLocaleString()} results
                {searchData.filters_applied.query && (
                  <span> for "{searchData.filters_applied.query}"</span>
                )}
              </p>
            </div>
            
            {/* Results Grid/List */}
            {searchData.results.length > 0 ? (
              <>
                <div className={`${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                } mb-8`}>
                  {searchData.results.map(result => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
                
                {/* Pagination */}
                {searchData.pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    {[...Array(Math.min(10, searchData.pagination.total_pages))].map((_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === searchData.pagination.page;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded ${
                            isCurrentPage
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    {searchData.pagination.has_more && (
                      <button
                        onClick={() => handlePageChange(searchData.pagination.page + 1)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
                <Link
                  href="/discover"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Explore Popular Content
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}