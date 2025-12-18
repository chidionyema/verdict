'use client';

import { useState, useEffect } from 'react';
import { Star, Shield, AlertTriangle, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { reputationManager, type ReviewerReputation } from '@/lib/reputation';

interface ReviewerReputationProps {
  userId: string;
  compact?: boolean;
  showFullStats?: boolean;
}

interface ReputationBadgeProps {
  reputation: ReviewerReputation;
  size?: 'sm' | 'md' | 'lg';
}

export function ReputationBadge({ reputation, size = 'md' }: ReputationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const getStatusColor = () => {
    if (reputation.is_expert) return 'bg-purple-100 text-purple-800 border-purple-200';
    
    switch (reputation.reviewer_status) {
      case 'active':
        if (reputation.reputation_score >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
        if (reputation.reputation_score >= 4.0) return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'probation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'calibration_required':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayText = () => {
    if (reputation.is_expert) {
      return (
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Verified Expert
        </span>
      );
    }

    if (reputation.reputation_score >= 4.5) {
      return (
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          Top Reviewer
        </span>
      );
    }

    if (reputation.reputation_score >= 4.0) {
      return (
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Trusted Reviewer
        </span>
      );
    }

    if (reputation.reviewer_status === 'probation') {
      return (
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          On Probation
        </span>
      );
    }

    return 'Reviewer';
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${getStatusColor()} ${sizeClasses[size]}`}>
      {getDisplayText()}
    </span>
  );
}

export function ReviewerReputationCard({ userId, compact = false, showFullStats = true }: ReviewerReputationProps) {
  const [reputation, setReputation] = useState<ReviewerReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReputation() {
      try {
        const rep = await reputationManager.getReviewerReputation(userId);
        setReputation(rep);
      } catch (error) {
        console.error('Error fetching reputation:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReputation();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
        {!compact && <div className="h-4 bg-gray-100 rounded w-32"></div>}
      </div>
    );
  }

  if (!reputation) return null;

  if (compact) {
    return <ReputationBadge reputation={reputation} size="sm" />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reviewer Reputation</h3>
          <p className="text-sm text-gray-600">
            {reputation.is_expert ? reputation.expert_title : 'Community Reviewer'}
          </p>
        </div>
        <ReputationBadge reputation={reputation} />
      </div>

      {/* Reputation Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Score</span>
          <span className="font-semibold">{reputation.reputation_score.toFixed(1)}/5.0</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              reputation.reputation_score >= 4.5 ? 'bg-green-500' :
              reputation.reputation_score >= 4.0 ? 'bg-blue-500' :
              reputation.reputation_score >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(reputation.reputation_score / 5) * 100}%` }}
          />
        </div>
      </div>

      {showFullStats && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium">{reputation.helpfulness_average.toFixed(1)}/5</div>
              <div className="text-gray-500 text-xs">Helpfulness</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">{(reputation.consensus_rate * 100).toFixed(0)}%</div>
              <div className="text-gray-500 text-xs">Consensus</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium">{reputation.quality_average.toFixed(1)}/5</div>
              <div className="text-gray-500 text-xs">Quality</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">{reputation.total_reviews}</div>
              <div className="text-gray-500 text-xs">Reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Warning */}
      {reputation.reviewer_status !== 'active' && (
        <div className={`mt-4 p-3 rounded-lg ${
          reputation.reviewer_status === 'probation' 
            ? 'bg-yellow-50 text-yellow-800'
            : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {reputation.reviewer_status === 'probation' 
                ? 'Limited credit earning due to low ratings'
                : 'Must complete calibration test to earn credits'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to easily get reputation data
export function useReviewerReputation(userId: string) {
  const [reputation, setReputation] = useState<ReviewerReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReputation() {
      try {
        const rep = await reputationManager.getReviewerReputation(userId);
        setReputation(rep);
      } catch (error) {
        console.error('Error fetching reputation:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchReputation();
    }
  }, [userId]);

  return { reputation, loading };
}