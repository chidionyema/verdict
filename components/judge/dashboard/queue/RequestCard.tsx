'use client';

import { useRouter } from 'next/navigation';
import {
  Eye,
  Heart,
  MessageSquare,
  Target,
  Sparkles,
  Users,
  Clock,
  DollarSign,
  ArrowRight,
  Zap,
  Leaf,
  Flame,
  Star,
  Crown,
  Award,
  Timer,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { QueueRequest } from '../types';
import { getJudgeEarningForTier } from '../constants';

interface RequestCardProps {
  request: QueueRequest;
  isNewJudge?: boolean; // Show "good for beginners" badges
  userExpertise?: string[]; // User's expertise areas for matching
}

// Determine difficulty based on context length and type
function getDifficulty(request: QueueRequest): 'easy' | 'medium' | 'hard' {
  const contextLength = request.context?.length || 0;
  const isComparison = request.request_type === 'comparison';
  const isSplitTest = request.request_type === 'split_test';

  if (isSplitTest) return 'hard';
  if (isComparison) return 'medium';
  if (contextLength < 100) return 'easy';
  if (contextLength < 300) return 'medium';
  return 'hard';
}

// Determine urgency based on time posted
function getUrgency(createdAt: string): 'new' | 'recent' | 'waiting' {
  const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
  if (ageMinutes < 30) return 'new';
  if (ageMinutes < 120) return 'recent';
  return 'waiting';
}

// Check if good for beginners
function isBeginnerFriendly(request: QueueRequest): boolean {
  const difficulty = getDifficulty(request);
  const isStandard = !request.request_type || request.request_type === 'verdict';
  return difficulty === 'easy' && isStandard;
}

// Check if matches user expertise
function matchesExpertise(request: QueueRequest, userExpertise?: string[]): boolean {
  if (!userExpertise || userExpertise.length === 0) return false;
  return userExpertise.some(exp =>
    exp.toLowerCase() === request.category.toLowerCase() ||
    (request.subcategory && exp.toLowerCase() === request.subcategory.toLowerCase())
  );
}

// Get estimated completion time
function getEstimatedTime(request: QueueRequest): string {
  const difficulty = getDifficulty(request);
  if (request.request_type === 'split_test') return '5-8 min';
  if (request.request_type === 'comparison') return '4-6 min';
  if (difficulty === 'easy') return '2-3 min';
  if (difficulty === 'medium') return '3-5 min';
  return '5-7 min';
}

// Get tier badge info
function getTierInfo(tier?: string): { label: string; color: string; icon: typeof Crown } | null {
  if (!tier || tier === 'community') return null;
  if (tier === 'pro' || tier === 'expert') {
    return { label: 'Premium', color: 'purple', icon: Crown };
  }
  if (tier === 'standard') {
    return { label: 'Standard', color: 'blue', icon: Award };
  }
  return null;
}

const CATEGORY_CONFIGS = {
  appearance: { icon: Eye, color: 'from-pink-500 to-rose-500' },
  profile: { icon: Heart, color: 'from-red-500 to-pink-500' },
  writing: { icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
  decision: { icon: Target, color: 'from-green-500 to-emerald-500' },
} as const;

export function RequestCard({ request, isNewJudge = false, userExpertise }: RequestCardProps) {
  const router = useRouter();

  const difficulty = getDifficulty(request);
  const urgency = getUrgency(request.created_at);
  const beginnerFriendly = isBeginnerFriendly(request);
  const expertiseMatch = matchesExpertise(request, userExpertise);
  const estimatedTime = getEstimatedTime(request);
  const tierInfo = getTierInfo(request.request_tier);

  const difficultyConfig = {
    easy: { label: 'Quick', icon: Leaf, color: 'text-green-600 bg-green-50' },
    medium: { label: 'Standard', icon: Zap, color: 'text-blue-600 bg-blue-50' },
    hard: { label: 'Detailed', icon: Flame, color: 'text-orange-600 bg-orange-50' },
  };

  const urgencyConfig = {
    new: { label: 'Just posted', color: 'text-green-600' },
    recent: { label: 'Recent', color: 'text-blue-600' },
    waiting: { label: 'Needs help', color: 'text-amber-600' },
  };

  const getRequestTypeConfig = () => {
    if (request.request_type === 'comparison') {
      return { icon: <span>⚖️</span>, color: 'from-purple-500 to-indigo-500', type: 'Comparison' };
    }
    if (request.request_type === 'split_test') {
      return { icon: <span>🔄</span>, color: 'from-orange-500 to-amber-500', type: 'Split Test' };
    }
    return null;
  };

  const requestTypeConfig = getRequestTypeConfig();
  const categoryConfig =
    requestTypeConfig ||
    (request.category in CATEGORY_CONFIGS
      ? {
          icon: <CategoryIcon category={request.category as keyof typeof CATEGORY_CONFIGS} />,
          color: CATEGORY_CONFIGS[request.category as keyof typeof CATEGORY_CONFIGS].color,
          type: 'Standard',
        }
      : { icon: <Sparkles className="h-5 w-5" />, color: 'from-gray-500 to-slate-500', type: 'Standard' });

  const handleClick = () => {
    if (request.request_type === 'comparison') {
      router.push(`/judge/comparisons/${request.id}`);
    } else if (request.request_type === 'split_test') {
      router.push(`/judge/split-tests/${request.id}`);
    } else {
      router.push(`/judge/requests/${request.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden ${
        expertiseMatch ? 'ring-2 ring-indigo-200' : ''
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryConfig.color} rounded-full mix-blend-multiply filter blur-3xl opacity-5 group-hover:opacity-10 transition-opacity`}
      />

      {/* Top badges row */}
      <div className="absolute top-3 right-3 z-20 flex flex-wrap gap-1.5 justify-end max-w-[60%]">
        {/* Premium tier badge */}
        {tierInfo && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
            tierInfo.color === 'purple'
              ? 'bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}>
            <tierInfo.icon className="h-3 w-3" />
            {tierInfo.label}
          </span>
        )}

        {/* Expertise match badge */}
        {expertiseMatch && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
            <CheckCircle className="h-3 w-3" />
            Matches expertise
          </span>
        )}

        {/* Beginner-friendly badge */}
        {isNewJudge && beginnerFriendly && !expertiseMatch && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
            <Star className="h-3 w-3" />
            Great for starters
          </span>
        )}

        {/* Urgency indicator for waiting requests */}
        {urgency === 'waiting' && !tierInfo && !expertiseMatch && !beginnerFriendly && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200 animate-pulse">
            Needs help
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center shadow-lg`}
          >
            {categoryConfig.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-gray-900 capitalize">{request.category}</h4>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                  request.request_type === 'comparison'
                    ? 'bg-purple-100 text-purple-700'
                    : request.request_type === 'split_test'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {categoryConfig.type}
              </span>
              {/* Difficulty badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${difficultyConfig[difficulty].color}`}>
                {(() => {
                  const DiffIcon = difficultyConfig[difficulty].icon;
                  return <DiffIcon className="h-3 w-3" />;
                })()}
                {difficultyConfig[difficulty].label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {request.received_verdict_count}/{request.target_verdict_count}
              </span>
              <span className={`flex items-center gap-1 ${urgencyConfig[urgency].color}`}>
                <Clock className="h-3.5 w-3.5" />
                {urgency === 'new' ? 'Just now' : new Date(request.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-3 mb-4">{request.context}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Earnings - more prominent */}
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-green-700">
                {getJudgeEarningForTier(request.request_tier)}
              </span>
            </div>
            {/* Time estimate */}
            <div className="flex items-center gap-1 text-gray-500">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-medium">{estimatedTime}</span>
            </div>
          </div>

          <button
            onClick={handleClick}
            className={`px-5 py-2.5 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group/btn focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              tierInfo?.color === 'purple'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white focus-visible:ring-purple-500'
                : expertiseMatch
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white focus-visible:ring-indigo-500'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white focus-visible:ring-indigo-500'
            }`}
          >
            {request.request_type === 'comparison' ? 'Compare Options' :
             request.request_type === 'split_test' ? 'Evaluate Test' :
             'Start Verdict'}
            <ArrowRight className="h-4 w-4 inline ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryIcon({ category }: { category: keyof typeof CATEGORY_CONFIGS }) {
  const Icon = CATEGORY_CONFIGS[category].icon;
  return <Icon className="h-5 w-5" />;
}
