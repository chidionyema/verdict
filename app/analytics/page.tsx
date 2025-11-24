'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MessageSquare,
  Star,
  Clock,
  Users,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_requests?: number;
    total_responses?: number;
    responses_received?: number;
    average_rating: number;
    total_spent_cents?: number;
    total_earnings_cents?: number;
    available_earnings_cents?: number;
    credits_spent?: number;
    completion_rate?: number;
    response_rate?: number;
    average_response_time_hours?: number;
  };
  category_breakdown: Record<string, number>;
  daily_activity: Array<{ date: string; count: number }>;
  recent_requests?: any[];
  recent_responses?: any[];
  earnings_breakdown?: {
    total: number;
    available: number;
    pending: number;
    paid: number;
  };
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: string;
  action_url?: string;
  priority: 'high' | 'medium' | 'low';
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'requester' | 'judge'>('requester');
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [userType, timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewResponse, insightsResponse] = await Promise.all([
        fetch(`/api/analytics/overview?user_type=${userType}&timeframe=${timeframe}`),
        fetch(`/api/analytics/insights?user_type=${userType}`)
      ]);

      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const overviewData = await overviewResponse.json();
      setAnalyticsData(overviewData);

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'tip': return <Lightbulb className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'info': return 'border-l-blue-500';
      case 'tip': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div>No data available</div>;
  }

  const categoryChartData = Object.entries(analyticsData.category_breakdown).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const StatCard = ({ title, value, icon, change, color = 'indigo' }: any) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg shadow-sm border">
                <button
                  onClick={() => setUserType('requester')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    userType === 'requester' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Requester
                </button>
                <button
                  onClick={() => setUserType('judge')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    userType === 'judge' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Judge
                </button>
              </div>
              
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {userType === 'requester' ? (
            <>
              <StatCard
                title="Total Requests"
                value={analyticsData.overview.total_requests || 0}
                icon={<MessageSquare className="h-6 w-6 text-indigo-600" />}
                color="indigo"
              />
              <StatCard
                title="Responses Received"
                value={analyticsData.overview.responses_received || 0}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                color="blue"
              />
              <StatCard
                title="Average Rating"
                value={`${analyticsData.overview.average_rating}/10`}
                icon={<Star className="h-6 w-6 text-yellow-600" />}
                color="yellow"
              />
              <StatCard
                title="Total Spent"
                value={formatCurrency(analyticsData.overview.total_spent_cents || 0)}
                icon={<DollarSign className="h-6 w-6 text-green-600" />}
                color="green"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Responses Given"
                value={analyticsData.overview.total_responses || 0}
                icon={<MessageSquare className="h-6 w-6 text-indigo-600" />}
                color="indigo"
              />
              <StatCard
                title="Average Rating"
                value={`${analyticsData.overview.average_rating}/10`}
                icon={<Star className="h-6 w-6 text-yellow-600" />}
                color="yellow"
              />
              <StatCard
                title="Total Earnings"
                value={formatCurrency(analyticsData.overview.total_earnings_cents || 0)}
                icon={<DollarSign className="h-6 w-6 text-green-600" />}
                color="green"
              />
              <StatCard
                title="Available Payout"
                value={formatCurrency(analyticsData.overview.available_earnings_cents || 0)}
                icon={<Target className="h-6 w-6 text-purple-600" />}
                color="purple"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Activity ({timeframe})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.daily_activity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  fill="#6366f1" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Category Breakdown
            </h3>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => {
                      const value = typeof percent === 'number' ? percent * 100 : 0;
                      return `${name}: ${value.toFixed(0)}%`;
                    }}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${getInsightBorderColor(insight.type)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {insight.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {insight.description}
                      </p>
                      {insight.action && insight.action_url && (
                        <a
                          href={insight.action_url}
                          className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                        >
                          {insight.action}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent {userType === 'requester' ? 'Requests' : 'Responses'}
          </h3>
          
          {userType === 'requester' && analyticsData.recent_requests ? (
            <div className="space-y-4">
              {analyticsData.recent_requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                      {request.category}
                    </span>
                    <span className={`ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {request.response_count} responses
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : userType === 'judge' && analyticsData.recent_responses ? (
            <div className="space-y-4">
              {analyticsData.recent_responses.map((response) => (
                <div key={response.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{response.rating}/10</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Helpfulness: {response.helpfulness}/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(response.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No recent activity to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
}