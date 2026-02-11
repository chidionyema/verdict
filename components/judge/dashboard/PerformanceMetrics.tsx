'use client';

import { Activity, Star } from 'lucide-react';
import type { JudgeStats } from './types';

interface PerformanceMetricsProps {
  stats: JudgeStats;
}

export function PerformanceMetrics({ stats }: PerformanceMetricsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-600" />
        Today's Performance
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Verdicts Today</span>
          <span className="text-lg font-bold text-gray-900">{stats.verdicts_today}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Quality Score</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {stats.average_quality_score ? stats.average_quality_score.toFixed(1) : 'N/A'}
            </span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    stats.average_quality_score &&
                    i < Math.round(stats.average_quality_score / 2)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Response Time</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {stats.response_time_avg ? `${Math.round(stats.response_time_avg)}m` : 'N/A'}
            </span>
            {stats.response_time_avg && stats.response_time_avg < 10 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                FAST!
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Best Category</span>
          <span className="text-sm font-semibold text-indigo-600 capitalize">
            {stats.best_category}
          </span>
        </div>
      </div>
    </div>
  );
}
