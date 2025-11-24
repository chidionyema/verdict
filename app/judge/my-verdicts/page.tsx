'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Calendar, DollarSign, Award, Filter, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VerdictResponse {
  id: string;
  created_at: string;
  rating: number;
  feedback: string;
  tone: string;
  quality_score: number | null;
  judge_earning: number;
  request_id: string;
  verdict_requests?: {
    category: string;
    subcategory: string | null;
    context: string;
    media_type: string;
  };
}

export default function MyVerdictsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [verdicts, setVerdicts] = useState<VerdictResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTone, setFilterTone] = useState<'all' | 'encouraging' | 'honest' | 'constructive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVerdicts();
  }, []);

  const fetchVerdicts = async () => {
    try {
      const res = await fetch('/api/judge/my-responses?limit=100');
      if (!res.ok) {
        throw new Error('Failed to fetch verdicts');
      }
      const data = await res.json();
      setVerdicts(data.responses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verdicts');
    } finally {
      setLoading(false);
    }
  };

  const filteredVerdicts = verdicts.filter(verdict => {
    const matchesTone = filterTone === 'all' || verdict.tone === filterTone;
    const matchesSearch = searchTerm === '' || 
      verdict.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verdict.verdict_requests?.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verdict.verdict_requests?.context.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTone && matchesSearch;
  });

  const totalEarnings = verdicts.reduce((sum, v) => sum + parseFloat(v.judge_earning?.toString() || '0'), 0);
  const averageRating = verdicts.length > 0
    ? verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) / verdicts.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/judge"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Verdicts</h1>
          <p className="text-gray-600 mt-1">
            Review all your submitted verdicts and earnings
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Verdicts</p>
                <p className="text-2xl font-bold">{verdicts.length}</p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}/10</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold">
                  {verdicts.filter(v => v.quality_score).length > 0
                    ? (verdicts
                        .filter(v => v.quality_score)
                        .reduce((sum, v) => sum + parseFloat(v.quality_score?.toString() || '0'), 0) /
                      verdicts.filter(v => v.quality_score).length).toFixed(1)
                    : '-'}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search verdicts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterTone}
                onChange={(e) => setFilterTone(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
              >
                <option value="all">All Tones</option>
                <option value="encouraging">Encouraging</option>
                <option value="honest">Honest</option>
                <option value="constructive">Constructive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verdicts List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredVerdicts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {verdicts.length === 0 ? 'No verdicts yet' : 'No verdicts match your filters'}
            </h3>
            <p className="text-gray-500">
              {verdicts.length === 0
                ? 'Start judging requests to see your verdicts here'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {verdicts.length === 0 && (
              <Link
                href="/judge"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View Available Requests
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerdicts.map((verdict) => (
              <div
                key={verdict.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                        {verdict.verdict_requests?.category || 'Unknown'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          verdict.tone === 'encouraging'
                            ? 'bg-green-100 text-green-700'
                            : verdict.tone === 'honest'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {verdict.tone}
                      </span>
                      {verdict.quality_score && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          Quality: {parseFloat(verdict.quality_score.toString()).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {verdict.verdict_requests?.context?.substring(0, 150)}
                      {verdict.verdict_requests?.context && verdict.verdict_requests.context.length > 150 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(verdict.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {verdict.rating}/10
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        ${parseFloat(verdict.judge_earning?.toString() || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-gray-700 leading-relaxed">{verdict.feedback}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/requests/${verdict.request_id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Original Request →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

