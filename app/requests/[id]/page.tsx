'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  User,
  ArrowLeft,
  RefreshCw,
  ThumbsUp,
  Share2,
  Download,
  Filter,
  SortAsc,
  TrendingUp,
  BarChart3,
  Heart,
  MessageSquare,
  Copy,
  Award,
  Target,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { VerdictRequest, VerdictResponse } from '@/lib/database.types';
import ReportContentButton from '@/components/ReportContentButton';
import VerdictRatingModal from '@/components/VerdictRatingModal';
import { ThankJudgesButton } from '@/components/request/ThankJudgesButton';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { getTierConfigByVerdictCount, PRICE_PER_CREDIT_USD } from '@/lib/validations';

interface VerdictWithNumber extends VerdictResponse {
  judge_number: number;
}

interface UserContext {
  isSeeker: boolean;
  isJudge: boolean;
  userId: string | null;
  myVerdictId: string | null; // If judge, their verdict ID for this request
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [request, setRequest] = useState<VerdictRequest | null>(null);
  const [verdicts, setVerdicts] = useState<VerdictWithNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userContext, setUserContext] = useState<UserContext>({
    isSeeker: false,
    isJudge: false,
    userId: null,
    myVerdictId: null,
  });
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedVerdictForRating, setSelectedVerdictForRating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date');
  const [filterTone, setFilterTone] = useState<'all' | 'encouraging' | 'honest' | 'constructive'>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [verdictInteractions, setVerdictInteractions] = useState<Record<string, { helpful: boolean, bookmarked: boolean }>>({});

  useEffect(() => {
    fetchRequest();

    // Poll for new verdicts if still in progress
    const interval = setInterval(() => {
      if (request?.status === 'in_progress' || request?.status === 'open') {
        fetchRequest();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, request?.status]);

  // Fetch user context after request is loaded
  useEffect(() => {
    if (request) {
      fetchUserContext();
    }
  }, [request]);

  const fetchUserContext = async () => {
    if (!request) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_judge')
        .eq('id', user.id)
        .single();

      // Check if user is the request owner
      const isSeeker = request.user_id === user.id;
      const isJudge =
        !!(profile && (profile as { is_judge?: boolean }).is_judge);

      // If judge, check if they've given a verdict for this request
      let myVerdictId: string | null = null;
      if (isJudge) {
        const { data: myVerdict } = await supabase
          .from('verdict_responses')
          .select('id')
          .eq('request_id', request.id)
          .eq('judge_id', user.id)
          .single();
        if (myVerdict) {
          myVerdictId = (myVerdict as { id?: string }).id || null;
        }
      }

      setUserContext({
        isSeeker,
        isJudge,
        userId: user.id,
        myVerdictId,
      });
    } catch (err) {
      console.error('Error fetching user context:', err);
    }
  };

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Request not found');
        } else if (res.status === 403) {
          setError('You do not have access to this request');
        } else {
          setError('Failed to load request');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRequest(data.request);
      setVerdicts(data.verdicts || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load request');
      setLoading(false);
    }
  };

  const handleRateVerdict = (verdictId: string) => {
    setSelectedVerdictForRating(verdictId);
    setRatingModalOpen(true);
  };

  const handleRatingSubmit = () => {
    // Refresh the data to show updated ratings
    fetchRequest();
  };

  const toggleVerdictInteraction = (verdictId: string, type: 'helpful' | 'bookmarked') => {
    setVerdictInteractions(prev => ({
      ...prev,
      [verdictId]: {
        ...prev[verdictId],
        [type]: !prev[verdictId]?.[type]
      }
    }));
  };

  // Filter and sort verdicts
  const filteredAndSortedVerdicts = verdicts
    .filter(verdict => filterTone === 'all' || verdict.tone === filterTone)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'helpful':
          const aHelpful = verdictInteractions[a.id]?.helpful ? 1 : 0;
          const bHelpful = verdictInteractions[b.id]?.helpful ? 1 : 0;
          return bHelpful - aHelpful;
        default: // date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-4" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-64 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4 text-lg font-semibold">{error || 'Request not found'}</div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchRequest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium min-h-[44px]"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition font-medium min-h-[44px] flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const averageRating =
    verdicts.length > 0
      ? verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) / verdicts.filter(v => v.rating).length
      : 0;

  const progress = (request.received_verdict_count / request.target_verdict_count) * 100;

  const tierConfig = request.target_verdict_count
    ? getTierConfigByVerdictCount(request.target_verdict_count)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {userContext.isSeeker ? (
              <Link
                href="/my-requests"
                className="flex items-center text-gray-600 hover:text-gray-900 transition min-h-[44px]"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to My Requests
              </Link>
            ) : userContext.isJudge ? (
              <Link
                href="/judge/my-verdicts"
                className="flex items-center text-gray-600 hover:text-gray-900 transition min-h-[44px]"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to My Verdicts
              </Link>
            ) : (
              <Link
                href="/judge"
                className="flex items-center text-gray-600 hover:text-gray-900 transition min-h-[44px]"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Judge Dashboard
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'in_progress' || request.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'closed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.status === 'in_progress' || request.status === 'open' ? 'In Progress' : 
                 request.status === 'closed' ? 'Completed' : 'Cancelled'}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {request.category.charAt(0).toUpperCase() + request.category.slice(1)} Feedback Request
              </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {request.received_verdict_count}/{request.target_verdict_count} verdicts
                </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">
                  {(() => {
                    const target = request.target_verdict_count || 0;
                    const received = request.received_verdict_count || 0;
                    if (received === 0) return 'Waiting for first verdict';
                    if (received < target) return 'Partial results available';
                    return 'All verdicts received';
                  })()}
                </span>
              </span>
              {tierConfig && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                  {(() => {
                    const dollars = tierConfig.credits * PRICE_PER_CREDIT_USD;
                    return (
                      <>
                        <span className="text-xs capitalize">{tierConfig.tier} tier</span>
                        <span className="text-xs">· {tierConfig.verdicts} verdicts</span>
                        <span className="text-xs">
                          · {tierConfig.credits} credit{tierConfig.credits !== 1 ? 's' : ''} (~$
                          {dollars.toFixed(2)})
                        </span>
                      </>
                    );
                  })()}
                </span>
              )}
                {verdicts.length > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Star className="h-4 w-4 fill-current" />
                    {averageRating.toFixed(1)}/10 avg
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {verdicts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('verdicts-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                >
                  See your feedback
                </button>
              )}
              {(request.status === 'in_progress' || request.status === 'open') && (
                <button
                  onClick={fetchRequest}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              )}
              {request.status === 'closed' && (
                <>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </>
              )}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  showAnalytics 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
              <ReportContentButton 
                contentType="verdict_request" 
                contentId={request.id} 
                className="text-gray-500 hover:text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Progress / State */}
        {(request.status === 'in_progress' || request.status === 'open') && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Verdict progress
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {request.received_verdict_count}/{request.target_verdict_count} verdicts
                </p>
              </div>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {request.received_verdict_count === 0
                ? 'Judges are reviewing your submission. New verdicts will appear here automatically.'
                : "You're now seeing real feedback from our judges. We'll add more verdicts here as they come in."}
            </p>
          </div>
        )}

        {/* Summary insight + optional analytics */}
        {verdicts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Summary insight
                </p>
                <p className="text-base text-gray-900">
                  {averageRating >= 8
                    ? 'Judges are strongly in favor of what you shared.'
                    : averageRating >= 6
                    ? 'Judges see both strengths and areas to improve.'
                    : 'Judges are cautious and recommend meaningful changes.'}{' '}
                  <span className="font-semibold">
                    (Average rating {averageRating.toFixed(1)}/10 from {verdicts.length} verdict
                    {verdicts.length !== 1 ? 's' : ''})
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showAnalytics
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                {showAnalytics ? 'Hide detail' : 'Show detail'}
              </button>
            </div>

            {showAnalytics && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full mx-auto mb-2">
                      <Award className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{averageRating.toFixed(1)}</p>
                    <p className="text-blue-700 text-sm">Average Rating</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {averageRating >= 8 ? 'Excellent!' : averageRating >= 6 ? 'Good' : 'Needs improvement'}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full mx-auto mb-2">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">{verdicts.length}</p>
                    <p className="text-green-700 text-sm">Total Verdicts</p>
                    <p className="text-xs text-green-600 mt-1">
                      {verdicts.length >= (tierConfig?.verdicts ?? 3) ? 'Complete' : 'Growing'}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full mx-auto mb-2">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.max(...verdicts.map(v => v.rating || 0)).toFixed(1)}
                    </p>
                    <p className="text-purple-700 text-sm">Highest Rating</p>
                    <p className="text-xs text-purple-600 mt-1">Peak performance</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-600 text-white rounded-full mx-auto mb-2">
                      <Heart className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">
                      {verdicts.filter(v => v.tone === 'encouraging').length}
                    </p>
                    <p className="text-yellow-700 text-sm">Encouraging</p>
                    <p className="text-xs text-yellow-600 mt-1">Positive feedback</p>
                  </div>
                </div>

                {/* Tone Distribution */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Feedback Tone Distribution</h4>
                  <div className="space-y-2">
                    {['encouraging', 'honest', 'constructive'].map(tone => {
                      const count = verdicts.filter(v => v.tone === tone).length;
                      const percentage = (count / verdicts.length) * 100;
                      return (
                        <div key={tone} className="flex items-center justify-between">
                          <span className="text-sm capitalize font-medium text-gray-700">{tone}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  tone === 'encouraging' ? 'bg-green-500' :
                                  tone === 'honest' ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Condensed Summary for non-analytics view */}
        {!showAnalytics && verdicts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{averageRating.toFixed(1)}/10</p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{verdicts.length}</p>
                <p className="text-sm text-gray-500">Verdicts Received</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 capitalize">{request.category}</p>
                <p className="text-sm text-gray-500">Category</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Submission Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {userContext.isSeeker 
                    ? 'Your Submission' 
                    : userContext.isJudge 
                    ? 'Request to Review' 
                    : 'Submission'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.media_type === 'photo' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {request.media_type}
                </span>
              </div>
              
              {request.media_type === 'photo' && request.media_url ? (
                <div className="relative mb-4">
                  <img
                    src={request.media_url}
                    alt={userContext.isSeeker ? "Your submission" : "Seeker's submission"}
                    className="w-full rounded-xl shadow-sm"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => request.media_url && window.open(request.media_url, '_blank')}
                      className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition"
                      title="View full size"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 text-sm leading-relaxed">{request.text_content}</p>
                  </div>
                </div>
              )}

              {/* Detailed Metadata */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Category</span>
                  <span className="text-sm text-gray-900 capitalize font-medium">{request.category}</span>
                </div>
                
                {request.subcategory && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Type</span>
                    <span className="text-sm text-gray-900 capitalize">{request.subcategory}</span>
                  </div>
                )}

                <div className="py-2">
                  <span className="text-sm font-medium text-gray-600 block mb-2">Context</span>
                  <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg break-words whitespace-pre-wrap max-w-full">
                    {request.context}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Submitted</span>
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm min-h-[44px]"
                    aria-label="Copy link to this request"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                  {request.status === 'closed' && (
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verdicts List */}
          <div className="lg:col-span-2" id="verdicts-section">
            {verdicts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Verdicts
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.received_verdict_count}/{request.target_verdict_count} received
                    </h3>
                    {filteredAndSortedVerdicts.length !== verdicts.length && (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing {filteredAndSortedVerdicts.length} of {verdicts.length} verdicts
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {/* Filter Dropdown */}
                    <div className="relative">
                      <select
                        value={filterTone}
                        onChange={(e) => setFilterTone(e.target.value as any)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Tones</option>
                        <option value="encouraging">Encouraging</option>
                        <option value="honest">Honest</option>
                        <option value="constructive">Constructive</option>
                      </select>
                      <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="rating">Sort by Rating</option>
                        <option value="helpful">Sort by Helpful</option>
                      </select>
                      <SortAsc className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {verdicts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {userContext.isSeeker 
                      ? 'Waiting for verdicts' 
                      : userContext.isJudge 
                      ? 'No verdicts yet' 
                      : 'Waiting for verdicts'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {userContext.isSeeker
                      ? 'Judges are reviewing your submission. New verdicts will appear here automatically.'
                      : userContext.isJudge
                      ? 'Be the first to provide feedback on this request.'
                      : 'Judges are reviewing this submission. New verdicts will appear here automatically.'}
                  </p>
                  {request.status === 'open' && userContext.isSeeker && (
                    <div className="mt-4 text-xs text-gray-400">
                      🔄 Checking for updates every 5 seconds
                    </div>
                  )}
                  {userContext.isJudge && request.status !== 'closed' && (
                    <Link
                      href={`/judge/requests/${request.id}`}
                      className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Provide Your Verdict
                    </Link>
                  )}
                </div>
              ) : filteredAndSortedVerdicts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No verdicts match your filter</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filter criteria</p>
                </div>
              ) : (
              filteredAndSortedVerdicts.map((verdict) => {
                const isMyVerdict = userContext.isJudge && verdict.id === userContext.myVerdictId;
                return (
                <div
                  key={verdict.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border p-6 ${
                    isMyVerdict 
                      ? 'border-indigo-300 bg-indigo-50/30' 
                      : 'border-gray-100'
                  }`}
                >
                  {isMyVerdict && (
                    <div className="mb-3 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium inline-flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Your Verdict
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 rounded-full p-3">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Anonymous Judge #{verdict.judge_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(verdict.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {verdict.rating && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {verdict.rating}/10
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < verdict.rating! / 2
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
                    <p className="text-gray-700 leading-relaxed">{verdict.feedback}</p>
                  </div>

                  {/* Enhanced Actions Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          verdict.tone === 'encouraging'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : verdict.tone === 'honest'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {verdict.tone}
                      </span>
                      
                      {verdict.rating && verdict.rating >= 8 && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Award className="h-3 w-3" />
                          Top rated
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Helpful Button */}
                      <button
                        onClick={() => toggleVerdictInteraction(verdict.id, 'helpful')}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          verdictInteractions[verdict.id]?.helpful
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${verdictInteractions[verdict.id]?.helpful ? 'fill-current' : ''}`} />
                        Helpful
                      </button>

                      {/* Bookmark Button */}
                      <button
                        onClick={() => toggleVerdictInteraction(verdict.id, 'bookmarked')}
                        className={`p-2 rounded-lg transition-colors ${
                          verdictInteractions[verdict.id]?.bookmarked
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${verdictInteractions[verdict.id]?.bookmarked ? 'fill-current' : ''}`} />
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(verdict.feedback);
                          toast.success('Verdict copied to clipboard!');
                        }}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors min-h-[44px] min-w-[44px]"
                        title="Copy verdict text"
                        aria-label="Copy verdict text"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      {/* Rate Button */}
                      {request?.status === 'closed' && (
                        <button
                          onClick={() => handleRateVerdict(verdict.id)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors text-sm font-medium"
                        >
                          Rate Judge
                        </button>
                      )}

                      {/* Report Button */}
                      <ReportContentButton 
                        contentType="verdict_response" 
                        contentId={verdict.id} 
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* Enhanced Action Section */}
        {request.status === 'closed' && verdicts.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200">
            <div className="text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Request Complete!
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                You've received {verdicts.length} expert verdict{verdicts.length !== 1 ? 's' : ''} with an average rating of {averageRating.toFixed(1)}/10.
                Ready to get feedback on something else?
              </p>

              {/* Thank Judges Button */}
              <div className="mb-8">
                <ThankJudgesButton
                  requestId={request.id}
                  judgeCount={verdicts.length}
                  onSuccess={() => alert('Your appreciation has been sent to all judges!')}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/start"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg"
                >
                  <Target className="h-5 w-5" />
                  Create New Request
                </Link>
                <Link
                  href="/my-requests"
                  className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition border border-gray-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  View All Requests
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Open Request Action */}
        {(request.status === 'in_progress' || request.status === 'open') && (
          <div className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200 text-center">
            <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your request is being reviewed
            </h3>
            <p className="text-gray-600 mb-4">
              Expert judges are evaluating your submission. New verdicts will appear automatically.
            </p>
            <div className="text-sm text-gray-500">
              🔄 Checking for updates every 5 seconds
            </div>
          </div>
        )}

        {/* Verdict Rating Modal */}
        {selectedVerdictForRating && (
          <VerdictRatingModal
            verdictId={selectedVerdictForRating}
            judgeId={verdicts.find(v => v.id === selectedVerdictForRating)?.judge_id || ''}
            isOpen={ratingModalOpen}
            onClose={() => {
              setRatingModalOpen(false);
              setSelectedVerdictForRating(null);
            }}
            onSubmit={handleRatingSubmit}
          />
        )}
      </div>
    </div>
  );
}
