'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowRight } from 'lucide-react';
import type { JudgeStats } from './types';

interface VerdictHistoryCardProps {
  stats: JudgeStats;
}

export function VerdictHistoryCard({ stats }: VerdictHistoryCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {stats.verdicts_given > 0 ? 'Your Verdict History' : 'My Verdicts'}
              </h3>
              <p className="text-sm text-gray-600">
                {stats.verdicts_given > 0
                  ? `${stats.verdicts_given} verdict${stats.verdicts_given !== 1 ? 's' : ''} completed`
                  : 'Track your submissions and ratings'}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/judge/my-verdicts')}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
          >
            {stats.verdicts_given > 0 ? 'View All' : 'View Verdicts'}
            <ArrowRight className="h-4 w-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {stats.verdicts_given > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.verdicts_given}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.recent_verdicts}</div>
              <div className="text-xs text-gray-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Avg Rating</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
