'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  TrendingUp, 
  Clock, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  Target,
  Award,
  Sparkles,
  Calendar,
  BarChart3,
  X,
  Coins
} from 'lucide-react';
import Link from 'next/link';

interface SmartCreditSuggestionsProps {
  userId: string;
  userProfile: {
    credits: number;
    total_submissions: number;
    total_reviews: number;
    last_review_date?: string;
    signup_date?: string;
  };
  currentPage?: string;
  onDismiss?: () => void;
}

interface CreditSuggestion {
  id: string;
  type: 'review' | 'streak' | 'referral' | 'purchase' | 'comeback';
  title: string;
  subtitle: string;
  description: string;
  potentialEarnings: string;
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon: any;
  color: string;
  urgency: 'high' | 'medium' | 'low';
}

export function SmartCreditSuggestions({ 
  userId, 
  userProfile, 
  currentPage = 'dashboard',
  onDismiss 
}: SmartCreditSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CreditSuggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<CreditSuggestion | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    generatePersonalizedSuggestions();
    loadDismissedSuggestions();
  }, [userProfile, currentPage]);

  const loadDismissedSuggestions = () => {
    const saved = localStorage.getItem('verdict_dismissed_credit_suggestions');
    if (saved) {
      try {
        setDismissed(new Set(JSON.parse(saved)));
      } catch (e) {
        // Ignore errors
      }
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    const newDismissed = new Set([...dismissed, suggestionId]);
    setDismissed(newDismissed);
    localStorage.setItem('verdict_dismissed_credit_suggestions', JSON.stringify(Array.from(newDismissed)));
    
    if (activeSuggestion?.id === suggestionId) {
      setActiveSuggestion(null);
    }
  };

  const generatePersonalizedSuggestions = () => {
    const newSuggestions: CreditSuggestion[] = [];
    const { credits, total_submissions, total_reviews, last_review_date, signup_date } = userProfile;
    
    // Low credits - urgent review suggestion
    if (credits <= 1 && !dismissed.has('urgent_review')) {
      newSuggestions.push({
        id: 'urgent_review',
        type: 'review',
        title: 'Almost Out of Credits!',
        subtitle: 'Review 3 submissions to earn more',
        description: 'You\'re running low on credits. Help others and earn credits back quickly.',
        potentialEarnings: '3-5 credits',
        timeEstimate: '15-20 min',
        difficulty: 'easy',
        action: {
          label: 'Start Reviewing',
          href: '/review'
        },
        icon: Heart,
        color: 'red',
        urgency: 'high'
      });
    }

    // No credits - multiple options
    if (credits === 0 && !dismissed.has('no_credits_multi')) {
      newSuggestions.push({
        id: 'no_credits_multi',
        type: 'review',
        title: 'Out of Credits',
        subtitle: 'Choose your path to get back in action',
        description: 'Review others for free credits or purchase credits for instant access.',
        potentialEarnings: '1-10+ credits',
        timeEstimate: '5-30 min',
        difficulty: 'easy',
        action: {
          label: 'Earn Free Credits',
          href: '/review'
        },
        icon: Coins,
        color: 'orange',
        urgency: 'high'
      });
    }

    // First time user with submissions but no reviews
    if (total_submissions > 0 && total_reviews === 0 && !dismissed.has('first_review')) {
      newSuggestions.push({
        id: 'first_review',
        type: 'review',
        title: 'Try Reviewing Others',
        subtitle: 'See what great feedback looks like',
        description: 'Reviewing others helps you understand what good feedback looks like and earns you credits.',
        potentialEarnings: '1-2 credits',
        timeEstimate: '5-10 min',
        difficulty: 'easy',
        action: {
          label: 'Review Your First',
          href: '/review'
        },
        icon: Users,
        color: 'blue',
        urgency: 'medium'
      });
    }

    // Inactive reviewer comeback
    if (last_review_date && isOlderThan(last_review_date, 7) && !dismissed.has('comeback_reviewer')) {
      newSuggestions.push({
        id: 'comeback_reviewer',
        type: 'comeback',
        title: 'Welcome Back!',
        subtitle: 'Quick review to get back in the flow',
        description: 'It\'s been a while since your last review. Jump back in with a quick 5-minute review.',
        potentialEarnings: '1-2 credits',
        timeEstimate: '5 min',
        difficulty: 'easy',
        action: {
          label: 'Quick Review',
          href: '/review'
        },
        icon: Clock,
        color: 'green',
        urgency: 'low'
      });
    }

    // Active user - streak building
    if (total_reviews >= 5 && credits > 2 && !dismissed.has('build_streak')) {
      newSuggestions.push({
        id: 'build_streak',
        type: 'streak',
        title: 'Build Your Streak',
        subtitle: 'Review daily for bonus credits',
        description: 'Active reviewers earn bonus credits. Review for 3 days straight to unlock streak bonuses.',
        potentialEarnings: '+50% bonus',
        timeEstimate: '5 min/day',
        difficulty: 'medium',
        action: {
          label: 'Start Streak',
          href: '/review'
        },
        icon: Award,
        color: 'purple',
        urgency: 'low'
      });
    }

    // Referral suggestion for engaged users
    if (total_submissions >= 3 && total_reviews >= 3 && !dismissed.has('referral_master')) {
      newSuggestions.push({
        id: 'referral_master',
        type: 'referral',
        title: 'Invite Friends',
        subtitle: 'Earn credits when friends sign up',
        description: 'Share Verdict with friends. Both you and they get bonus credits when they join.',
        potentialEarnings: '5 credits each',
        timeEstimate: '2 min',
        difficulty: 'easy',
        action: {
          label: 'Share Invite Link',
          href: '/referrals'
        },
        icon: Users,
        color: 'indigo',
        urgency: 'low'
      });
    }

    // Purchase suggestion for heavy users with no credits
    if (total_submissions >= 5 && credits <= 1 && !dismissed.has('power_user_purchase')) {
      newSuggestions.push({
        id: 'power_user_purchase',
        type: 'purchase',
        title: 'Power User Deal',
        subtitle: 'Skip the wait with instant credits',
        description: 'You\'re an active user. Get instant access with our power user discount.',
        potentialEarnings: '20% off',
        timeEstimate: 'Instant',
        difficulty: 'easy',
        action: {
          label: 'View Deals',
          href: '/credits/buy'
        },
        icon: Zap,
        color: 'yellow',
        urgency: 'medium'
      });
    }

    // Context-aware suggestions based on current page
    if (currentPage === 'create' && credits <= 2 && !dismissed.has('create_page_credits')) {
      newSuggestions.push({
        id: 'create_page_credits',
        type: 'review',
        title: 'Need More Credits?',
        subtitle: 'Quick reviews while you create',
        description: 'Review a few submissions while planning your request. Earn credits and get inspired.',
        potentialEarnings: '2-4 credits',
        timeEstimate: '10-15 min',
        difficulty: 'easy',
        action: {
          label: 'Review First',
          href: '/review'
        },
        icon: Target,
        color: 'blue',
        urgency: 'medium'
      });
    }

    // Sort by urgency and priority
    const prioritized = newSuggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      // Secondary sort by type priority
      const typeOrder = { review: 4, purchase: 3, comeback: 2, streak: 1, referral: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });

    setSuggestions(prioritized);
    
    // Set active suggestion to highest priority
    if (prioritized.length > 0 && !activeSuggestion) {
      setActiveSuggestion(prioritized[0]);
    }
  };

  const isOlderThan = (dateString: string, days: number): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
    return diffDays > days;
  };

  const handleAction = (suggestion: CreditSuggestion) => {
    // Track engagement
    localStorage.setItem('verdict_last_credit_action', JSON.stringify({
      suggestionId: suggestion.id,
      timestamp: new Date().toISOString()
    }));

    // Dismiss the suggestion after action
    dismissSuggestion(suggestion.id);
  };

  if (!activeSuggestion || dismissed.has(activeSuggestion.id)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`bg-gradient-to-r ${ 
        activeSuggestion.color === 'red' ? 'from-red-50 to-orange-50 border-red-200' :
        activeSuggestion.color === 'orange' ? 'from-orange-50 to-yellow-50 border-orange-200' :
        activeSuggestion.color === 'blue' ? 'from-blue-50 to-indigo-50 border-blue-200' :
        activeSuggestion.color === 'green' ? 'from-green-50 to-emerald-50 border-green-200' :
        activeSuggestion.color === 'purple' ? 'from-purple-50 to-pink-50 border-purple-200' :
        activeSuggestion.color === 'indigo' ? 'from-indigo-50 to-purple-50 border-indigo-200' :
        'from-yellow-50 to-orange-50 border-yellow-200'
      } border rounded-xl p-6 mb-6 relative`}
    >
      <button
        onClick={() => dismissSuggestion(activeSuggestion.id)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          activeSuggestion.color === 'red' ? 'bg-red-600' :
          activeSuggestion.color === 'orange' ? 'bg-orange-600' :
          activeSuggestion.color === 'blue' ? 'bg-blue-600' :
          activeSuggestion.color === 'green' ? 'bg-green-600' :
          activeSuggestion.color === 'purple' ? 'bg-purple-600' :
          activeSuggestion.color === 'indigo' ? 'bg-indigo-600' :
          'bg-yellow-600'
        }`}>
          <activeSuggestion.icon className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-900">{activeSuggestion.title}</h3>
            {activeSuggestion.urgency === 'high' && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">
                Urgent
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-700 mb-3">{activeSuggestion.description}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span>{activeSuggestion.potentialEarnings}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{activeSuggestion.timeEstimate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span className="capitalize">{activeSuggestion.difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeSuggestion.action.href ? (
              <Link
                href={activeSuggestion.action.href}
                onClick={() => handleAction(activeSuggestion)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all hover:shadow-lg ${
                  activeSuggestion.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  activeSuggestion.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  activeSuggestion.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  activeSuggestion.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  activeSuggestion.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  activeSuggestion.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {activeSuggestion.action.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <button
                onClick={() => {
                  activeSuggestion.action.onClick?.();
                  handleAction(activeSuggestion);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all hover:shadow-lg ${
                  activeSuggestion.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  activeSuggestion.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  activeSuggestion.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  activeSuggestion.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  activeSuggestion.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  activeSuggestion.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {activeSuggestion.action.label}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}

            {activeSuggestion.type === 'review' && activeSuggestion.urgency !== 'high' && (
              <Link
                href="/credits/buy"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Or buy credits
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Hook for using smart credit suggestions
export function useSmartCreditSuggestions(userProfile: any) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if we should show suggestions
    const lastShown = localStorage.getItem('verdict_last_credit_suggestion_shown');
    const lastAction = localStorage.getItem('verdict_last_credit_action');
    
    let shouldDisplay = false;

    // Show if low credits
    if (userProfile?.credits <= 1) {
      shouldDisplay = true;
    }
    
    // Show if hasn't been shown today
    if (lastShown) {
      const lastDate = new Date(lastShown);
      const today = new Date();
      const daysSince = (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysSince >= 1) {
        shouldDisplay = true;
      }
    } else {
      shouldDisplay = true;
    }
    
    // Don't show if recently took action
    if (lastAction) {
      const actionData = JSON.parse(lastAction);
      const actionDate = new Date(actionData.timestamp);
      const now = new Date();
      const hoursSince = (now.getTime() - actionDate.getTime()) / (1000 * 3600);
      
      if (hoursSince < 2) {
        shouldDisplay = false;
      }
    }

    setShouldShow(shouldDisplay);
    
    if (shouldDisplay) {
      localStorage.setItem('verdict_last_credit_suggestion_shown', new Date().toISOString());
    }
  }, [userProfile]);

  return shouldShow;
}