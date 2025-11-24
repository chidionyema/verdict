'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Shield,
  BarChart3,
  Settings,
  UserCheck,
  Flag
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active_today: number;
    new_this_week: number;
  };
  requests: {
    total: number;
    pending: number;
    completed: number;
    today: number;
  };
  responses: {
    total: number;
    today: number;
    average_rating: number;
  };
  moderation: {
    pending_reports: number;
    flagged_content: number;
    suspended_users: number;
  };
  revenue: {
    total: number;
    this_month: number;
    transactions_today: number;
  };
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: string;
}) => (
  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && <p className="text-sm text-green-600 mt-1">{trend}</p>}
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          throw new Error('Failed to fetch dashboard stats');
        }
        return;
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Content Moderation',
      description: 'Review reported content and manage flags',
      icon: Flag,
      href: '/admin/moderation',
      color: '#f59e0b',
      urgent: stats?.moderation.pending_reports || 0,
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: '#3b82f6',
    },
    {
      title: 'Analytics',
      description: 'View detailed platform analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: '#10b981',
    },
    {
      title: 'Settings',
      description: 'Configure platform settings',
      icon: Settings,
      href: '/admin/settings',
      color: '#6b7280',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform health and manage operations</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.users.total}
              subtitle={`${stats.users.active_today} active today`}
              icon={Users}
              color="#3b82f6"
              trend={`+${stats.users.new_this_week} this week`}
            />
            
            <StatCard
              title="Requests"
              value={stats.requests.total}
              subtitle={`${stats.requests.pending} pending`}
              icon={MessageSquare}
              color="#10b981"
              trend={`${stats.requests.today} today`}
            />
            
            <StatCard
              title="Moderation Queue"
              value={stats?.moderation?.pending_reports ?? 0}
              subtitle={`${stats?.moderation?.flagged_content ?? 0} flagged items`}
              icon={AlertTriangle}
              color={(stats?.moderation?.pending_reports ?? 0) > 0 ? "#ef4444" : "#f59e0b"}
            />
            
            <StatCard
              title="Revenue"
              value={`$${(stats.revenue.total / 100).toFixed(0)}`}
              subtitle={`$${(stats.revenue.this_month / 100).toFixed(0)} this month`}
              icon={DollarSign}
              color="#8b5cf6"
              trend={`${stats.revenue.transactions_today} transactions today`}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-full group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <action.icon className="h-6 w-6" style={{ color: action.color }} />
                  </div>
                  {action.urgent && action.urgent > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {action.urgent}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Platform Status</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-medium">2.3 hours</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Judge Availability</span>
                <span className="font-medium">
                  {stats && Math.round((stats.responses.today / stats.requests.today) * 100) || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Rating</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">
                    {stats?.responses.average_rating.toFixed(1) || 'N/A'}/10
                  </span>
                  {stats && stats.responses.average_rating >= 8 && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {(stats?.moderation?.pending_reports ?? 0) > 0 && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      {stats?.moderation?.pending_reports ?? 0} pending content reports
                    </p>
                    <p className="text-xs text-red-600">Requires moderation action</p>
                  </div>
                  <Link
                    href="/admin/moderation"
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Review →
                  </Link>
                </div>
              )}
              
              {(stats?.moderation?.suspended_users ?? 0) > 0 && (
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-yellow-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      {stats?.moderation?.suspended_users ?? 0} suspended users
                    </p>
                    <p className="text-xs text-yellow-600">May require review</p>
                  </div>
                  <Link
                    href="/admin/users?filter=suspended"
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              )}

              {(!stats?.moderation.pending_reports && !stats?.moderation.suspended_users) && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      All systems normal
                    </p>
                    <p className="text-xs text-green-600">No urgent actions required</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Dashboard last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
