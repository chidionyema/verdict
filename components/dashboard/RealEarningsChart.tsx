'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';

type Timeframe = '7d' | '30d' | '90d';

interface ChartDataPoint {
  date: string;
  amount: number;
  count: number;
}

interface ChartSummary {
  total: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  bestDay: { date: string; amount: number } | null;
  totalVerdicts: number;
}

interface ChartResponse {
  data: ChartDataPoint[];
  summary: ChartSummary;
  timeframe: string;
}

interface RealEarningsChartProps {
  className?: string;
  onPayoutClick?: () => void;
  availableForPayout?: number;
}

function formatDate(dateStr: string, timeframe: Timeframe): string {
  const date = new Date(dateStr);
  if (timeframe === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="font-medium">{new Date(label).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}</p>
        <p className="text-green-400 font-bold">{formatCurrency(data.amount)}</p>
        {data.count > 0 && (
          <p className="text-gray-400 text-xs">{data.count} verdict{data.count !== 1 ? 's' : ''}</p>
        )}
      </div>
    );
  }
  return null;
};

export function RealEarningsChart({
  className = '',
  onPayoutClick,
  availableForPayout = 0,
}: RealEarningsChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<ChartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tf: Timeframe) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/judge/earnings/chart?timeframe=${tf}`);
      if (!res.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      const json: ChartResponse = await res.json();
      setData(json.data);
      setSummary(json.summary);
    } catch (err) {
      setError('Unable to load earnings data');
      console.error('Earnings chart error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeframe);
  }, [timeframe, fetchData]);

  const handleTimeframeChange = (tf: Timeframe) => {
    if (tf !== timeframe) {
      setTimeframe(tf);
    }
  };

  const TrendIcon = summary?.trend === 'up' ? TrendingUp : summary?.trend === 'down' ? TrendingDown : Minus;
  const trendColor = summary?.trend === 'up' ? 'text-green-600' : summary?.trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            Earnings
          </h3>

          {/* Timeframe Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            key={`total-${timeframe}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {summary && (
                <span className={`text-xs font-semibold flex items-center gap-1 ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  {summary.trendPercent > 0 ? '+' : ''}{summary.trendPercent}%
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-8 bg-green-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.total ?? 0)}
              </p>
            )}
            <p className="text-xs text-gray-600">Total Earned</p>
          </motion.div>

          <motion.div
            key={`avg-${timeframe}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            {loading ? (
              <div className="h-8 bg-blue-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.average ?? 0)}
              </p>
            )}
            <p className="text-xs text-gray-600">Daily Average</p>
          </motion.div>

          <motion.div
            key={`best-${timeframe}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            {loading ? (
              <div className="h-8 bg-purple-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {summary?.bestDay ? formatCurrency(summary.bestDay.amount) : '$0.00'}
              </p>
            )}
            <p className="text-xs text-gray-600">Best Day</p>
          </motion.div>
        </div>

        {/* Chart */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-48 bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center"
            >
              <div className="text-gray-400 text-sm">Loading chart...</div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-48 bg-red-50 rounded-2xl flex items-center justify-center"
            >
              <div className="text-red-600 text-sm">{error}</div>
            </motion.div>
          ) : data.length === 0 || summary?.total === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-48 bg-gray-50 rounded-2xl flex flex-col items-center justify-center"
            >
              <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">No earnings yet</p>
              <p className="text-gray-400 text-sm">Start judging to earn credits</p>
            </motion.div>
          ) : (
            <motion.div
              key={`chart-${timeframe}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-48"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value, timeframe)}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval={timeframe === '7d' ? 0 : timeframe === '30d' ? 6 : 14}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#earningsGradient)"
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payout Button */}
        {availableForPayout > 0 && (
          <button
            onClick={onPayoutClick}
            className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Request Payout ({formatCurrency(availableForPayout)}) →
          </button>
        )}
      </div>
    </div>
  );
}
