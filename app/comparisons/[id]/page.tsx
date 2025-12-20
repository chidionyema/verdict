'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Scale, 
  Trophy, 
  TrendingUp, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  ArrowLeft,
  Target,
  Brain,
  MessageSquare
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { DecisionScoringMatrix } from '@/components/comparison/DecisionScoringMatrix';
import { AIConsensusAnalysis } from '@/components/comparison/AIConsensusAnalysis';
import Image from 'next/image';
import Link from 'next/link';
import type { ComparisonRequest, ComparisonVerdict } from '@/lib/database.types';

interface ComparisonData extends ComparisonRequest {
  verdicts: ComparisonVerdict[];
}

interface DecisionContext {
  timeframe: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  budget?: string;
  goals: string[];
}

export default function ComparisonPage() {
  const params = useParams();
  const comparisonId = params.id as string;
  
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [comparisonId]);

  const fetchComparison = async () => {
    try {
      const supabase = createClient();
      
      // Fetch comparison request
      const { data: comparisonData, error: comparisonError } = await supabase
        .from('comparison_requests')
        .select('*')
        .eq('id', comparisonId)
        .single();

      if (comparisonError) throw comparisonError;

      // Fetch verdicts
      const { data: verdicts, error: verdictsError } = await supabase
        .from('comparison_verdicts')
        .select('*')
        .eq('comparison_id', comparisonId)
        .order('created_at', { ascending: false });

      if (verdictsError) throw verdictsError;

      setComparison({
        ...(comparisonData as any),
        verdicts: verdicts || []
      });
    } catch (err: any) {
      console.error('Error fetching comparison:', err);
      setError(err.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Comparison Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This comparison does not exist or you don\'t have access to it.'}</p>
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

  const context = comparison.decision_context as unknown as DecisionContext;
  const isCompleted = comparison.status === 'completed';
  const winner = comparison.winner_option;
  
  // Calculate stats
  const optionAVotes = comparison.verdicts.filter(v => v.preferred_option === 'A').length;
  const optionBVotes = comparison.verdicts.filter(v => v.preferred_option === 'B').length;
  const tieVotes = comparison.verdicts.filter(v => v.preferred_option === 'tie').length;
  const totalVotes = comparison.verdicts.length;

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
        Winner: Option {winner}
      </div>
    );
  };

  const getProgressColor = (option: 'A' | 'B') => {
    if (!isCompleted) return 'bg-gray-300';
    if (winner === 'tie') return 'bg-yellow-400';
    return winner === option ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Link href="/">
                <TouchButton variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </TouchButton>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <span className="hidden sm:inline">Decision Comparison</span>
                  <span className="sm:hidden">Comparison</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">{comparison.question}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
                  {comparison.received_verdict_count} of {comparison.target_verdict_count} verdicts
                </span>
              </div>
              
              <div className="space-y-3">
                {/* Overall Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(comparison.received_verdict_count / comparison.target_verdict_count) * 100}%` }}
                  />
                </div>
                
                {/* Vote Distribution */}
                {isCompleted && totalVotes > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{optionAVotes}</div>
                      <div className="text-sm text-gray-600">Option A</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{tieVotes}</div>
                      <div className="text-sm text-gray-600">Tie</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{optionBVotes}</div>
                      <div className="text-sm text-gray-600">Option B</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Option A */}
              <div className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 transition-all ${
                winner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    A
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{comparison.option_a_title}</h3>
                  {winner === 'A' && <Trophy className="w-5 h-5 text-green-600" />}
                </div>
                
                {comparison.option_a_image_url && (
                  <div className="mb-4">
                    <Image
                      src={comparison.option_a_image_url}
                      alt="Option A"
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <p className="text-gray-700 mb-4">{comparison.option_a_description}</p>
                
                {isCompleted && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Votes received:</span>
                      <span className="font-semibold text-green-600">{optionAVotes} votes</span>
                    </div>
                    <div className={`mt-2 h-2 rounded-full ${getProgressColor('A')}`} 
                         style={{ width: `${totalVotes > 0 ? (optionAVotes / totalVotes) * 100 : 0}%` }} />
                  </div>
                )}
              </div>

              {/* Option B */}
              <div className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 transition-all ${
                winner === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    B
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{comparison.option_b_title}</h3>
                  {winner === 'B' && <Trophy className="w-5 h-5 text-blue-600" />}
                </div>
                
                {comparison.option_b_image_url && (
                  <div className="mb-4">
                    <Image
                      src={comparison.option_b_image_url}
                      alt="Option B"
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <p className="text-gray-700 mb-4">{comparison.option_b_description}</p>
                
                {isCompleted && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Votes received:</span>
                      <span className="font-semibold text-blue-600">{optionBVotes} votes</span>
                    </div>
                    <div className={`mt-2 h-2 rounded-full ${getProgressColor('B')}`} 
                         style={{ width: `${totalVotes > 0 ? (optionBVotes / totalVotes) * 100 : 0}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Waiting for Verdicts State */}
            {comparison.verdicts.length === 0 && comparison.status !== 'completed' && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting for Expert Verdicts</h3>
                  <p className="text-gray-600 mb-4">
                    Your comparison is being reviewed by our experts. You'll receive {comparison.target_verdict_count} verdicts.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2">Usually within 2 hours</span>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Verdicts */}
            {comparison.verdicts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Expert Feedback ({comparison.verdicts.length})
                </h3>
                
                <div className="space-y-6">
                  {comparison.verdicts.map((verdict, index) => (
                    <div key={verdict.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {verdict.reviewer_expertise || 'Reviewer'}
                            {verdict.is_verified_expert && (
                              <Badge variant="secondary" className="ml-2">Verified Expert</Badge>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            verdict.preferred_option === 'A' ? 'default' :
                            verdict.preferred_option === 'B' ? 'secondary' : 'outline'
                          }>
                            Prefers Option {verdict.preferred_option === 'tie' ? 'Tie' : verdict.preferred_option}
                          </Badge>
                          {verdict.confidence_score && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">{verdict.confidence_score}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{verdict.reasoning}</p>
                      
                      {(verdict.option_a_feedback || verdict.option_b_feedback) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {verdict.option_a_feedback && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <h5 className="font-medium text-green-900 mb-1">Option A Feedback:</h5>
                              <p className="text-sm text-green-800">{verdict.option_a_feedback}</p>
                            </div>
                          )}
                          {verdict.option_b_feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h5 className="font-medium text-blue-900 mb-1">Option B Feedback:</h5>
                              <p className="text-sm text-blue-800">{verdict.option_b_feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Consensus Analysis */}
            {isCompleted && (
              <AIConsensusAnalysis
                verdicts={comparison.verdicts}
                category={comparison.category}
                isProTier={comparison.request_tier === 'pro'}
                optionATitle={comparison.option_a_title}
                optionBTitle={comparison.option_b_title}
              />
            )}

            {/* Decision Scoring Matrix */}
            {isCompleted && (
              <DecisionScoringMatrix 
                verdicts={comparison.verdicts}
                category={comparison.category}
                isProTier={comparison.request_tier === 'pro'}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Decision Context */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Decision Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
                  <p className="text-gray-600">{context.timeframe}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Importance</h4>
                  <Badge variant={
                    context.importance === 'critical' ? 'destructive' :
                    context.importance === 'high' ? 'default' :
                    context.importance === 'medium' ? 'secondary' : 'outline'
                  }>
                    {context.importance} impact
                  </Badge>
                </div>
                
                {context.budget && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Budget</h4>
                    <p className="text-gray-600">{context.budget}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Goals</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {context.goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tier:</span>
                  <Badge variant="outline">{comparison.request_tier}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900 capitalize">{comparison.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">
                    {new Date(comparison.created_at).toLocaleDateString()}
                  </span>
                </div>
                {comparison.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="text-gray-900">
                      {new Date(comparison.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pro Tier Features */}
            {comparison.request_tier === 'pro' && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Pro Analysis
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800">AI consensus analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800">Decision scoring matrix</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800">Verified expert reviewers</span>
                  </div>
                </div>
                
                {isCompleted && (
                  <TouchButton className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                    View AI Analysis
                  </TouchButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}