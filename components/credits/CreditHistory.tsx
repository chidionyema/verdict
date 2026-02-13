'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Gift, Clock, ArrowRight, RefreshCw, Gavel } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'purchased' | 'bonus' | 'refund';
  source: string;
  description: string;
  created_at: string;
}

interface CreditHistoryProps {
  userId?: string;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export function CreditHistory({
  userId,
  limit = 10,
  showHeader = true,
  compact = false,
  className = '',
}: CreditHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const supabase = createClient();
        let targetUserId = userId;

        if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setLoading(false);
            return;
          }
          targetUserId = user.id;
        }

        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching credit history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [userId, limit]);

  const getTransactionIcon = (type: string, source: string) => {
    if (type === 'earned' && source === 'judging') {
      return <Gavel className="h-4 w-4 text-green-600" />;
    }
    if (type === 'bonus') {
      return <Gift className="h-4 w-4 text-purple-600" />;
    }
    if (type === 'spent') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    if (type === 'purchased') {
      return <Coins className="h-4 w-4 text-amber-600" />;
    }
    if (type === 'refund') {
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
      case 'bonus':
      case 'purchased':
      case 'refund':
        return 'text-green-600';
      case 'spent':
        return 'text-red-500';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'spent' ? '-' : '+';
    return `${prefix}${Math.abs(amount)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`} aria-label="Loading credit history">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No transactions yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Your credit history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <a
            href="/account?tab=credits"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              compact ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tx.type === 'spent' ? 'bg-red-100' :
              tx.type === 'bonus' ? 'bg-purple-100' :
              tx.type === 'purchased' ? 'bg-amber-100' :
              'bg-green-100'
            }`}>
              {getTransactionIcon(tx.type, tx.source)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tx.description}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(tx.created_at)}
              </p>
            </div>
            <div className={`text-sm font-bold ${getTransactionColor(tx.type)}`}>
              {formatAmount(tx.amount, tx.type)} credit{Math.abs(tx.amount) !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
