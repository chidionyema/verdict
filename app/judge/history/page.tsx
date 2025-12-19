'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Star, ArrowLeft, Filter, MessageSquare, Award } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface VerdictResponse {
  id: string;
  created_at: string;
  rating: number | null;
  feedback: string;
  tone: 'honest' | 'constructive' | 'encouraging';
  request_id: string;
  verdict_requests: {
    category: string;
    subcategory: string | null;
    media_type: string;
  };
}

export default function JudgeHistoryPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<VerdictResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTone, setFilterTone] = useState<string>('all');

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const res = await fetch('/api/judge/my-responses?limit=50');
      if (!res.ok) {
        throw new Error('Failed to fetch responses');
      }
      const data = await res.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load your verdict history');
    } finally {
      setLoading(false);
    }
  };

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    if (filterCategory !== 'all' && response.verdict_requests.category !== filterCategory) {
      return false;
    }
    if (filterTone !== 'all' && response.tone !== filterTone) {
      return false;
    }
    return true;
  });

  // Calculate stats
  const totalVerdicts = responses.length;
  const avgRating = responses.length > 0
    ? responses.reduce((sum, r) => sum + (r.rating || 0), 0) / responses.filter(r => r.rating).length
    : 0;
  const categoryCounts = responses.reduce((acc, r) => {
    const cat = r.verdict_requests.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/judge/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">My Verdict History</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full mb-2">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">{totalVerdicts}</p>
              <p className="text-sm text-indigo-700">Total Verdicts</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-600 text-white rounded-full mb-2">
                <Star className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {avgRating ? avgRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-yellow-700">Avg Rating</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full mb-2">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {responses.filter(r => (r.rating || 0) >= 8).length}
              </p>
              <p className="text-sm text-green-700">Top Rated</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full mb-2">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {responses.length > 0
                  ? new Date(responses[0].created_at).toLocaleDateString()
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-purple-700">Latest</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {filteredResponses.length} Verdict{filteredResponses.length !== 1 ? 's' : ''}
              {filteredResponses.length !== responses.length &&
                <span className="text-gray-500"> (filtered from {responses.length})</span>
              }
            </h2>

            <div className="flex gap-3">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="appearance">Appearance</option>
                  <option value="profile">Profile</option>
                  <option value="writing">Writing</option>
                  <option value="decision">Decision</option>
                </select>
                <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Tone Filter */}
              <div className="relative">
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Tones</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="honest">Honest</option>
                  <option value="constructive">Constructive</option>
                </select>
                <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Verdicts List */}
        <div className="space-y-4">
          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {responses.length === 0 ? 'No verdicts yet' : 'No verdicts match your filters'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {responses.length === 0
                  ? 'Start reviewing submissions to see your verdict history here'
                  : 'Try adjusting your filter criteria'
                }
              </p>
              {responses.length === 0 && (
                <Link
                  href="/judge/dashboard"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  View Available Requests
                </Link>
              )}
            </div>
          ) : (
            filteredResponses.map((response) => (
              <div
                key={response.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                        {response.verdict_requests.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          response.tone === 'encouraging'
                            ? 'bg-green-100 text-green-700'
                            : response.tone === 'honest'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {response.tone}
                      </span>
                      {response.rating && response.rating >= 8 && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Award className="h-3 w-3" />
                          Top rated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {new Date(response.created_at).toLocaleString()}
                    </p>
                  </div>
                  {response.rating && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {response.rating}/10
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < response.rating! / 2
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {response.feedback}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Request ID: {response.request_id.slice(0, 8)}...
                    </div>
                    <Link
                      href={`/requests/${response.request_id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Request →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
