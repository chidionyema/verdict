'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Book, 
  MessageCircle, 
  HelpCircle, 
  Star,
  ChevronRight,
  Eye,
  ThumbsUp,
  Filter,
  Zap,
  Shield,
  DollarSign,
  Users,
  Camera,
  FileText,
  Gavel
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface HelpData {
  articles: HelpArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  categories: string[];
}

const categoryIcons: Record<string, any> = {
  'getting-started': <Zap className="h-6 w-6" />,
  'account': <Users className="h-6 w-6" />,
  'requests': <Camera className="h-6 w-6" />,
  'judging': <Gavel className="h-6 w-6" />,
  'billing': <DollarSign className="h-6 w-6" />,
  'safety': <Shield className="h-6 w-6" />,
  'technical': <HelpCircle className="h-6 w-6" />,
  'policies': <FileText className="h-6 w-6" />,
};

const categoryDescriptions: Record<string, string> = {
  'getting-started': 'Learn the basics of using Verdict',
  'account': 'Account settings and profile management',
  'requests': 'Creating and managing verdict requests',
  'judging': 'How to become and succeed as a judge',
  'billing': 'Credits, subscriptions, and payments',
  'safety': 'Community guidelines and safety features',
  'technical': 'Technical support and troubleshooting',
  'policies': 'Terms, privacy, and platform policies',
};

export default function HelpPage() {
  const [helpData, setHelpData] = useState<HelpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchHelpArticles();
  }, [searchQuery, selectedCategory]);

  const fetchHelpArticles = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', '50');

      const response = await fetch(`/api/help/articles?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch help articles');
      }

      const data = await response.json();
      setHelpData(data);
    } catch (err) {
      setError('Failed to load help content');
      console.error('Help articles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredArticles = helpData?.articles.filter(article => article.is_featured) || [];
  const regularArticles = helpData?.articles.filter(article => !article.is_featured) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const CategoryCard = ({ category }: { category: string }) => (
    <button
      onClick={() => setSelectedCategory(category === selectedCategory ? '' : category)}
      className={`w-full p-6 rounded-lg border-2 transition-all ${
        selectedCategory === category
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${
          selectedCategory === category ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {categoryIcons[category] || <HelpCircle className="h-6 w-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-gray-900 capitalize">
            {category.replace('-', ' ')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {categoryDescriptions[category] || 'Help articles and guides'}
          </p>
        </div>
        <ChevronRight className={`h-5 w-5 transition-transform ${
          selectedCategory === category ? 'rotate-90' : ''
        } text-gray-400`} />
      </div>
    </button>
  );

  const ArticleCard = ({ article, featured = false }: { article: HelpArticle; featured?: boolean }) => (
    <Link
      href={`/help/${article.id}`}
      className={`block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 ${
        featured ? 'border-l-4 border-l-indigo-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full capitalize">
            {article.category.replace('-', ' ')}
          </span>
          {featured && (
            <Star className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {article.view_count}
          </div>
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" />
            {article.helpful_count}
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {article.profiles?.full_name || 'Verdict Team'}
        </span>
        <span>{formatDate(article.created_at)}</span>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading help content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions and learn how to get the most out of Verdict
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-center space-x-6 mt-8">
            <Link
              href="/support"
              className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contact Support
            </Link>
            <Link
              href="/help/getting-started"
              className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Book className="h-5 w-5 mr-2" />
              Getting Started
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Categories */}
        {helpData?.categories && helpData.categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {helpData.categories.map((category) => (
                <CategoryCard key={category} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        {regularArticles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory 
                  ? `${selectedCategory.replace('-', ' ')} Articles` 
                  : searchQuery 
                  ? 'Search Results' 
                  : 'All Articles'
                }
              </h2>
              
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchQuery('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {helpData && helpData.articles.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or browse all categories'
                : 'No help articles are available at the moment'
              }
            </p>
            
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Browse All Articles
              </button>
            )}
          </div>
        )}

        {/* Contact Support CTA */}
        <div className="text-center bg-indigo-600 rounded-lg p-8 text-white mt-16">
          <MessageCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you get the most out of Verdict.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/support"
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Contact Support
            </Link>
            <Link
              href="/help/getting-started"
              className="inline-block border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Getting Started Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}