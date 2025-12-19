'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  RotateCcw, 
  Trophy, 
  TrendingUp, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  ArrowLeft,
  Target,
  Camera,
  MessageSquare,
  BarChart3,
  Eye
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';

interface SplitTestRequest {
  id: string;
  created_at: string;
  user_id: string;
  context: string;
  photo_a_url: string;
  photo_b_url: string;
  status: string;
  target_verdict_count: number;
  received_verdict_count: number;
  winning_photo?: 'A' | 'B' | 'tie';
  consensus_strength?: number;
  completed_at?: string;
}

interface SplitTestVerdict {
  id: string;
  created_at: string;
  judge_id: string;
  chosen_photo: 'A' | 'B';
  confidence_score: number;
  reasoning: string;
  photo_a_feedback: string;
  photo_a_strengths: string[];
  photo_a_improvements: string[];
  photo_a_rating: number;
  photo_b_feedback: string;
  photo_b_strengths: string[];
  photo_b_improvements: string[];
  photo_b_rating: number;
  judge_expertise: string[];
  time_spent_seconds: number;
}

interface SplitTestData extends SplitTestRequest {
  verdicts: SplitTestVerdict[];
}

export default function SplitTestPage() {
  const params = useParams();
  const splitTestId = params.id as string;
  
  const [splitTest, setSplitTest] = useState<SplitTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSplitTest();
  }, [splitTestId]);

  const fetchSplitTest = async () => {
    try {
      const supabase = createClient();
      
      // Fetch split test request
      const { data: splitTestData, error: splitTestError } = await supabase
        .from('split_test_requests')
        .select('*')
        .eq('id', splitTestId)
        .single();

      if (splitTestError) throw splitTestError;

      // Fetch verdicts
      const { data: verdicts, error: verdictsError } = await supabase
        .from('split_test_verdicts')
        .select('*')
        .eq('split_test_request_id', splitTestId)
        .order('created_at', { ascending: false });

      if (verdictsError) throw verdictsError;

      setSplitTest({
        ...(splitTestData as any),
        verdicts: verdicts || []
      });
    } catch (err: any) {
      console.error('Error fetching split test:', err);
      setError(err.message || 'Failed to load split test');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your split test...</p>
        </div>
      </div>
    );
  }

  if (error || !splitTest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Split Test Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This split test does not exist or you don\'t have access to it.'}</p>
          <Link href="/">
            <TouchButton>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back Home
            </TouchButton>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = splitTest.status === 'closed';
  const winner = splitTest.winning_photo;
  
  // Calculate stats
  const photoAVotes = splitTest.verdicts.filter(v => v.chosen_photo === 'A').length;
  const photoBVotes = splitTest.verdicts.filter(v => v.chosen_photo === 'B').length;
  const totalVotes = splitTest.verdicts.length;

  const averageRatings = {
    photoA: totalVotes > 0 ? splitTest.verdicts.reduce((sum, v) => sum + v.photo_a_rating, 0) / totalVotes : 0,
    photoB: totalVotes > 0 ? splitTest.verdicts.reduce((sum, v) => sum + v.photo_b_rating, 0) / totalVotes : 0
  };

  const getWinnerBadge = () => {
    if (!winner) return null;

    if (winner === 'tie') {
      return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Trophy className="w-4 h-4" />
          It's a Tie!
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
        winner === 'A'
          ? 'bg-green-100 text-green-800'
          : 'bg-blue-100 text-blue-800'
      }`}>
        <Trophy className="w-4 h-4" />
        Winner: Photo {winner}
      </div>
    );
  };

  const getProgressColor = (photo: 'A' | 'B') => {
    if (!isCompleted) return 'bg-gray-300';
    if (winner === 'tie') return 'bg-yellow-400';
    return winner === photo ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/my-requests">
                <TouchButton variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </TouchButton>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-orange-600" />
                  Photo Split Test
                </h1>
                <p className="text-gray-600 mt-1">{splitTest.context}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {isCompleted ? 'Completed' : 'In Progress'}
              </Badge>
              {getWinnerBadge()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Comparison */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Verdict Progress</h3>
                <span className="text-sm text-gray-600">
                  {splitTest.received_verdict_count} of {splitTest.target_verdict_count} verdicts
                </span>
              </div>
              
              <div className="space-y-3">
                {/* Overall Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(splitTest.received_verdict_count / splitTest.target_verdict_count) * 100}%` }}
                  />
                </div>
                
                {/* Vote Distribution */}
                {isCompleted && totalVotes > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{photoAVotes}</div>
                      <div className="text-sm text-gray-600">Photo A</div>
                      <div className="text-xs text-gray-500">Avg: {averageRatings.photoA.toFixed(1)}/10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{photoBVotes}</div>
                      <div className="text-sm text-gray-600">Photo B</div>
                      <div className="text-xs text-gray-500">Avg: {averageRatings.photoB.toFixed(1)}/10</div>
                    </div>
                  </div>
                )}

                {/* Consensus Strength */}
                {isCompleted && splitTest.consensus_strength && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <div className="text-lg font-semibold text-gray-900">Consensus Strength</div>
                    <div className="text-2xl font-bold text-orange-600">{Math.round(splitTest.consensus_strength * 100)}%</div>
                    <div className="text-sm text-gray-500">How much judges agreed</div>
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Photo A */}
              <div className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                winner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    A
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Photo A</h3>
                  {winner === 'A' && <Trophy className="w-5 h-5 text-green-600" />}
                </div>
                
                <div className="mb-4">
                  <Image
                    src={splitTest.photo_a_url}
                    alt="Photo A"
                    width={300}
                    height={400}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                {isCompleted && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Votes received:</span>
                      <span className="font-semibold text-green-600">{photoAVotes} votes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average rating:</span>
                      <span className="font-semibold text-green-600">{averageRatings.photoA.toFixed(1)}/10</span>
                    </div>
                    <div className={`h-2 rounded-full ${getProgressColor('A')}`} 
                         style={{ width: `${totalVotes > 0 ? (photoAVotes / totalVotes) * 100 : 0}%` }} />
                  </div>
                )}
              </div>

              {/* Photo B */}
              <div className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                winner === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    B
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Photo B</h3>
                  {winner === 'B' && <Trophy className="w-5 h-5 text-blue-600" />}
                </div>
                
                <div className="mb-4">
                  <Image
                    src={splitTest.photo_b_url}
                    alt="Photo B"
                    width={300}
                    height={400}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                {isCompleted && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Votes received:</span>
                      <span className="font-semibold text-blue-600">{photoBVotes} votes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average rating:</span>
                      <span className="font-semibold text-blue-600">{averageRatings.photoB.toFixed(1)}/10</span>
                    </div>
                    <div className={`h-2 rounded-full ${getProgressColor('B')}`} 
                         style={{ width: `${totalVotes > 0 ? (photoBVotes / totalVotes) * 100 : 0}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Waiting for Verdicts State */}
            {splitTest.verdicts.length === 0 && splitTest.status !== 'completed' && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting for Judge Verdicts</h3>
                  <p className="text-gray-600 mb-4">
                    Your split test is being evaluated. You'll receive {splitTest.target_verdict_count} verdicts.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2">Usually within 2 hours</span>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Verdicts */}
            {splitTest.verdicts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Judge Feedback ({splitTest.verdicts.length})
                </h3>
                
                <div className="space-y-6">
                  {splitTest.verdicts.map((verdict, index) => (
                    <div key={verdict.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Judge {index + 1}
                            {verdict.judge_expertise.length > 0 && (
                              <span className="text-gray-600 ml-1">
                                ({verdict.judge_expertise.join(', ')})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={verdict.chosen_photo === 'A' ? 'default' : 'secondary'}>
                            Chose Photo {verdict.chosen_photo}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{verdict.confidence_score}/10</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{verdict.reasoning}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <h5 className="font-medium text-green-900 mb-1">
                            Photo A ({verdict.photo_a_rating}/10)
                          </h5>
                          <p className="text-sm text-green-800 mb-2">{verdict.photo_a_feedback}</p>
                          {verdict.photo_a_strengths.length > 0 && (
                            <div className="mb-2">
                              <div className="text-xs font-medium text-green-900">Strengths:</div>
                              <ul className="text-xs text-green-800 list-disc list-inside">
                                {verdict.photo_a_strengths.map((strength, i) => (
                                  <li key={i}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {verdict.photo_a_improvements.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-green-900">Improvements:</div>
                              <ul className="text-xs text-green-800 list-disc list-inside">
                                {verdict.photo_a_improvements.map((improvement, i) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-medium text-blue-900 mb-1">
                            Photo B ({verdict.photo_b_rating}/10)
                          </h5>
                          <p className="text-sm text-blue-800 mb-2">{verdict.photo_b_feedback}</p>
                          {verdict.photo_b_strengths.length > 0 && (
                            <div className="mb-2">
                              <div className="text-xs font-medium text-blue-900">Strengths:</div>
                              <ul className="text-xs text-blue-800 list-disc list-inside">
                                {verdict.photo_b_strengths.map((strength, i) => (
                                  <li key={i}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {verdict.photo_b_improvements.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-blue-900">Improvements:</div>
                              <ul className="text-xs text-blue-800 list-disc list-inside">
                                {verdict.photo_b_improvements.map((improvement, i) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Context */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Test Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Question</h4>
                  <p className="text-gray-600">{splitTest.context}</p>
                </div>
              </div>
            </div>

            {/* Analytics Summary */}
            {isCompleted && totalVotes > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Summary
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Votes:</span>
                    <span className="text-gray-900 font-semibold">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winner Margin:</span>
                    <span className="text-gray-900 font-semibold">
                      {Math.abs(photoAVotes - photoBVotes)} votes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consensus:</span>
                    <span className="text-gray-900 font-semibold">
                      {splitTest.consensus_strength ? `${Math.round(splitTest.consensus_strength * 100)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Time per Judge:</span>
                    <span className="text-gray-900 font-semibold">
                      {Math.round(splitTest.verdicts.reduce((sum, v) => sum + v.time_spent_seconds, 0) / totalVotes)}s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Request Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">Split Test</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">
                    {new Date(splitTest.created_at).toLocaleDateString()}
                  </span>
                </div>
                {splitTest.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="text-gray-900">
                      {new Date(splitTest.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}