'use client';

import { BarChart3, Coins, DollarSign, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import type { JudgeStats, EarningsTimeframe } from './types';

interface EarningsOverviewProps {
  stats: JudgeStats;
  selectedTimeframe: EarningsTimeframe;
  onTimeframeChange: (timeframe: EarningsTimeframe) => void;
  earningsData: Array<{ date: string; amount: number }>;
  isLoading?: boolean;
}

export function EarningsOverview({
  stats,
  selectedTimeframe,
  onTimeframeChange,
  earningsData,
  isLoading = false,
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
    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
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
                aria-pressed={selectedTimeframe === timeframe}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
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
            <p className="text-xs text-gray-600">
              {selectedTimeframe === 'daily' ? 'Today' :
               selectedTimeframe === 'weekly' ? 'This Week' :
               'This Month'}
            </p>
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
        <div className="h-48 flex items-end gap-1" aria-label="Earnings chart" role="img">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading earnings data...</span>
              </div>
            </div>
          ) : earningsData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No earnings data available for this period
            </div>
          ) : (
            earningsData.map((data, index) => {
              const maxAmount = Math.max(...earningsData.map((d) => d.amount), 1);
              const height = (data.amount / maxAmount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  role="presentation"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.amount.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 min-h-[48px]">
          Request Payout →
        </button>
      </div>
    </div>
  );
}
