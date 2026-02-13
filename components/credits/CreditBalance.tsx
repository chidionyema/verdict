'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, History, AlertTriangle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface CreditBalanceProps {
  userId?: string;
  showTransactions?: boolean;
  compact?: boolean;
  /** Show warning when credits are low */
  showLowWarning?: boolean;
  /** Threshold for low credit warning */
  lowThreshold?: number;
  /** Link to buy credits */
  linkToBuy?: boolean;
  /** Callback when buy credits is clicked */
  onBuyClick?: () => void;
}

interface ProfileCredits {
  id: string;
  credits: number;
  display_name?: string;
}

export function CreditBalance({
  userId,
  showTransactions = false,
  compact = false,
  showLowWarning = true,
  lowThreshold = 2,
  linkToBuy = true,
  onBuyClick
}: CreditBalanceProps) {
  const [profile, setProfile] = useState<ProfileCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const supabase = createClient();

  const fetchCredits = useCallback(async (targetUserId: string) => {
    try {
      setLoading(true);

      // Use /api/profile to ensure profile exists with initial credits
      // This is critical for new users who signed up via email
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const { profile: profileData } = await profileRes.json();
        if (profileData) {
          setProfile({
            id: profileData.id,
            credits: profileData.credits,
            display_name: profileData.display_name
          });
          return;
        }
      }

      // Fallback: direct query (profile should exist by now)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, credits, display_name')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile credits:', error);
        return;
      }

      setProfile(profileData as ProfileCredits);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user?.id) {
        fetchCredits(user.id);
      } else {
        setLoading(false);
      }
    }

    if (userId) {
      fetchCredits(userId);
    } else {
      fetchUser();
    }
  }, [userId, fetchCredits, supabase]);

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
  }, [userId, user?.id, fetchCredits]);

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
        <Coins className="h-4 w-4" aria-hidden="true" />
        <span>0 credits</span>
      </div>
    );
  }

  const isLow = profile.credits <= lowThreshold;
  const isEmpty = profile.credits === 0;

  // Compact version with low balance indicator
  if (compact) {
    const content = (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isEmpty
            ? 'bg-red-100 text-red-700'
            : isLow
            ? 'bg-amber-100 text-amber-700'
            : 'bg-yellow-50 text-yellow-700'
        }`}
        role="status"
        aria-label={`${profile.credits} credits remaining${isLow ? ', balance is low' : ''}`}
      >
        {isEmpty ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Coins className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="font-semibold">{profile.credits}</span>
        <span className="text-sm opacity-80">credits</span>
        {isLow && showLowWarning && linkToBuy && (
          <ArrowRight className="h-3 w-3 ml-1 opacity-60" aria-hidden="true" />
        )}
      </div>
    );

    if (linkToBuy && isLow) {
      return (
        <Link
          href="/credits"
          onClick={onBuyClick}
          className="hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          {content}
        </Link>
      );
    }

    return content;
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