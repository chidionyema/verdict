'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Heart,
  ArrowRight,
  X,
  Star,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NudgeConfig {
  id: string;
  title: string;
  message: string;
  action: string;
  href: string;
  icon: React.ReactNode;
  trigger: string; // When to show
  priority: number;
  dismissable: boolean;
}

const NUDGES: NudgeConfig[] = [
  {
    id: 'first-submission-help',
    title: 'Get Better Feedback',
    message: 'Add context about what kind of feedback you want to get more helpful responses',
    action: 'Add Context',
    href: '/requests/current?focus=context',
    icon: <Lightbulb className="h-4 w-4" />,
    trigger: 'first-submission',
    priority: 90,
    dismissable: true
  },
  {
    id: 'earn-credits',
    title: 'Help Others & Earn Credits',
    message: 'Review 3 submissions to earn 1 free credit for your next request',
    action: 'Help Out',
    href: '/review',
    icon: <Heart className="h-4 w-4" />,
    trigger: 'no-credits',
    priority: 85,
    dismissable: false
  },
  {
    id: 'complete-profile',
    title: 'Get More Relevant Feedback',
    message: 'Add your background so reviewers can give more tailored advice',
    action: 'Quick Setup',
    href: '/account?focus=profile',
    icon: <Star className="h-4 w-4" />,
    trigger: 'incomplete-profile',
    priority: 60,
    dismissable: true
  },
  {
    id: 'join-community',
    title: 'Explore the Community',
    message: 'See what others are asking for feedback on - get inspired!',
    action: 'Browse',
    href: '/feed',
    icon: <Users className="h-4 w-4" />,
    trigger: 'new-user',
    priority: 50,
    dismissable: true
  }
];

interface ContextualNudgesProps {
  user: User;
  trigger: string;
  context?: Record<string, any>;
}

export function ContextualNudges({ user, trigger, context = {} }: ContextualNudgesProps) {
  const router = useRouter();
  const [activeNudge, setActiveNudge] = useState<NudgeConfig | null>(null);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed nudges
    const dismissed = localStorage.getItem(`nudges-dismissed-${user.id}`);
    if (dismissed) {
      setDismissedNudges(JSON.parse(dismissed));
    }

    // Find relevant nudge
    const relevantNudges = NUDGES
      .filter(nudge => nudge.trigger === trigger)
      .filter(nudge => !dismissedNudges.includes(nudge.id))
      .sort((a, b) => b.priority - a.priority);

    if (relevantNudges.length > 0) {
      setActiveNudge(relevantNudges[0]);
    }
  }, [trigger, user.id, dismissedNudges]);

  const handleAction = () => {
    if (!activeNudge) return;
    
    // Track engagement
    const engagement = JSON.parse(localStorage.getItem(`nudge-engagement-${user.id}`) || '{}');
    engagement[activeNudge.id] = (engagement[activeNudge.id] || 0) + 1;
    localStorage.setItem(`nudge-engagement-${user.id}`, JSON.stringify(engagement));
    
    router.push(activeNudge.href);
    setActiveNudge(null);
  };

  const handleDismiss = () => {
    if (!activeNudge) return;
    
    const newDismissed = [...dismissedNudges, activeNudge.id];
    setDismissedNudges(newDismissed);
    localStorage.setItem(`nudges-dismissed-${user.id}`, JSON.stringify(newDismissed));
    setActiveNudge(null);
  };

  if (!activeNudge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              {activeNudge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">{activeNudge.title}</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{activeNudge.message}</p>
            </div>
            {activeNudge.dismissable && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Zap className="h-3 w-3" />
              <span>Quick tip</span>
            </div>
            <div className="flex items-center gap-2">
              {activeNudge.dismissable && (
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Not now
                </button>
              )}
              <button
                onClick={handleAction}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1"
              >
                {activeNudge.action}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to easily trigger nudges from anywhere
export function useNudge(user: User | null) {
  const showNudge = (trigger: string, context?: Record<string, any>) => {
    if (!user) return null;
    
    // This would typically dispatch to a global state or context
    // For now, we'll use a simple event system
    window.dispatchEvent(new CustomEvent('show-nudge', { 
      detail: { trigger, context, user } 
    }));
  };

  return { showNudge };
}

// Global nudge manager component to place in layout
export function NudgeManager({ user }: { user: User | null }) {
  const [currentNudge, setCurrentNudge] = useState<{
    trigger: string;
    context: Record<string, any>;
  } | null>(null);

  useEffect(() => {
    const handleShowNudge = (event: CustomEvent) => {
      setCurrentNudge({
        trigger: event.detail.trigger,
        context: event.detail.context || {}
      });
    };

    window.addEventListener('show-nudge', handleShowNudge as EventListener);
    return () => {
      window.removeEventListener('show-nudge', handleShowNudge as EventListener);
    };
  }, []);

  if (!user || !currentNudge) return null;

  return (
    <ContextualNudges
      user={user}
      trigger={currentNudge.trigger}
      context={currentNudge.context}
    />
  );
}