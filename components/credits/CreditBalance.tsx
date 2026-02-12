'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Gift, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreditBalanceProps {
  userId?: string;
  showTransactions?: boolean;
  compact?: boolean;
}

interface ProfileCredits {
  id: string;
  credits: number;
  display_name?: string;
}

export function CreditBalance({ userId, showTransactions = false, compact = false }: CreditBalanceProps) {
  const [profile, setProfile] = useState<ProfileCredits | null>(null);
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

  // Listen for credit refresh events
  useEffect(() => {
    const handleCreditRefresh = () => {
      const targetId = userId || user?.id;
      if (targetId) {
        fetchCredits(targetId);
      }
    };

    window.addEventListener('credits-updated', handleCreditRefresh);
    return () => window.removeEventListener('credits-updated', handleCreditRefresh);
  }, [userId, user?.id]);

  async function fetchCredits(targetUserId: string) {
    try {
      setLoading(true);
      
      // Fetch credits from profiles table (single source of truth)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, credits, display_name')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile credits:', error);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse" aria-label="Loading credit balance">
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-100 rounded w-12"></div>
      </div>
    );
  }

  if (!profile) {
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
        <span className="font-semibold">{profile.credits}</span>
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
            <div className="text-3xl font-bold text-yellow-600">{profile.credits}</div>
            <div className="text-sm text-gray-500">available</div>
          </div>
        </div>

        {/* Simplified stats - no detailed tracking needed for now */}
        <div className="pt-4 border-t border-yellow-200 text-center">
          <div className="text-sm text-gray-600">
            Current Balance: <span className="font-semibold">{profile.credits} credits</span>
          </div>
        </div>
      </div>

      {/* How to Earn Credits */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How to Earn Credits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Judge 3 submissions = 1 credit</li>
          <li>• 7-day judging streak = bonus credit</li>
          <li>• High consensus rate = streak multipliers</li>
        </ul>
      </div>

      {/* Simplified - no transaction history for now */}
      {showTransactions && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <History className="h-4 w-4" />
            <span className="font-medium">Transaction History</span>
          </div>
          <p className="text-sm text-gray-600">
            Detailed transaction history will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}