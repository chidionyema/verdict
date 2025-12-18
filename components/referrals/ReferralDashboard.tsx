'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, Users, TrendingUp, Check, Twitter, Send, Mail, Linkedin } from 'lucide-react';
import { referralService, getReferralShareText, getShareUrls, type ReferralStats } from '@/lib/referral-system';

interface ReferralDashboardProps {
  userId: string;
  userName?: string;
}

export function ReferralDashboard({ userId, userName }: ReferralDashboardProps) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReferralData() {
      try {
        const code = await referralService.createReferralCode(userId);
        const userStats = await referralService.getReferralStats(userId);
        
        setReferralCode(code);
        setStats(userStats);
      } catch (error) {
        console.error('Failed to load referral data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReferralData();
  }, [userId]);

  const handleCopy = async () => {
    const shareText = getReferralShareText(referralCode, userName);
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrls = getShareUrls(referralCode, userName);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-6 w-6" />
          <h2 className="text-xl font-bold">Refer Friends & Earn Credits</h2>
        </div>
        <p className="text-purple-100">
          Share Verdict with friends. When they sign up with your code, you both get 1 free credit!
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.successful_referrals}</div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending_referrals}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.total_credits_earned}</div>
              <div className="text-sm text-gray-500">Credits Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round(stats.conversion_rate * 100)}%
              </div>
              <div className="text-sm text-gray-500">Conversion</div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code & Share */}
      <div className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Referral Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg text-center"
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Share via:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span className="text-sm font-medium">Twitter</span>
            </a>
            
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
            
            <a
              href={shareUrls.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="text-sm font-medium">Telegram</span>
            </a>
            
            <a
              href={shareUrls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
            
            <a
              href={shareUrls.email}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Email</span>
            </a>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            How It Works
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <span>Share your referral code with friends</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <span>They sign up using your code</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <span>You both get 1 free credit instantly!</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-500">
          <p>• Friends must sign up within 72 hours of receiving your code</p>
          <p>• Limit 50 referrals per user</p>
          <p>• Credits awarded instantly upon successful signup</p>
        </div>
      </div>
    </div>
  );
}

// Compact referral widget for sidebar/dashboard
export function ReferralWidget({ userId }: { userId: string }) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const code = await referralService.createReferralCode(userId);
      const userStats = await referralService.getReferralStats(userId);
      setReferralCode(code);
      setStats(userStats);
    }
    loadData();
  }, [userId]);

  const handleQuickShare = () => {
    const shareText = getReferralShareText(referralCode);
    if (navigator.share) {
      navigator.share({
        title: 'Try Verdict - Get Honest Feedback',
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          <span className="font-medium">Refer & Earn</span>
        </div>
        {stats && (
          <span className="text-purple-100 text-sm">
            {stats.total_credits_earned} credits earned
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 bg-white/20 rounded px-3 py-2 text-center font-mono text-sm">
          {referralCode}
        </div>
        <button
          onClick={handleQuickShare}
          className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded transition-colors"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}