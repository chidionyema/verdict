'use client';

import { BarChart3, Coins, DollarSign, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import type { JudgeStats, EarningsTimeframe } from './types';

interface EarningsOverviewProps {
  stats: JudgeStats;
  selectedTimeframe: EarningsTimeframe;
  onTimeframeChange: (timeframe: EarningsTimeframe) => void;
  earningsData: Array<{ date: string; amount: number }>;
}

export function EarningsOverview({
  stats,
  selectedTimeframe,
  onTimeframeChange,
  earningsData,
}: EarningsOverviewProps) {
  const getTimeframeEarnings = () => {
    switch (selectedTimeframe) {
      case 'daily':
        return stats.daily_earnings;
      case 'weekly':
        return stats.weekly_earnings;
      case 'monthly':
        return stats.monthly_earnings;
    }
  };

  return (
    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            Earnings Overview
          </h3>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => onTimeframeChange(timeframe)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedTimeframe === timeframe
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Coins className="h-5 w-5 text-green-600" />
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  stats.earnings_trend === 'up'
                    ? 'text-green-600'
                    : stats.earnings_trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {stats.earnings_trend === 'up' ? (
                  <ChevronUp className="h-3 w-3" />
                ) : stats.earnings_trend === 'down' ? (
                  <ChevronDown className="h-3 w-3" />
                ) : null}
                {stats.earnings_trend === 'up'
                  ? '+12%'
                  : stats.earnings_trend === 'down'
                    ? '-5%'
                    : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.total_earnings.toFixed(2)}</p>
            <p className="text-xs text-gray-600">Total Earnings</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${getTimeframeEarnings().toFixed(2)}</p>
            <p className="text-xs text-gray-600">This {selectedTimeframe.replace('ly', '')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.available_for_payout.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">Ready to Payout</p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="h-48 flex items-end gap-1">
          {earningsData.map((data, index) => {
            const maxAmount = Math.max(...earningsData.map((d) => d.amount));
            const height = (data.amount / maxAmount) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group cursor-pointer"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${data.amount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <button className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          Request Payout →
        </button>
      </div>
    </div>
  );
}
