'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Star,
  Crown,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import type { ComparisonVerdict } from '@/lib/database.types';

interface AIInsight {
  type: 'strength' | 'concern' | 'consensus' | 'recommendation';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  optionFocus?: 'A' | 'B' | 'both';
}

interface AIConsensusAnalysisProps {
  verdicts: ComparisonVerdict[];
  category: string;
  isProTier?: boolean;
  optionATitle: string;
  optionBTitle: string;
}

export function AIConsensusAnalysis({ 
  verdicts, 
  category, 
  isProTier = false,
  optionATitle,
  optionBTitle
}: AIConsensusAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (!isProTier) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="text-center">
          <Brain className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Consensus Analysis</h3>
          <p className="text-blue-700 mb-4">
            Get AI-powered insights and consensus analysis from all expert feedback
          </p>
          <TouchButton className="bg-blue-600 hover:bg-blue-700 text-white">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </TouchButton>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (verdicts.length > 0) {
      generateAIInsights();
    }
  }, [verdicts]);

  const generateAIInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis based on verdict patterns
    const generatedInsights: AIInsight[] = [];
    
    // Analyze verdict consensus
    const optionAVotes = verdicts.filter(v => v.preferred_option === 'A').length;
    const optionBVotes = verdicts.filter(v => v.preferred_option === 'B').length;
    const tieVotes = verdicts.filter(v => v.preferred_option === 'tie').length;
    const totalVotes = verdicts.length;
    
    const consensusStrength = Math.max(optionAVotes, optionBVotes, tieVotes) / totalVotes;
    
    if (consensusStrength >= 0.8) {
      generatedInsights.push({
        type: 'consensus',
        title: 'Strong Expert Consensus',
        description: `${Math.round(consensusStrength * 100)}% of experts agree on the winning option, indicating a clear and confident recommendation.`,
        confidence: 'high',
        optionFocus: optionAVotes > optionBVotes ? 'A' : (optionBVotes > optionAVotes ? 'B' : 'both')
      });
    } else if (consensusStrength < 0.6) {
      generatedInsights.push({
        type: 'concern',
        title: 'Mixed Expert Opinions',
        description: `Experts are divided on this decision (${Math.round(consensusStrength * 100)}% consensus). Consider additional factors or seek more specialized expertise.`,
        confidence: 'medium',
        optionFocus: 'both'
      });
    }

    // Analyze confidence scores
    const avgConfidence = verdicts.reduce((sum, v) => sum + (v.confidence_score || 5), 0) / totalVotes;
    
    if (avgConfidence >= 4) {
      generatedInsights.push({
        type: 'strength',
        title: 'High Expert Confidence',
        description: `Experts are highly confident in their assessments (avg ${avgConfidence.toFixed(1)}/5), indicating reliable recommendations.`,
        confidence: 'high'
      });
    } else if (avgConfidence < 3) {
      generatedInsights.push({
        type: 'concern',
        title: 'Lower Expert Confidence',
        description: `Expert confidence is moderate (avg ${avgConfidence.toFixed(1)}/5). The decision may benefit from additional context or expertise.`,
        confidence: 'medium'
      });
    }

    // Category-specific insights
    if (category === 'career') {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Career Decision Framework',
        description: 'Consider long-term growth potential, work-life balance, and alignment with your 5-year goals when weighing expert feedback.',
        confidence: 'high'
      });
    } else if (category === 'business') {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Business Risk Assessment',
        description: 'Evaluate market timing, resource requirements, and competitive landscape alongside expert recommendations for optimal decision-making.',
        confidence: 'high'
      });
    } else if (category === 'lifestyle') {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Quality of Life Impact',
        description: 'Consider personal values, social connections, and long-term happiness when interpreting expert guidance.',
        confidence: 'high'
      });
    }

    // Analyze reasoning patterns
    const commonThemes = extractCommonThemes(verdicts);
    if (commonThemes.length > 0) {
      generatedInsights.push({
        type: 'strength',
        title: 'Consistent Expert Themes',
        description: `Multiple experts emphasized: ${commonThemes.join(', ')}. These recurring themes suggest key decision factors.`,
        confidence: 'high'
      });
    }

    setInsights(generatedInsights);
    setIsAnalyzing(false);
  };

  const extractCommonThemes = (verdicts: ComparisonVerdict[]): string[] => {
    const themes: string[] = [];
    const allReasonings = verdicts.map(v => v.reasoning.toLowerCase()).join(' ');
    
    // Simple keyword analysis for common themes
    const keywords = {
      'growth': ['growth', 'development', 'advancement', 'opportunity'],
      'stability': ['stable', 'security', 'reliable', 'consistent'],
      'flexibility': ['flexible', 'freedom', 'balance', 'autonomy'],
      'financial': ['money', 'salary', 'financial', 'budget', 'cost'],
      'experience': ['experience', 'learning', 'skills', 'knowledge'],
      'risk': ['risk', 'uncertain', 'gamble', 'chance']
    };
    
    Object.entries(keywords).forEach(([theme, words]) => {
      const mentions = words.some(word => allReasonings.includes(word));
      if (mentions) themes.push(theme);
    });
    
    return themes.slice(0, 3); // Return top 3 themes
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'concern':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'consensus':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'recommendation':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return 'border-green-200 bg-green-50';
      case 'concern':
        return 'border-yellow-200 bg-yellow-50';
      case 'consensus':
        return 'border-blue-200 bg-blue-50';
      case 'recommendation':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Consensus Analysis
          <Badge variant="secondary" className="ml-2">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        </h3>
        <TouchButton 
          variant="ghost" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </TouchButton>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{insights.length}</div>
          <div className="text-sm text-blue-800">AI Insights</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {Math.round((verdicts.reduce((sum, v) => sum + (v.confidence_score || 5), 0) / verdicts.length) * 20)}%
          </div>
          <div className="text-sm text-green-800">Avg Confidence</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {Math.round(Math.max(
              verdicts.filter(v => v.preferred_option === 'A').length,
              verdicts.filter(v => v.preferred_option === 'B').length,
              verdicts.filter(v => v.preferred_option === 'tie').length
            ) / verdicts.length * 100)}%
          </div>
          <div className="text-sm text-purple-800">Consensus</div>
        </div>
      </div>

      {/* Detailed Insights */}
      {isExpanded && (
        <div className="space-y-4">
          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-gray-600">AI is analyzing expert feedback...</p>
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  </div>
                  <Badge variant="outline" className={getConfidenceColor(insight.confidence)}>
                    {insight.confidence} confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.description}</p>
                {insight.optionFocus && insight.optionFocus !== 'both' && (
                  <div className="mt-2">
                    <Badge variant="outline">
                      Focuses on Option {insight.optionFocus}: {insight.optionFocus === 'A' ? optionATitle : optionBTitle}
                    </Badge>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No expert feedback available for AI analysis yet.</p>
            </div>
          )}

          {!isAnalyzing && insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI-Powered Recommendation
              </h5>
              <p className="text-sm text-blue-800">
                Based on expert consensus and confidence patterns, this analysis provides data-driven insights to support your decision. 
                Consider these patterns alongside your personal priorities and context for the most informed choice.
              </p>
            </div>
          )}
        </div>
      )}

      {!isExpanded && insights.length > 0 && (
        <div className="text-center">
          <TouchButton 
            variant="outline" 
            onClick={() => setIsExpanded(true)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Brain className="w-4 h-4 mr-2" />
            View AI Insights ({insights.length})
          </TouchButton>
        </div>
      )}
    </div>
  );
}