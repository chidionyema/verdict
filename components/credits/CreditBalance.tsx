'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Gift, History } from 'lucide-react';
import { creditManager } from '@/lib/credits';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type UserCredits = Database['public']['Tables']['user_credits']['Row'];
type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

interface CreditBalanceProps {
  userId?: string;
  showTransactions?: boolean;
  compact?: boolean;
}

export function CreditBalance({ userId, showTransactions = false, compact = false }: CreditBalanceProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user?.id) {
        fetchCredits(user.id);
      }
    }

    if (userId) {
      fetchCredits(userId);
    } else {
      fetchUser();
    }
  }, [userId]);

  async function fetchCredits(targetUserId: string) {
    try {
      setLoading(true);
      
      // Fetch credits
      const userCredits = await creditManager.getUserCredits(targetUserId);
      setCredits(userCredits);

      // Fetch recent transactions if requested
      if (showTransactions) {
        const recentTransactions = await creditManager.getRecentTransactions(targetUserId, 5);
        setTransactions(recentTransactions);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Coins className="h-4 w-4" />
        <span>0 credits</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-yellow-600" />
        <span className="font-semibold">{credits.balance}</span>
        <span className="text-sm text-gray-500">credits</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Credit Balance</h3>
              <p className="text-sm text-gray-600">Judge others to earn credits</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">{credits.balance}</div>
            <div className="text-sm text-gray-500">available</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-yellow-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{credits.earned_total}</span>
            </div>
            <div className="text-xs text-gray-500">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <Gift className="h-4 w-4" />
              <span className="font-semibold">{credits.spent_total}</span>
            </div>
            <div className="text-xs text-gray-500">Total Spent</div>
          </div>
        </div>
      </div>

      {/* How to Earn Credits */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How to Earn Credits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Judge 5 submissions = 1 credit</li>
          <li>• 7-day judging streak = bonus credit</li>
          <li>• High consensus rate = streak multipliers</li>
        </ul>
      </div>

      {/* Recent Transactions */}
      {showTransactions && transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <History className="h-4 w-4" />
            <span className="font-medium">Recent Activity</span>
          </div>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">
                    {transaction.type === 'earned' && '✅ Earned credits'}
                    {transaction.type === 'spent' && '💳 Spent credits'}
                    {transaction.type === 'bonus' && '🎉 Streak bonus'}
                    {transaction.type === 'refund' && '↩️ Refund'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {transaction.description || transaction.source}
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}