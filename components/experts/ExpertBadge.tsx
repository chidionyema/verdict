'use client';

import { Shield, CheckCircle, Star, Briefcase } from 'lucide-react';

interface ExpertBadgeProps {
  isVerified: boolean;
  jobTitle?: string | null;
  company?: string | null;
  industry?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  anonymous?: boolean;
}

export function ExpertBadge({ 
  isVerified, 
  jobTitle, 
  company,
  industry,
  size = 'md',
  showDetails = true,
  anonymous = true
}: ExpertBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: {
      badge: 'text-xs px-2 py-1',
      icon: 'h-3 w-3',
      details: 'text-xs'
    },
    md: {
      badge: 'text-sm px-3 py-1.5',
      icon: 'h-4 w-4', 
      details: 'text-sm'
    },
    lg: {
      badge: 'text-base px-4 py-2',
      icon: 'h-5 w-5',
      details: 'text-base'
    }
  };

  const getAnonymousTitle = () => {
    if (!anonymous && company) {
      return `${jobTitle} at ${company}`;
    }
    
    // Anonymous display
    if (jobTitle && industry) {
      return `Verified ${jobTitle} at ${industry} Company`;
    } else if (jobTitle) {
      return `Verified ${jobTitle}`;
    } else {
      return 'Verified Professional';
    }
  };

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-medium ${sizeClasses[size].badge}`}>
        <Shield className={sizeClasses[size].icon} />
        <span>Verified Expert</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-medium ${sizeClasses[size].badge}`}>
        <Shield className={sizeClasses[size].icon} />
        <span>Verified Expert</span>
      </span>
      {(jobTitle || industry) && (
        <span className={`text-gray-600 ${sizeClasses[size].details}`}>
          {getAnonymousTitle()}
        </span>
      )}
    </div>
  );
}

interface ReviewerDisplayProps {
  reviewer: {
    user_id: string;
    is_expert: boolean;
    expert_title?: string;
    reputation_score: number;
  };
  showReputation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ReviewerDisplay({ 
  reviewer, 
  showReputation = true,
  size = 'md' 
}: ReviewerDisplayProps) {
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      icon: 'h-3 w-3',
      rating: 'text-xs'
    },
    md: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      rating: 'text-sm'
    },
    lg: {
      container: 'text-base',
      icon: 'h-5 w-5',
      rating: 'text-base'
    }
  };

  if (reviewer.is_expert) {
    return (
      <div className={`flex items-center gap-2 ${sizeClasses[size].container}`}>
        <div className="flex items-center gap-1">
          <Shield className={`text-purple-600 ${sizeClasses[size].icon}`} />
          <span className="font-medium text-gray-900">
            {reviewer.expert_title || 'Verified Expert'}
          </span>
        </div>
        {showReputation && (
          <div className="flex items-center gap-1 text-gray-500">
            <Star className={`fill-current ${sizeClasses[size].icon}`} />
            <span className={sizeClasses[size].rating}>
              {reviewer.reputation_score.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Regular reviewer
  const getReviewerTitle = () => {
    if (reviewer.reputation_score >= 4.5) return 'Top Reviewer';
    if (reviewer.reputation_score >= 4.0) return 'Trusted Reviewer';
    return 'Community Reviewer';
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size].container}`}>
      <span className="text-gray-700">{getReviewerTitle()}</span>
      {showReputation && (
        <div className="flex items-center gap-1 text-gray-500">
          <Star className={`fill-current ${sizeClasses[size].icon}`} />
          <span className={sizeClasses[size].rating}>
            {reviewer.reputation_score.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

// Component to show in judge feed when expert-only requests are available
export function ExpertOnlyIndicator({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}>
      <Shield className="h-4 w-4" />
      <span className="font-medium">Expert Review Only</span>
    </div>
  );
}