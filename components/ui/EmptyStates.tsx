'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Search,
  Plus,
  ArrowRight,
  Star,
  Users,
  Clock,
  Zap,
  Eye,
  Heart,
  Sparkles,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Trophy,
  Target,
  Gift,
  RefreshCw,
  Bell,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { useLocalizedPricing } from '@/hooks/use-pricing';

// ============================================
// Social Proof Hook
// ============================================

interface SocialProofData {
  reviewsThisHour: number;
  avgRating: number;
  activeJudges: number;
  avgResponseTime: string;
  isLoading: boolean;
}

function useSocialProof(): SocialProofData {
  const [data, setData] = useState<SocialProofData>({
    reviewsThisHour: 47,
    avgRating: 8.4,
    activeJudges: 23,
    avgResponseTime: '2.1h',
    isLoading: true,
  });

  useEffect(() => {
    // Simulate fetching live data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/social-proof/live-stats');
        if (response.ok) {
          const stats = await response.json();
          setData({
            reviewsThisHour: stats.reviewsThisHour || 47,
            avgRating: stats.avgRating || 8.4,
            activeJudges: stats.activeJudges || 23,
            avgResponseTime: stats.avgResponseTime || '2.1h',
            isLoading: false,
          });
        } else {
          setData(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

// ============================================
// Time-Based Hints
// ============================================

interface TimeHint {
  message: string;
  icon: React.ReactNode;
  type: 'peak' | 'quiet' | 'normal';
}

function useTimeBasedHint(): TimeHint {
  return useMemo(() => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;

    // Peak hours: 6-10 PM
    if (hour >= 18 && hour <= 22) {
      return {
        message: "Peak time! New requests coming in every few minutes.",
        icon: <Flame className="w-5 h-5 text-orange-500" />,
        type: 'peak',
      };
    }

    // Morning hours: 6-9 AM
    if (hour >= 6 && hour <= 9) {
      return {
        message: "Morning rush starting. Great time to review!",
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        type: 'normal',
      };
    }

    // Late night: 11 PM - 6 AM
    if (hour >= 23 || hour < 6) {
      return {
        message: "Quiet hours. Check back around 9 AM for more activity.",
        icon: <Clock className="w-5 h-5 text-blue-500" />,
        type: 'quiet',
      };
    }

    // Weekends
    if (isWeekend && hour >= 10 && hour <= 17) {
      return {
        message: "Weekends are busy! Lots of outfit and dating requests.",
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
        type: 'peak',
      };
    }

    // Default
    return {
      message: "Peak hours are 6-10 PM. Set a reminder to check back!",
      icon: <Bell className="w-5 h-5 text-gray-500" />,
      type: 'normal',
    };
  }, []);
}

// ============================================
// Progress Unlock Component
// ============================================

interface ProgressUnlockProps {
  current: number;
  target: number;
  label: string;
  reward: string;
  onComplete?: () => void;
}

function ProgressUnlock({ current, target, label, reward, onComplete }: ProgressUnlockProps) {
  const percentage = Math.min(100, (current / target) * 100);
  const remaining = Math.max(0, target - current);

  useEffect(() => {
    if (current >= target && onComplete) {
      onComplete();
    }
  }, [current, target, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
          <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {remaining > 0 ? `${remaining} more to unlock: ${reward}` : `Unlocked: ${reward}`}
          </p>
        </div>
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {current}/{target}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>
    </motion.div>
  );
}

// ============================================
// Live Stats Display
// ============================================

function LiveStatsDisplay({ className = '' }: { className?: string }) {
  const stats = useSocialProof();

  const statItems = [
    {
      value: stats.reviewsThisHour,
      label: 'Reviews this hour',
      color: 'indigo',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      value: stats.activeJudges,
      label: 'Active judges',
      color: 'green',
      icon: <Users className="w-4 h-4" />,
    },
    {
      value: stats.avgRating,
      label: 'Avg rating',
      color: 'amber',
      icon: <Star className="w-4 h-4" />,
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {statItems.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`text-center p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl border border-${stat.color}-200 dark:border-${stat.color}-800`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className={`text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.icon}
            </span>
            <AnimatedNumber value={typeof stat.value === 'number' ? stat.value : parseFloat(stat.value)} />
          </div>
          <p className={`text-xs text-${stat.color}-700 dark:text-${stat.color}-300`}>
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-xl font-bold">
      {Number.isInteger(displayValue) ? displayValue : displayValue.toFixed(1)}
    </span>
  );
}

// ============================================
// Engagement CTA
// ============================================

interface EngagementCTAProps {
  type: 'notification' | 'streak' | 'achievement';
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function EngagementCTA({ type, title, description, actionLabel, onAction }: EngagementCTAProps) {
  const icons = {
    notification: <Bell className="w-5 h-5" />,
    streak: <Flame className="w-5 h-5" />,
    achievement: <Award className="w-5 h-5" />,
  };

  const colors = {
    notification: 'from-blue-500 to-indigo-500',
    streak: 'from-orange-500 to-red-500',
    achievement: 'from-amber-500 to-yellow-500',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className={`w-full bg-gradient-to-r ${colors[type]} rounded-xl p-4 text-white text-left group`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-white/80">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  );
}

interface EmptyStateProps {
  variant: 'no-requests' | 'no-results' | 'no-feedback' | 'no-credits' | 'first-time' | 'error' | 'loading' | 'judge-queue-empty';
  title?: string;
  description?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  context?: {
    searchTerm?: string;
    filterType?: string;
    userType?: 'new' | 'returning' | 'expert';
  };
  className?: string;
}

export function EmptyState({ 
  variant, 
  title, 
  description, 
  actions = [], 
  context = {},
  className = '' 
}: EmptyStateProps) {
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(true);
  const pricing = useLocalizedPricing();

  const getEmptyStateConfig = () => {
    switch (variant) {
      case 'no-requests':
        return {
          icon: Inbox,
          title: title || "You're all caught up! 🎉",
          description: description || "Nice work! You've reviewed everything in your queue. New requests come in constantly—check back soon or browse the community feed.",
          illustration: '✨',
          defaultActions: [
            {
              label: 'Browse Community Feed',
              action: () => router.push('/feed'),
              variant: 'primary' as const,
              icon: Users
            },
            {
              label: 'Submit Your Own Request',
              action: () => router.push('/submit'),
              variant: 'secondary' as const,
              icon: Plus
            }
          ]
        };

      case 'no-results':
        return {
          icon: Search,
          title: title || `No results for "${context.searchTerm}"`,
          description: description || 'Try adjusting your search or browse popular categories instead.',
          illustration: '🔍',
          defaultActions: [
            {
              label: 'Clear Filters',
              action: () => window.location.reload(),
              variant: 'secondary' as const
            },
            {
              label: 'Browse All',
              action: () => router.push('/feed'),
              variant: 'primary' as const,
              icon: Eye
            }
          ]
        };

      case 'no-feedback':
        return {
          icon: MessageSquare,
          title: title || 'No feedback yet',
          description: description || 'Your request is being reviewed by experts. You\'ll get notified when feedback arrives!',
          illustration: '⏳',
          defaultActions: [
            {
              label: 'Check Status',
              action: () => router.push('/my-requests'),
              variant: 'secondary' as const,
              icon: Clock
            },
            {
              label: 'Submit Another',
              action: () => router.push('/submit'),
              variant: 'primary' as const,
              icon: Plus
            }
          ]
        };

      case 'no-credits':
        return {
          icon: Star,
          title: title || 'Earn a Free Credit! ⭐',
          description: description || 'Review 3 submissions (~15 min) and earn 1 free credit. You\'ll help others while getting your own feedback!',
          illustration: '🎯',
          defaultActions: [
            {
              label: 'Start Earning (3 Reviews → 1 Credit)',
              action: () => router.push('/feed?earn=true'),
              variant: 'primary' as const,
              icon: Heart
            },
            {
              label: `Pay ${pricing.privatePrice} Instead`,
              action: () => router.push('/submit?visibility=private'),
              variant: 'secondary' as const,
              icon: Zap
            }
          ]
        };

      case 'first-time':
        return {
          icon: Sparkles,
          title: title || 'Welcome to Verdict!',
          description: description || 'You\'re about to get honest feedback from real people. Here\'s how to get started.',
          illustration: '🎉',
          defaultActions: [
            {
              label: 'Take the Tour',
              action: () => {/* Would trigger onboarding */},
              variant: 'secondary' as const,
              icon: Eye
            },
            {
              label: 'Submit First Request',
              action: () => router.push('/submit'),
              variant: 'primary' as const,
              icon: Plus
            }
          ]
        };

      case 'judge-queue-empty':
        return {
          icon: Users,
          title: title || "You've reviewed everything! 🏆",
          description: description || "Great work! You're faster than new submissions are coming in. New requests appear every few minutes during peak hours (6-10 PM).",
          illustration: '🚀',
          defaultActions: [
            {
              label: 'Check for New Requests',
              action: () => window.location.reload(),
              variant: 'primary' as const,
              icon: Eye
            },
            {
              label: 'Submit Your Own Request',
              action: () => router.push('/submit'),
              variant: 'secondary' as const,
              icon: Plus
            }
          ]
        };

      case 'error':
        return {
          icon: AlertTriangle,
          title: title || 'Unable to Load Content',
          description: description || 'We\'re having trouble loading this content. Please try again or check back later.',
          illustration: '',
          defaultActions: [
            {
              label: 'Try Again',
              action: () => window.location.reload(),
              variant: 'primary' as const
            },
            {
              label: 'Go Home',
              action: () => router.push('/'),
              variant: 'secondary' as const
            }
          ]
        };

      default:
        return {
          icon: Inbox,
          title: title || 'Nothing here yet',
          description: description || 'This area is empty, but you can change that!',
          illustration: '📭',
          defaultActions: []
        };
    }
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;
  const finalActions = actions.length > 0 ? actions : config.defaultActions;

  return (
    <div className={`text-center py-16 px-8 ${className}`}>
      {/* Animated illustration */}
      <div className={`mb-8 ${isAnimated ? 'animate-bounce-gentle' : ''}`}>
        <div className="relative inline-block">
          {/* Background circle with subtle animation */}
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            <Icon className="w-12 h-12 text-gray-400" />
          </div>
          
          {/* Floating emoji */}
          <div className="text-4xl absolute -top-2 -right-2 animate-float">
            {config.illustration}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {config.title}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Actions */}
      {finalActions.length > 0 && (
        <div className="space-y-3 max-w-xs mx-auto">
          {finalActions.map((action, index) => (
            <TouchButton
              key={index}
              onClick={action.action}
              className={`w-full flex items-center justify-center gap-2 ${
                action.variant === 'primary' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {(action as any).icon && React.createElement((action as any).icon, { className: "w-4 h-4" })}
              {action.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </TouchButton>
          ))}
        </div>
      )}

      {/* Contextual help or tips */}
      {variant === 'no-credits' && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 text-sm">Quick tip</h3>
              <p className="text-blue-800 text-xs mt-1">
                Reviewing takes ~5 minutes per request. You'll learn a lot by seeing what others submit!
              </p>
            </div>
          </div>
        </div>
      )}

      {variant === 'judge-queue-empty' && (
        <JudgeQueueEmptyExtras />
      )}

      {variant === 'first-time' && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: '📸', title: 'Upload anything', desc: 'Photos or text' },
            { icon: '⚡', title: 'Get 3 opinions', desc: 'Real humans, not AI' },
            { icon: '🎯', title: 'Make better decisions', desc: 'Honest, structured feedback' }
          ].map((item, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
              <p className="text-gray-600 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Specific empty states for common scenarios
export function NoRequestsEmptyState({ userType = 'returning' }: { userType?: 'new' | 'returning' | 'expert' }) {
  const router = useRouter();
  
  const getContextualMessage = () => {
    switch (userType) {
      case 'new':
        return {
          title: 'Ready to start judging?',
          description: 'Help others make better decisions and earn credits for your own requests. It\'s surprisingly addictive!'
        };
      case 'expert':
        return {
          title: 'Queue cleared! 🎉',
          description: 'You\'ve helped everyone in your queue. More requests will appear soon, or you can browse the global feed.'
        };
      default:
        return {
          title: 'No requests in your queue',
          description: 'Your personalized queue is empty. Check the global feed or wait for new requests to arrive.'
        };
    }
  };

  const { title, description } = getContextualMessage();

  return (
    <EmptyState
      variant="no-requests"
      title={title}
      description={description}
      context={{ userType }}
      actions={[
        {
          label: userType === 'new' ? 'Start Your First Review' : 'Browse All Requests',
          action: () => router.push('/judge'),
          variant: 'primary',
          icon: Users
        },
        {
          label: 'Submit Your Own',
          action: () => router.push('/submit'),
          variant: 'secondary',
          icon: Plus
        }
      ]}
    />
  );
}

export function SearchEmptyState({ 
  searchTerm, 
  category,
  onClearSearch,
  onTryCategory 
}: {
  searchTerm: string;
  category?: string;
  onClearSearch: () => void;
  onTryCategory: (cat: string) => void;
}) {
  const popularCategories = [
    { name: 'Style & Appearance', emoji: '👔', category: 'appearance' },
    { name: 'Profiles & Bios', emoji: '💼', category: 'profile' },
    { name: 'Life Decisions', emoji: '🤔', category: 'decision' }
  ];

  return (
    <div className="text-center py-16 px-8">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-8 h-8 text-gray-400" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-3">
        No results for "{searchTerm}"
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Try a different search term or browse our popular categories instead.
      </p>

      {/* Popular categories */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Try these popular categories:</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {popularCategories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => onTryCategory(cat.category)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <span>{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-xs mx-auto">
        <TouchButton
          onClick={onClearSearch}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Clear Search & Browse All
        </TouchButton>
      </div>
    </div>
  );
}

// ============================================
// Judge Queue Empty Extras
// ============================================

function JudgeQueueEmptyExtras() {
  const timeHint = useTimeBasedHint();
  const router = useRouter();

  return (
    <div className="mt-8 max-w-lg mx-auto space-y-4">
      {/* Live stats - social proof */}
      <LiveStatsDisplay />

      {/* Time-based hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-4 rounded-xl border ${
          timeHint.type === 'peak'
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : timeHint.type === 'quiet'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}
      >
        <div className="flex items-start gap-3">
          {timeHint.icon}
          <div className="text-left">
            <h3 className={`font-semibold text-sm ${
              timeHint.type === 'peak'
                ? 'text-orange-900 dark:text-orange-200'
                : timeHint.type === 'quiet'
                ? 'text-blue-900 dark:text-blue-200'
                : 'text-amber-900 dark:text-amber-200'
            }`}>
              {timeHint.type === 'peak' ? 'High Activity' : timeHint.type === 'quiet' ? 'Quiet Time' : 'Activity Tip'}
            </h3>
            <p className={`text-xs mt-1 ${
              timeHint.type === 'peak'
                ? 'text-orange-800 dark:text-orange-300'
                : timeHint.type === 'quiet'
                ? 'text-blue-800 dark:text-blue-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}>
              {timeHint.message}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Engagement CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <EngagementCTA
          type="notification"
          title="Get notified when requests arrive"
          description="We'll ping you when new requests match your preferences"
          actionLabel="Enable notifications"
          onAction={() => {
            if ('Notification' in window) {
              Notification.requestPermission();
            }
          }}
        />
      </motion.div>
    </div>
  );
}

// ============================================
// Enhanced Empty State Variants
// ============================================

export function NoVerdictsEmptyState({
  verdictCount = 0,
  onStartJudging,
}: {
  verdictCount?: number;
  onStartJudging?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Start your judging journey
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Help others make better decisions and earn credits for your own requests.
      </p>

      {/* Progress unlock */}
      <div className="max-w-sm mx-auto mb-6">
        <ProgressUnlock
          current={verdictCount}
          target={3}
          label="First milestone"
          reward="1 free credit"
        />
      </div>

      <TouchButton
        onClick={onStartJudging || (() => router.push('/judge'))}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
      >
        <Eye className="w-4 h-4 mr-2" />
        Start Reviewing
      </TouchButton>
    </div>
  );
}

export function NoCreditsEmptyStateEnhanced({
  currentCredits = 0,
  verdictsToCredit = 3,
  currentVerdicts = 0,
}: {
  currentCredits?: number;
  verdictsToCredit?: number;
  currentVerdicts?: number;
}) {
  const router = useRouter();
  const pricing = useLocalizedPricing();

  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Star className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Earn a free credit
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Review {verdictsToCredit} submissions to earn 1 credit. Takes about 15 minutes.
      </p>

      {/* Progress to credit */}
      <div className="max-w-sm mx-auto mb-6">
        <ProgressUnlock
          current={currentVerdicts % verdictsToCredit}
          target={verdictsToCredit}
          label="Progress to next credit"
          reward="1 credit"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <TouchButton
          onClick={() => router.push('/judge')}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Heart className="w-4 h-4 mr-2" />
          Start Earning
        </TouchButton>
        <TouchButton
          onClick={() => router.push('/pricing')}
          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <Zap className="w-4 h-4 mr-2" />
          Buy Credits
        </TouchButton>
      </div>
    </div>
  );
}

export function WaitingForFeedbackEmptyState({
  requestId,
  submittedAt,
  expectedVerdicts = 3,
  currentVerdicts = 0,
}: {
  requestId?: string;
  submittedAt?: Date;
  expectedVerdicts?: number;
  currentVerdicts?: number;
}) {
  const router = useRouter();
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!submittedAt) return;

    const updateTime = () => {
      const diff = Date.now() - submittedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeAgo(`${hours}h ${minutes % 60}m ago`);
      } else {
        setTimeAgo(`${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [submittedAt]);

  return (
    <div className="text-center py-12 px-6">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Your request is being reviewed
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        Submitted {timeAgo}
      </p>

      {/* Progress */}
      <div className="max-w-xs mx-auto mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Verdicts received</span>
          <span className="font-semibold">{currentVerdicts}/{expectedVerdicts}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentVerdicts / expectedVerdicts) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Social proof */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Average response time is <span className="font-semibold">2.1 hours</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <TouchButton
          onClick={() => router.push('/judge')}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          Review others while waiting
        </TouchButton>
      </div>
    </div>
  );
}

// Animation styles
export function EmptyStateStyles() {
  return (
    <style jsx global>{`
      @keyframes bounce-gentle {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }

      .animate-bounce-gentle {
        animation: bounce-gentle 2s ease-in-out infinite;
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
    `}</style>
  );
}

// Re-export helper components
export { LiveStatsDisplay, ProgressUnlock, EngagementCTA, useSocialProof, useTimeBasedHint };