'use client';

import { 
  Shield, 
  Star, 
  Briefcase, 
  GraduationCap, 
  Award, 
  TrendingUp,
  Heart,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';

export interface JudgeCredentials {
  id: string;
  expertise: string[];
  rating: number;
  totalReviews: number;
  responseTime: number; // in minutes
  verifiedProfessional?: boolean;
  specialization?: string;
  yearsExperience?: number;
  badges: JudgeBadge[];
}

export interface JudgeBadge {
  type: 'top-rated' | 'fast-responder' | 'subject-expert' | 'empathy-champion' | 'detailed-feedback';
  label: string;
  icon: React.ReactNode;
  color: string;
}

const BADGE_CONFIG = {
  'top-rated': {
    label: 'Top Rated',
    icon: <Star className="h-3 w-3" />,
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-200'
  },
  'fast-responder': {
    label: 'Quick Response',
    icon: <Clock className="h-3 w-3" />,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200'
  },
  'subject-expert': {
    label: 'Subject Expert',
    icon: <GraduationCap className="h-3 w-3" />,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200'
  },
  'empathy-champion': {
    label: 'Empathy Champion',
    icon: <Heart className="h-3 w-3" />,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-200'
  },
  'detailed-feedback': {
    label: 'Detailed Reviews',
    icon: <MessageSquare className="h-3 w-3" />,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200'
  }
};

export function JudgeBadgeDisplay({ badge }: { badge: JudgeBadge }) {
  const config = BADGE_CONFIG[badge.type];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${config.bgColor} border ${config.borderColor}`}>
      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center text-white`}>
        {config.icon}
      </div>
      <span className="text-gray-700">{badge.label}</span>
    </div>
  );
}

export function JudgeQualityCard({ judge }: { judge: JudgeCredentials }) {
  const getExpertiseIcon = (expertise: string) => {
    switch (expertise.toLowerCase()) {
      case 'career': return <Briefcase className="h-4 w-4" />;
      case 'style': return <Heart className="h-4 w-4" />;
      case 'dating': return <Heart className="h-4 w-4" />;
      case 'writing': return <MessageSquare className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header with verification */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {judge.verifiedProfessional && (
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Judge #{judge.id.slice(-4)}
              {judge.verifiedProfessional && (
                <Shield className="h-4 w-4 text-green-600" />
              )}
            </h3>
            {judge.specialization && (
              <p className="text-sm text-gray-600">{judge.specialization}</p>
            )}
          </div>
        </div>
        
        {/* Rating */}
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-lg">{judge.rating.toFixed(1)}</span>
          </div>
          <p className="text-xs text-gray-500">{judge.totalReviews} reviews</p>
        </div>
      </div>

      {/* Expertise Areas */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Areas of Expertise:</p>
        <div className="flex flex-wrap gap-2">
          {judge.expertise.map((area, index) => (
            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
              {getExpertiseIcon(area)}
              <span className="text-sm font-medium text-gray-700">{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3">
          <p className="text-xs text-gray-600">Avg Response Time</p>
          <p className="text-lg font-bold text-gray-900">{judge.responseTime}min</p>
        </div>
        {judge.yearsExperience && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3">
            <p className="text-xs text-gray-600">Experience</p>
            <p className="text-lg font-bold text-gray-900">{judge.yearsExperience}+ years</p>
          </div>
        )}
      </div>

      {/* Badges */}
      {judge.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {judge.badges.map((badge, index) => (
            <JudgeBadgeDisplay key={index} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}

// Mini badge for inline display
export function JudgeMiniProfile({ rating, totalReviews, isVerified }: { rating: number; totalReviews: number; isVerified?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      {isVerified && (
        <Shield className="h-4 w-4 text-green-600" />
      )}
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold">{rating.toFixed(1)}</span>
      </div>
      <span className="text-gray-500">({totalReviews} reviews)</span>
    </div>
  );
}