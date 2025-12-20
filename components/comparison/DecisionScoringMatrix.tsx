'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Star, 
  BarChart3, 
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import type { ComparisonVerdict } from '@/lib/database.types';

interface DecisionCriterion {
  name: string;
  description: string;
  optionAScore: number;
  optionBScore: number;
  weight: number;
  expertConsensus: 'strong' | 'moderate' | 'weak';
}

interface DecisionScoringMatrixProps {
  verdicts: ComparisonVerdict[];
  category: string;
  isProTier?: boolean;
}

// Define scoring criteria by category
const getCriteriaByCategory = (category: string): Partial<DecisionCriterion>[] => {
  const criteriaMap: Record<string, Partial<DecisionCriterion>[]> = {
    career: [
      { name: 'Growth Potential', description: 'Long-term career advancement opportunities', weight: 0.25 },
      { name: 'Financial Benefits', description: 'Salary, benefits, and compensation package', weight: 0.20 },
      { name: 'Work-Life Balance', description: 'Schedule flexibility and personal time', weight: 0.20 },
      { name: 'Learning Opportunities', description: 'Skill development and new experiences', weight: 0.15 },
      { name: 'Company Culture', description: 'Work environment and team dynamics', weight: 0.10 },
      { name: 'Job Security', description: 'Stability and future prospects', weight: 0.10 }
    ],
    lifestyle: [
      { name: 'Quality of Life', description: 'Overall happiness and satisfaction', weight: 0.25 },
      { name: 'Cost of Living', description: 'Affordability and financial impact', weight: 0.20 },
      { name: 'Social Connections', description: 'Relationships and community', weight: 0.20 },
      { name: 'Convenience', description: 'Ease of daily life and accessibility', weight: 0.15 },
      { name: 'Future Potential', description: 'Long-term benefits and opportunities', weight: 0.10 },
      { name: 'Personal Values', description: 'Alignment with your principles', weight: 0.10 }
    ],
    business: [
      { name: 'ROI Potential', description: 'Expected return on investment', weight: 0.25 },
      { name: 'Market Opportunity', description: 'Size and timing of market', weight: 0.20 },
      { name: 'Risk Level', description: 'Likelihood of success vs failure', weight: 0.20 },
      { name: 'Resource Requirements', description: 'Time, money, and effort needed', weight: 0.15 },
      { name: 'Competitive Advantage', description: 'Unique positioning in market', weight: 0.10 },
      { name: 'Scalability', description: 'Ability to grow and expand', weight: 0.10 }
    ],
    appearance: [
      { name: 'Overall Appeal', description: 'General attractiveness and impression', weight: 0.30 },
      { name: 'Appropriateness', description: 'Suitability for the context/occasion', weight: 0.25 },
      { name: 'Personal Style', description: 'Expression of personality and taste', weight: 0.20 },
      { name: 'Comfort & Confidence', description: 'How comfortable and confident you look', weight: 0.15 },
      { name: 'Trendy vs Timeless', description: 'Fashion-forward vs classic appeal', weight: 0.10 }
    ]
  };

  return criteriaMap[category] || criteriaMap.career;
};

