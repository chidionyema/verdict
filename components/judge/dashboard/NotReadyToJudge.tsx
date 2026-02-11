'use client';

import { Award, Coins, Clock, Star } from 'lucide-react';
import { getJudgeEarningForTier } from './constants';

export function NotReadyToJudge() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      <div className="relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Award className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Earning?</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Toggle "Available to Judge" above to start seeing requests and earning money. Join our
          community of thoughtful reviewers!
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-green-600" />
            <span>
              ~${getJudgeEarningForTier('community')}-${getJudgeEarningForTier('expert')} per verdict
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>3-5 minutes each</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            <span>Build your reputation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
