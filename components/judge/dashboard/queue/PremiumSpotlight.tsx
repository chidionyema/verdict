'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, Crown, Star, Coins, Medal, DollarSign, Clock, Users, ArrowRight } from 'lucide-react';
import type { QueueRequest } from '../types';
import { getJudgeEarningForTier } from '../constants';

interface PremiumSpotlightProps {
  request: QueueRequest;
}

export function PremiumSpotlight({ request }: PremiumSpotlightProps) {
  const router = useRouter();

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
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-xl">
      <div className="bg-white rounded-[14px] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="h-3.5 w-3.5" />
                BEST MATCH FOR YOU
              </span>
              {request.request_tier === 'pro' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                  <Crown className="h-3.5 w-3.5" />
                  PRO TIER
                </span>
              )}
              {request.request_tier === 'standard' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <Star className="h-3.5 w-3.5" />
                  STANDARD
                </span>
              )}
              {(request.request_tier === 'pro' || request.request_tier === 'standard') && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <Coins className="h-3.5 w-3.5" />
                  HIGH EARNING
                </span>
              )}
              {request.expert_only && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <Medal className="h-3.5 w-3.5" />
                  EXPERT ONLY
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 capitalize">{request.category} Request</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                {request.media_type}
              </span>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-2">{request.context}</p>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">
                  Earn ${getJudgeEarningForTier(request.request_tier)}
                  {request.request_tier === 'pro' && (
                    <span className="text-purple-600 ml-1">+bonus</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">~3-5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-gray-600">
                  {request.received_verdict_count}/{request.target_verdict_count} verdicts
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 min-w-[200px] group"
          >
            {request.request_type === 'comparison' ? 'Compare Options' : 'Start Now'}
            <ArrowRight className="h-5 w-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