export function DecisionScoringMatrix({ verdicts, category, isProTier = false }: DecisionScoringMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isProTier) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="text-center">
          <Crown className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Decision Scoring Matrix</h3>
          <p className="text-purple-700 mb-4">
            Get detailed scoring breakdowns across multiple criteria with Pro tier
          </p>
          <TouchButton className="bg-purple-600 hover:bg-purple-700 text-white">
            Upgrade to Pro
          </TouchButton>
        </div>
      </div>
    );
  }

  // Process verdicts to extract scoring data
  const criteria = getCriteriaByCategory(category);
  const processedCriteria: DecisionCriterion[] = criteria.map(criterion => {
    // Extract real decision scores from verdicts
    const scores = verdicts.map(v => {
      const decisionScores = v.decision_scores as any;
      if (decisionScores && decisionScores[criterion.name as keyof typeof decisionScores]) {
        return decisionScores[criterion.name as keyof typeof decisionScores];
      }
      // Fallback to overall ratings if no specific decision scores
      return {
        option_a: (v as any).option_a_rating || 5,
        option_b: (v as any).option_b_rating || 5
      };
    }).filter(Boolean); // Remove any null/undefined scores

    const avgOptionA = scores.length > 0 
      ? scores.reduce((sum, s) => sum + (s.option_a || 0), 0) / scores.length
      : 5;
    const avgOptionB = scores.length > 0 
      ? scores.reduce((sum, s) => sum + (s.option_b || 0), 0) / scores.length
      : 5;
    
    // Determine consensus strength based on score variance
    const variance = scores.reduce((sum, s) => 
      sum + Math.abs((s.option_a - s.option_b) - (avgOptionA - avgOptionB)), 0
    ) / Math.max(scores.length, 1);
    
    const expertConsensus: 'strong' | 'moderate' | 'weak' = 
      variance < 1 ? 'strong' : variance < 2.5 ? 'moderate' : 'weak';

    return {
      name: criterion.name!,
      description: criterion.description!,
      optionAScore: Number(avgOptionA.toFixed(1)),
      optionBScore: Number(avgOptionB.toFixed(1)),
      weight: criterion.weight!,
      expertConsensus
    };
  });

  // Calculate weighted totals
  const totalWeightedA = processedCriteria.reduce((sum, c) => sum + (c.optionAScore * c.weight), 0);
  const totalWeightedB = processedCriteria.reduce((sum, c) => sum + (c.optionBScore * c.weight), 0);

  const getScoreColor = (score: number, maxScore: number = 10) => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return 'text-green-600 bg-green-100';
    if (percentage >= 0.6) return 'text-blue-600 bg-blue-100';
    if (percentage >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case 'strong': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Decision Scoring Matrix
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

      {/* Summary Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h4 className="font-semibold text-green-900 mb-1">Option A Total</h4>
          <div className="text-2xl font-bold text-green-600">{totalWeightedA.toFixed(1)}</div>
          <div className="text-sm text-green-700">Weighted Average</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <h4 className="font-semibold text-blue-900 mb-1">Option B Total</h4>
          <div className="text-2xl font-bold text-blue-600">{totalWeightedB.toFixed(1)}</div>
          <div className="text-sm text-blue-700">Weighted Average</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Criteria Breakdown
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Criteria</th>
                  <th className="text-center py-2 font-medium text-gray-700">Weight</th>
                  <th className="text-center py-2 font-medium text-gray-700">Option A</th>
                  <th className="text-center py-2 font-medium text-gray-700">Option B</th>
                  <th className="text-center py-2 font-medium text-gray-700">Consensus</th>
                </tr>
              </thead>
              <tbody>
                {processedCriteria.map((criterion, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">{criterion.name}</div>
                        <div className="text-xs text-gray-600">{criterion.description}</div>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <Badge variant="outline">{Math.round(criterion.weight * 100)}%</Badge>
                    </td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(criterion.optionAScore)}`}>
                        {criterion.optionAScore}/10
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(criterion.optionBScore)}`}>
                        {criterion.optionBScore}/10
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConsensusColor(criterion.expertConsensus)}`}>
                        {criterion.expertConsensus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expert Insights */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
            <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Expert Insights
            </h5>
            <div className="text-sm text-purple-800 space-y-2">
              <p>
                • <strong>Strongest advantage:</strong> Option {totalWeightedA > totalWeightedB ? 'A' : 'B'} leads in{' '}
                {processedCriteria
                  .sort((a, b) => Math.abs(b.optionAScore - b.optionBScore) - Math.abs(a.optionAScore - a.optionBScore))
                  .slice(0, 2)
                  .map(c => c.name.toLowerCase())
                  .join(' and ')}
              </p>
              <p>
                • <strong>Most consensus:</strong> Experts strongly agreed on{' '}
                {processedCriteria.filter(c => c.expertConsensus === 'strong').length > 0
                  ? processedCriteria.filter(c => c.expertConsensus === 'strong')[0].name.toLowerCase()
                  : 'overall assessment'}
              </p>
              <p>
                • <strong>Key consideration:</strong> The highest-weighted factor ({processedCriteria[0].name.toLowerCase()}) shows{' '}
                {Math.abs(processedCriteria[0].optionAScore - processedCriteria[0].optionBScore) < 1 
                  ? 'a close tie between options'
                  : `a clear advantage for Option ${processedCriteria[0].optionAScore > processedCriteria[0].optionBScore ? 'A' : 'B'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="text-center">
          <TouchButton 
            variant="outline" 
            onClick={() => setIsExpanded(true)}
            className="text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            View Detailed Breakdown
          </TouchButton>
        </div>
      )}
    </div>
  );
}