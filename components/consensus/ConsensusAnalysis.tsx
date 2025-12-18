'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Users,
  Lightbulb,
  ArrowRight,
  Loader2
} from 'lucide-react';
import type { ConsensusResult } from '@/lib/consensus';

interface ConsensusAnalysisProps {
  requestId: string;
  requestTier: string;
  onAnalysisComplete?: (consensus: ConsensusResult) => void;
}

interface ConsensusData {
  id: string;
  synthesis: string;
  confidence_score: number;
  agreement_level: 'high' | 'medium' | 'low';
  key_themes: string[];
  conflicts: Array<{
    topic: string;
    positions: string[];
    resolution: string;
  }>;
  recommendations: Array<{
    action: string;
    confidence: number;
    reasoning: string;
    expert_support: number;
  }>;
  expert_breakdown: Array<{
    expert_title: string;
    key_points: string[];
    stance: 'positive' | 'neutral' | 'negative';
    confidence: number;
  }>;
  status: string;
}

export default function ConsensusAnalysis({ 
  requestId, 
  requestTier, 
  onAnalysisComplete 
}: ConsensusAnalysisProps) {
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for Pro tier
  if (requestTier !== 'pro') {
    return null;
  }

  useEffect(() => {
    fetchConsensus();
  }, [requestId]);

  const fetchConsensus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/consensus/${requestId}`);
      
      if (response.status === 404) {
        // No consensus exists yet
        setConsensus(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch consensus');
      }
      
      const data = await response.json();
      setConsensus(data.consensus);
      
    } catch (err) {
      console.error('Failed to fetch consensus:', err);
      setError('Failed to load consensus analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateConsensus = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch(`/api/consensus/${requestId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh to get the completed analysis
        setTimeout(() => {
          fetchConsensus();
        }, 2000);
      } else {
        setError(data.error || 'Failed to generate consensus');
      }
      
    } catch (err) {
      console.error('Failed to generate consensus:', err);
      setError('Failed to generate consensus analysis');
    } finally {
      setGenerating(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAgreementIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'medium': return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'low': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'positive': return 'text-green-700 bg-green-50 border-green-200';
      case 'negative': return 'text-red-700 bg-red-50 border-red-200';
      case 'neutral': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Professional Consensus Analysis</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (!consensus) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Professional Consensus Analysis</h3>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
            Pro Feature
          </span>
        </div>
        
        <p className="text-gray-700 mb-6">
          Get AI-powered synthesis of all expert opinions with conflict resolution, 
          confidence scoring, and professional recommendations.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <button
          onClick={generateConsensus}
          disabled={generating}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Analysis...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Generate Consensus Analysis
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Professional Consensus Analysis</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getAgreementIcon(consensus.agreement_level)}
              <span className="text-sm font-medium text-gray-700 capitalize">
                {consensus.agreement_level} Agreement
              </span>
            </div>
            
            <div className={`px-3 py-1 rounded-lg border ${getConfidenceColor(consensus.confidence_score)}`}>
              <span className="text-sm font-semibold">
                {Math.round(consensus.confidence_score * 100)}% Confidence
              </span>
            </div>
          </div>
        </div>

        {/* Main synthesis */}
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {consensus.synthesis}
          </p>
        </div>
      </div>

      {/* Key themes */}
      {consensus.key_themes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Key Themes</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {consensus.key_themes.map((theme, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {consensus.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Recommendations</h4>
          </div>
          <div className="space-y-4">
            {consensus.recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{rec.action}</h5>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${getConfidenceColor(rec.confidence)}`}>
                      {Math.round(rec.confidence * 100)}% confident
                    </span>
                    <span className="text-gray-500">
                      {rec.expert_support}/{consensus.expert_breakdown.length} experts
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts (if any) */}
      {consensus.conflicts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold text-gray-900">Expert Disagreements</h4>
          </div>
          <div className="space-y-4">
            {consensus.conflicts.map((conflict, index) => (
              <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h5 className="font-medium text-gray-900 mb-2">{conflict.topic}</h5>
                <div className="space-y-2 mb-3">
                  {conflict.positions.map((position, posIndex) => (
                    <div key={posIndex} className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{position}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-orange-200 pt-2">
                  <p className="text-sm text-gray-700">
                    <strong>Resolution:</strong> {conflict.resolution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert breakdown */}
      {consensus.expert_breakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Expert Breakdown</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {consensus.expert_breakdown.map((expert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{expert.expert_title}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStanceColor(expert.stance)}`}>
                    {expert.stance}
                  </span>
                </div>
                <ul className="space-y-1">
                  {expert.key_points.map((point, pointIndex) => (
                    <li key={pointIndex} className="text-sm text-gray-600 flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}