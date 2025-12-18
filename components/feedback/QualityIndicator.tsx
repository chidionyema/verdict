'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Star, TrendingUp, Clock, User, Award, Shield } from 'lucide-react';

interface FeedbackQuality {
  score: number; // 0-100
  factors: {
    specificity: number; // How specific is the feedback
    actionability: number; // How actionable are the suggestions
    expertise: number; // Judge's expertise level
    consistency: number; // How consistent with other feedback
  };
  badges: string[];
  estimatedValue: number; // £ value
}

interface QualityIndicatorProps {
  feedback: {
    id: string;
    rating: number;
    text: string;
    judge_id: string;
    created_at: string;
  };
  className?: string;
  detailed?: boolean;
}

export function QualityIndicator({ feedback, className = '', detailed = false }: QualityIndicatorProps) {
  const [quality, setQuality] = useState<FeedbackQuality | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate quality score based on feedback content and judge stats
  const calculateQuality = async () => {
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate quality assessment
      
      const textLength = feedback.text.length;
      const hasSpecifics = /\b(because|specifically|suggest|recommend|try|instead)\b/i.test(feedback.text);
      const hasNumbers = /\d/.test(feedback.text);
      const hasQuestions = /\?/.test(feedback.text);
      
      // Simulate judge expertise level (would come from database)
      const judgeExpertise = Math.floor(Math.random() * 30) + 70; // 70-100
      
      const factors = {
        specificity: Math.min(100, (textLength / 200) * 100 + (hasSpecifics ? 30 : 0) + (hasNumbers ? 20 : 0)),
        actionability: hasSpecifics ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 40,
        expertise: judgeExpertise,
        consistency: Math.floor(Math.random() * 20) + 80, // Would be calculated against other feedback
      };
      
      const score = Math.round(
        (factors.specificity * 0.3 + 
         factors.actionability * 0.3 + 
         factors.expertise * 0.2 + 
         factors.consistency * 0.2)
      );
      
      const badges = [];
      if (factors.specificity > 80) badges.push('Detailed');
      if (factors.actionability > 80) badges.push('Actionable');
      if (factors.expertise > 85) badges.push('Expert');
      if (textLength > 150) badges.push('Comprehensive');
      if (hasQuestions) badges.push('Thoughtful');
      
      setQuality({
        score,
        factors,
        badges,
        estimatedValue: Math.max(0.5, (score / 100) * 3) // £0.50 to £3.00 value
      });
      
    } catch (error) {
      console.error('Failed to calculate quality:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateQuality();
  }, [feedback]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!quality) return null;

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 85) return <Award className="h-4 w-4" />;
    if (score >= 70) return <CheckCircle className="h-4 w-4" />;
    if (score >= 50) return <Star className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getQualityLabel = (score: number) => {
    if (score >= 85) return 'Premium';
    if (score >= 70) return 'High Quality';
    if (score >= 50) return 'Good';
    return 'Basic';
  };

  if (!detailed) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getQualityColor(quality.score)} ${className}`}>
        {getQualityIcon(quality.score)}
        <span>{getQualityLabel(quality.score)}</span>
        <span className="text-gray-500">·</span>
        <span>£{quality.estimatedValue.toFixed(2)} value</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${getQualityColor(quality.score)}`}>
            {getQualityIcon(quality.score)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Feedback Quality</h3>
            <p className="text-sm text-gray-600">{quality.score}/100 · {getQualityLabel(quality.score)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">£{quality.estimatedValue.toFixed(2)}</div>
          <div className="text-xs text-gray-500">estimated value</div>
        </div>
      </div>

      {/* Quality Factors */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Specificity</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${quality.factors.specificity}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{quality.factors.specificity}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Actionability</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${quality.factors.actionability}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{quality.factors.actionability}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Judge Expertise</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${quality.factors.expertise}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{quality.factors.expertise}%</span>
          </div>
        </div>
      </div>

      {/* Quality Badges */}
      {quality.badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quality.badges.map((badge, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
            >
              {badge === 'Expert' && <User className="h-3 w-3" />}
              {badge === 'Detailed' && <TrendingUp className="h-3 w-3" />}
              {badge === 'Actionable' && <CheckCircle className="h-3 w-3" />}
              {badge === 'Comprehensive' && <Clock className="h-3 w-3" />}
              {badge === 'Thoughtful' && <Star className="h-3 w-3" />}
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for showing aggregate quality across all feedback
export function AggregateQualityScore({ 
  feedbacks, 
  className = '' 
}: { 
  feedbacks: Array<{ rating: number; text: string; judge_id: string; created_at: string; }>;
  className?: string;
}) {
  const [aggregateScore, setAggregateScore] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    // Calculate aggregate quality and total value
    let totalScore = 0;
    let value = 0;
    
    feedbacks.forEach(feedback => {
      const textLength = feedback.text.length;
      const hasSpecifics = /\b(because|specifically|suggest|recommend|try|instead)\b/i.test(feedback.text);
      const score = Math.min(100, (textLength / 150) * 50 + (hasSpecifics ? 40 : 20));
      totalScore += score;
      value += Math.max(0.5, (score / 100) * 3);
    });

    setAggregateScore(feedbacks.length > 0 ? Math.round(totalScore / feedbacks.length) : 0);
    setTotalValue(value);
  }, [feedbacks]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Quality Score</h3>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className={`text-2xl font-bold ${getScoreColor(aggregateScore)}`}>
              {aggregateScore}/100
            </div>
            <div className="text-sm text-gray-600">
              {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-600">£{totalValue.toFixed(2)}</div>
          <div className="text-xs text-gray-500">total value received</div>
        </div>
      </div>
    </div>
  );
}