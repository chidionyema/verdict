'use client';

import { useState } from 'react';
import { Share2, Copy, Heart, MessageSquare, TrendingUp, Gift, Users, Star, ExternalLink } from 'lucide-react';

interface ShareOption {
  platform: string;
  icon: any;
  color: string;
  shareText: string;
  url: string;
}

interface ReferralData {
  code: string;
  invited: number;
  earned: number;
  pending: number;
  tier: 'bronze' | 'silver' | 'gold';
}

interface ViralGrowthHubProps {
  requestId?: string;
  verdictRating?: number;
  category?: string;
  userReferralData?: ReferralData;
}

export default function ViralGrowthHub({
  requestId,
  verdictRating,
  category,
  userReferralData = {
    code: 'STYLE2024',
    invited: 3,
    earned: 15,
    pending: 5,
    tier: 'silver'
  }
}: ViralGrowthHubProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'refer' | 'social'>('share');
  const [copied, setCopied] = useState('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const shareOptions: ShareOption[] = [
    {
      platform: 'Twitter',
      icon: MessageSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      shareText: `Just got amazing feedback on Verdict! ${verdictRating ? `Rated ${verdictRating}/10` : 'The AI-powered insights were spot-on'} 🎯`,
      url: 'https://twitter.com/intent/tweet'
    },
    {
      platform: 'Instagram Story',
      icon: Heart,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      shareText: 'Check out this amazing feedback platform!',
      url: 'https://instagram.com'
    },
    {
      platform: 'LinkedIn',
      icon: Users,
      color: 'bg-blue-700 hover:bg-blue-800',
      shareText: `Professional feedback that actually works. Just improved my ${category || 'professional presence'} with Verdict's expert network.`,
      url: 'https://linkedin.com/sharing/share-offsite'
    },
    {
      platform: 'TikTok',
      icon: Star,
      color: 'bg-black hover:bg-gray-800',
      shareText: 'Rating my style transformation 📱✨',
      url: 'https://tiktok.com'
    }
  ];

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleShare = (option: ShareOption) => {
    const fullShareText = `${option.shareText} Try it: verdict.app/start?ref=${userReferralData.code}`;
    const encodedText = encodeURIComponent(fullShareText);
    
    let shareUrl = '';
    switch (option.platform) {
      case 'Twitter':
        shareUrl = `${option.url}?text=${encodedText}`;
        break;
      case 'LinkedIn':
        shareUrl = `${option.url}?url=${encodeURIComponent('https://verdict.app')}&summary=${encodedText}`;
        break;
      default:
        copyToClipboard(fullShareText, option.platform);
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'gold': return { credits: 3, bonus: '50% faster responses' };
      case 'silver': return { credits: 2, bonus: 'Priority queue access' };
      default: return { credits: 1, bonus: 'Thank you message' };
    }
  };

  const referralLink = `https://verdict.app/start?ref=${userReferralData.code}`;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Share2 className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-bold text-purple-900">
            Share Your Success
          </h3>
        </div>
        <p className="text-purple-700">
          Help others improve while earning rewards
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white rounded-lg p-1 mb-6 border">
        {[
          { id: 'share', label: 'Share Results', icon: Share2 },
          { id: 'refer', label: 'Refer Friends', icon: Gift },
          { id: 'social', label: 'Social Impact', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition ${
                activeTab === tab.id 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Share Results Tab */}
      {activeTab === 'share' && (
        <div className="space-y-4">
          {verdictRating && (
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border border-green-200 mb-4">
              <div className="text-center">
                <p className="text-green-800 font-medium mb-1">Your Verdict Rating</p>
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                  <span className="text-3xl font-bold text-green-800">{verdictRating}/10</span>
                </div>
                <p className="text-sm text-green-700 mt-1">Share your transformation!</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.platform}
                  onClick={() => handleShare(option)}
                  className={`${option.color} text-white p-4 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300`}
                >
                  <div className="text-center">
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium text-sm">{option.platform}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Direct Link Copy */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Direct Link</p>
                <p className="text-xs text-gray-600 truncate">{referralLink}</p>
              </div>
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className={`px-4 py-2 rounded-lg transition ${
                  copied === 'link' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {copied === 'link' ? '✓ Copied' : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {showShareSuccess && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm text-center font-medium">
                🎉 Shared successfully! You'll earn credits when friends sign up.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Referral Tab */}
      {activeTab === 'refer' && (
        <div className="space-y-4">
          {/* Referral Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-purple-600">{userReferralData.invited}</div>
              <p className="text-xs text-gray-600">Friends Invited</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-green-600">{userReferralData.earned}</div>
              <p className="text-xs text-gray-600">Credits Earned</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-yellow-600">{userReferralData.pending}</div>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </div>

          {/* Tier Status */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Referral Tier</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getTierColor(userReferralData.tier)}`}>
                {userReferralData.tier}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <p className="mb-1">
                <strong>{getTierBenefits(userReferralData.tier).credits} credits</strong> per successful referral
              </p>
              <p>Bonus: {getTierBenefits(userReferralData.tier).bonus}</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
            <div className="text-center">
              <p className="text-purple-800 font-medium mb-2">Your Referral Code</p>
              <div className="bg-white rounded px-4 py-2 text-xl font-mono font-bold text-purple-900 mb-3 border border-purple-300">
                {userReferralData.code}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(userReferralData.code, 'code')}
                  className={`flex-1 py-2 rounded transition ${
                    copied === 'code' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-300'
                  }`}
                >
                  {copied === 'code' ? '✓ Copied Code' : 'Copy Code'}
                </button>
                <button
                  onClick={() => copyToClipboard(referralLink, 'reflink')}
                  className={`flex-1 py-2 rounded transition ${
                    copied === 'reflink' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-300'
                  }`}
                >
                  {copied === 'reflink' ? '✓ Copied Link' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Next Tier Progress */}
          {userReferralData.tier !== 'gold' && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">Next Tier Progress</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(userReferralData.invited / (userReferralData.tier === 'bronze' ? 5 : 10)) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {userReferralData.tier === 'bronze' ? 5 - userReferralData.invited : 10 - userReferralData.invited} more referrals to {userReferralData.tier === 'bronze' ? 'Silver' : 'Gold'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Social Impact Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          {/* Community Impact */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Community Impact
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">127</div>
                <p className="text-xs text-gray-600">People helped through your shares</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">94%</div>
                <p className="text-xs text-gray-600">Satisfaction rate from referrals</p>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3">Recent Success Stories</h4>
            <div className="space-y-3">
              <div className="border-l-4 border-green-400 pl-3 py-2 bg-green-50">
                <p className="text-sm text-green-800">"Thanks to your referral, I nailed my job interview! The styling feedback was perfect." - Sarah M.</p>
              </div>
              <div className="border-l-4 border-blue-400 pl-3 py-2 bg-blue-50">
                <p className="text-sm text-blue-800">"Finally got matches on dating apps after following the profile advice!" - Mike R.</p>
              </div>
            </div>
          </div>

          {/* Leaderboard Position */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-center">
              <h4 className="font-semibold text-orange-900 mb-2">Referral Leaderboard</h4>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-orange-900">#12</span>
              </div>
              <p className="text-sm text-orange-800">Top 5% of referrers this month!</p>
              <p className="text-xs text-orange-700 mt-1">Keep sharing to reach top 10</p>
            </div>
          </div>

          {/* Exclusive Benefits */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3">Your Exclusive Benefits</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Early access to new features</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">VIP judge matching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Monthly community highlights</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}