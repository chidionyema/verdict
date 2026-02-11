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
} from 'lucide-react';
import type { QueueRequest } from '../types';
import { getJudgeEarningForTier } from '../constants';

interface RequestCardProps {
  request: QueueRequest;
}

const CATEGORY_CONFIGS = {
  appearance: { icon: Eye, color: 'from-pink-500 to-rose-500' },
  profile: { icon: Heart, color: 'from-red-500 to-pink-500' },
  writing: { icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
  decision: { icon: Target, color: 'from-green-500 to-emerald-500' },
} as const;

export function RequestCard({ request }: RequestCardProps) {
  const router = useRouter();

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
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryConfig.color} rounded-full mix-blend-multiply filter blur-3xl opacity-5 group-hover:opacity-10 transition-opacity`}
      />

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center shadow-lg`}
          >
            {categoryConfig.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
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
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                {request.media_type}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {request.received_verdict_count}/{request.target_verdict_count}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(request.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-3 mb-4">{request.context}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-lg font-bold text-green-700">
              ${getJudgeEarningForTier(request.request_tier)}
            </span>
            <span className="text-xs text-gray-500">~3-5 min</span>
          </div>

          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group/btn"
          >
            {request.request_type === 'comparison' ? 'Compare Options' : 'Start Verdict'}
            <ArrowRight className="h-4 w-4 inline ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryIcon({ category }: { category: keyof typeof CATEGORY_CONFIGS }) {
  const Icon = CATEGORY_CONFIGS[category].icon;
  return <Icon className="h-5 w-5" />;
}
