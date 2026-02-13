'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Download,
  Twitter,
  MessageSquare,
  Clock,
  Star,
  Gift,
  ArrowRight,
  ExternalLink,
  Globe,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

// Community Stats Component
interface CommunityStatsProps {
  totalUsers: number;
  activeToday: number;
  verdictsThisWeek: number;
  compact?: boolean;
}

export function CommunityStats({ totalUsers, activeToday, verdictsThisWeek, compact = false }: CommunityStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="h-4 w-4 text-indigo-500" />
        <span>Join {formatNumber(totalUsers)} users</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Community Activity</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{formatNumber(totalUsers)}</div>
          <div className="text-xs text-gray-500">Total Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatNumber(activeToday)}</div>
          <div className="text-xs text-gray-500">Active Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{formatNumber(verdictsThisWeek)}</div>
          <div className="text-xs text-gray-500">Verdicts This Week</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-600">
        <TrendingUp className="h-4 w-4" />
        <span>Growing fast! +{Math.floor(activeToday * 0.1)} new users today</span>
      </div>
    </div>
  );
}

// Activity Feed Component
interface ActivityItem {
  id: string;
  type: 'verdict' | 'signup' | 'milestone' | 'achievement';
  category?: string;
  timeAgo: string;
  anonymizedUser: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showHeader?: boolean;
}

export function ActivityFeed({ activities, maxItems = 5, showHeader = true }: ActivityFeedProps) {
  const [visibleActivities, setVisibleActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setVisibleActivities(activities.slice(0, maxItems));
  }, [activities, maxItems]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'verdict':
        return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'signup':
        return { icon: Users, color: 'text-green-500', bg: 'bg-green-100' };
      case 'milestone':
        return { icon: Award, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'achievement':
        return { icon: Star, color: 'text-amber-500', bg: 'bg-amber-100' };
      default:
        return { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'verdict':
        return `${activity.anonymizedUser} received a verdict on their ${activity.category || 'decision'}`;
      case 'signup':
        return `${activity.anonymizedUser} joined the community`;
      case 'milestone':
        return `${activity.anonymizedUser} reached a new streak milestone`;
      case 'achievement':
        return `${activity.anonymizedUser} earned an achievement`;
      default:
        return 'Something happened';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {showHeader && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Live Activity
            </h3>
            <Badge className="bg-green-100 text-green-700 animate-pulse">Live</Badge>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        <AnimatePresence mode="popLayout">
          {visibleActivities.map((activity, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="px-5 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {activity.timeAgo}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Share Verdict Card Generator
interface ShareVerdictCardProps {
  verdict: {
    id: string;
    question: string;
    category: string;
    averageRating?: number;
    feedbackCount: number;
    topFeedback?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ShareVerdictCard({ verdict, isOpen, onClose }: ShareVerdictCardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'minimal' | 'bold' | 'gradient'>('gradient');

  if (!isOpen) return null;

  const shareText = `Just got honest feedback on "${verdict.question.slice(0, 50)}${verdict.question.length > 50 ? '...' : ''}"

${verdict.averageRating ? `Rating: ${'⭐'.repeat(Math.round(verdict.averageRating))} (${verdict.averageRating.toFixed(1)}/5)` : ''}
${verdict.feedbackCount} detailed reviews received

Get your own verdict at askverdict.com

#Verdict #HonestFeedback`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const styles = {
    minimal: 'bg-white border-2 border-gray-200',
    bold: 'bg-gray-900 text-white',
    gradient: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            Share Your Verdict
          </h3>
          <p className="text-gray-600 text-sm mt-1">Create a shareable card for social media</p>
        </div>

        <div className="p-6">
          {/* Style selector */}
          <div className="flex gap-2 mb-4">
            {(['minimal', 'bold', 'gradient'] as const).map(style => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedStyle === style
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>

          {/* Preview card */}
          <div className={`rounded-xl p-6 mb-4 ${styles[selectedStyle]}`}>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-bold text-lg mb-2">VERDICT RECEIVED</h4>
              <p className={`text-sm mb-4 ${selectedStyle === 'minimal' ? 'text-gray-600' : 'opacity-80'}`}>
                "{verdict.question.slice(0, 60)}{verdict.question.length > 60 ? '...' : ''}"
              </p>
              {verdict.averageRating && (
                <div className="mb-2">
                  ⭐ {verdict.averageRating.toFixed(1)}/5
                </div>
              )}
              <p className={`text-sm ${selectedStyle === 'minimal' ? 'text-gray-500' : 'opacity-70'}`}>
                {verdict.feedbackCount} reviews received
              </p>
              <div className={`mt-4 text-xs ${selectedStyle === 'minimal' ? 'text-gray-400' : 'opacity-50'}`}>
                askverdict.com
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <TouchButton
              onClick={handleCopy}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Text
                </>
              )}
            </TouchButton>
            <TouchButton
              onClick={handleTwitterShare}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Share on X
            </TouchButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Invite Friends CTA
interface InviteFriendsCTAProps {
  userId: string;
  referralCode?: string;
  totalReferrals?: number;
  compact?: boolean;
}

export function InviteFriendsCTA({ userId, referralCode = 'VERDICT123', totalReferrals = 0, compact = false }: InviteFriendsCTAProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `https://askverdict.com/join?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5" />
            <div>
              <div className="font-medium">Invite Friends</div>
              <div className="text-purple-100 text-sm">Both get 1 free credit</div>
            </div>
          </div>
          <TouchButton
            onClick={handleCopy}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </TouchButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-6 w-6" />
          <h3 className="text-xl font-bold">Invite Friends, Earn Credits</h3>
        </div>
        <p className="text-purple-100">
          Share Verdict with friends. You both get 1 free credit when they sign up!
        </p>
      </div>

      <div className="p-6">
        {/* Stats */}
        {totalReferrals > 0 && (
          <div className="bg-purple-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Friends invited</span>
              <span className="font-bold text-purple-600">{totalReferrals}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-600">Credits earned</span>
              <span className="font-bold text-purple-600">{totalReferrals}</span>
            </div>
          </div>
        )}

        {/* Referral code */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">Your referral link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
            <TouchButton
              onClick={handleCopy}
              className={copied ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </TouchButton>
          </div>
        </div>

        {/* Quick share */}
        <div className="flex gap-2">
          <TouchButton
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get honest feedback on your decisions with Verdict! Join using my link: ${referralUrl}`)}`, '_blank')}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Share on X
          </TouchButton>
          <TouchButton
            onClick={() => window.open(`mailto:?subject=Check out Verdict!&body=Get honest feedback on your decisions: ${referralUrl}`, '_blank')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Email
          </TouchButton>
        </div>

        <Link href="/referrals">
          <div className="mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
            View referral dashboard <ArrowRight className="h-4 w-4 inline" />
          </div>
        </Link>
      </div>
    </div>
  );
}

// Social proof banner
interface SocialProofBannerProps {
  recentSignups: number;
  timeframe: string;
}

export function SocialProofBanner({ recentSignups, timeframe }: SocialProofBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <div className="flex -space-x-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full border-2 border-white"
          />
        ))}
      </div>
      <span className="text-sm text-green-700">
        <strong>{recentSignups}+ people</strong> joined in the {timeframe}
      </span>
    </motion.div>
  );
}
