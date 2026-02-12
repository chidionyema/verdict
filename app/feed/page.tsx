'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  X,
  MessageSquare,
  Clock,
  Eye,
  Users,
  Zap,
  Plus,
  Camera,
  FileText,
  Briefcase,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Target,
  Gift,
  RefreshCw,
  Home,
} from 'lucide-react';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { FeedCard } from '@/components/feed/FeedCard';
import { JudgeTraining } from '@/components/training/JudgeTraining';
import { ProgressiveProfile } from '@/components/onboarding/ProgressiveProfile';
import { useProgressiveProfile } from '@/hooks/useProgressiveProfile';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { triggerHaptic } from '@/components/ui/Confetti';

interface FeedRequest {
  id: string;
  user_id: string;
  category: string;
  question?: string;
  text_content?: string | null;
  context?: string | null;
  media_type?: 'photo' | 'text' | 'audio' | null;
  media_url?: string | null;
  roast_mode?: boolean | null;
  requested_tone?: 'encouraging' | 'honest' | 'brutally_honest' | null;
  visibility?: 'public' | 'private' | null;
  created_at: string;
  response_count?: number;
  received_verdict_count?: number;
  user_has_judged?: boolean;
}

const CATEGORIES = [
  { id: null, label: 'All', icon: Sparkles, color: 'indigo' },
  { id: 'appearance', label: 'Appearance', icon: Camera, color: 'pink' },
  { id: 'writing', label: 'Writing', icon: FileText, color: 'green' },
  { id: 'career', label: 'Career', icon: Briefcase, color: 'blue' },
  { id: 'other', label: 'Other', icon: MessageSquare, color: 'gray' },
];

// Static Tailwind classes for category colors (dynamic classes don't compile)
const CATEGORY_STYLES: Record<string, { active: string; inactive: string }> = {
  indigo: {
    active: 'bg-indigo-600 text-white shadow-sm',
    inactive: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  },
  pink: {
    active: 'bg-pink-600 text-white shadow-sm',
    inactive: 'bg-pink-50 text-pink-700 hover:bg-pink-100',
  },
  green: {
    active: 'bg-green-600 text-white shadow-sm',
    inactive: 'bg-green-50 text-green-700 hover:bg-green-100',
  },
  blue: {
    active: 'bg-blue-600 text-white shadow-sm',
    inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  },
  gray: {
    active: 'bg-gray-600 text-white shadow-sm',
    inactive: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
  },
};

interface PendingVerdict {
  requestId: string;
  verdict: 'like' | 'dislike';
  feedback: string;
  timeoutId: NodeJS.Timeout;
}

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [feedItems, setFeedItems] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [judging, setJudging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [judgeStats, setJudgeStats] = useState({ today: 0, streak: 0, totalJudgments: 0 });
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [showTraining, setShowTraining] = useState(false);
  const [earnMode, setEarnMode] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [pendingVerdict, setPendingVerdict] = useState<PendingVerdict | null>(null);

  const { shouldShow: showProgressiveProfile, triggerType, dismiss: dismissProgressiveProfile, checkTrigger } = useProgressiveProfile();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();

  const trainingModalRef = useFocusTrap<HTMLDivElement>(showTraining);
  const progressiveProfileRef = useFocusTrap<HTMLDivElement>(showProgressiveProfile && !showTraining);

  // Load saved category filter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilter = localStorage.getItem('verdict_feed_category_filter');
      if (savedFilter && savedFilter !== 'null') {
        setCategoryFilter(savedFilter);
      }
    }
  }, []);

  // Check URL params for earn mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setEarnMode(params.get('earn') === 'true');
      setReturnUrl(params.get('return'));
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showProgressiveProfile && !showTraining) {
        dismissProgressiveProfile();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProgressiveProfile, showTraining, dismissProgressiveProfile]);

  // Keyboard shortcuts for feed navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Don't trigger if modals are open
      if (showTraining || showProgressiveProfile) {
        return;
      }
      // Don't trigger if no items or already judging
      if (loading || judging || currentIndex >= feedItems.length) {
        return;
      }

      const currentItem = feedItems[currentIndex];
      if (!currentItem) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleJudgment('dislike', '👎 Not quite right');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleJudgment('like', '👍 Looks good!');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTraining, showProgressiveProfile, loading, judging, currentIndex, feedItems]);

  // Initialize
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    async function init() {
      try {
        if (!supabaseRef.current) {
          supabaseRef.current = createClient();
        }
        const supabase = supabaseRef.current;

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          await loadFeedItems(supabase, categoryFilter, user.id);
          await loadJudgeStats(user.id, supabase);

          // Check if training needed
          const { data: profile } = await supabase
            .from('profiles')
            .select('judge_training_completed')
            .eq('id', user.id)
            .single();

          const { count: totalJudgments } = await supabase
            .from('verdict_responses')
            .select('*', { count: 'exact', head: true })
            .eq('judge_id', user.id);

          const needsTraining = !(profile as any)?.judge_training_completed && (totalJudgments || 0) < 3;
          setShowTraining(needsTraining);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error initializing feed:', error);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Reload on category change
  useEffect(() => {
    if (user && supabaseRef.current) {
      setLoading(true);
      setCurrentIndex(0);
      loadFeedItems(supabaseRef.current, categoryFilter, user.id);
    }
  }, [categoryFilter, user]);

  const handleCategoryChange = (category: string | null) => {
    triggerHaptic('light');
    setCategoryFilter(category);
    if (typeof window !== 'undefined') {
      if (category) {
        localStorage.setItem('verdict_feed_category_filter', category);
      } else {
        localStorage.removeItem('verdict_feed_category_filter');
      }
    }
  };

  async function loadFeedItems(supabase: ReturnType<typeof createClient>, category?: string | null, userId?: string) {
    const currentUserId = userId || user?.id;

    try {
      if (!supabase || !currentUserId) {
        setFeedError('auth');
        setLoading(false);
        return;
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      let query = supabase
        .from('verdict_requests')
        .select('*')
        .eq('visibility', 'public')
        .in('status', ['open', 'in_progress']);

      if (category) {
        query = query.eq('category', category);
      }

      const fetchPromise = query
        .order('created_at', { ascending: false })
        .limit(50);

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data: requestsData, error: requestsError } = result;

      if (requestsError) throw requestsError;

      // Filter out already judged requests
      const { data: userJudgments } = await supabase
        .from('verdict_responses')
        .select('request_id')
        .eq('judge_id', currentUserId);

      const judgedRequestIds = new Set((userJudgments || []).map((j: any) => j.request_id));

      const filteredItems = (requestsData || [])
        .map((item: any) => ({
          ...item,
          response_count: item.received_verdict_count || 0,
        }))
        .filter((item: any) => {
          if (judgedRequestIds.has(item.id)) return false;
          if (item.user_id === currentUserId) return false;
          if ((item.response_count || 0) >= 3) return false;
          return true;
        });

      setFeedItems(filteredItems);
      setFeedError(null);
    } catch (error) {
      console.error('Error loading feed:', error);
      let errorType = 'generic';
      if (error instanceof Error) {
        if (error.message === 'Request timeout') errorType = 'timeout';
        else if (error.message.includes('network')) errorType = 'network';
        else if (error.message.includes('auth')) errorType = 'auth';
      }
      setFeedError(errorType);
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadJudgeStats(userId: string, supabase: ReturnType<typeof createClient>) {
    try {
      if (!supabase) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('verdict_responses')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', userId)
        .gte('created_at', today.toISOString());

      const { count: totalJudgments } = await supabase
        .from('verdict_responses')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', userId);

      setJudgeStats({
        today: count || 0,
        streak: 0,
        totalJudgments: totalJudgments || 0
      });
    } catch (error) {
      console.error('Error loading judge stats:', error);
    }
  }

  // Actually submit the verdict to the API
  async function submitVerdict(requestId: string, verdict: 'like' | 'dislike', feedback: string) {
    try {
      const response = await fetch('/api/judge/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          feedback: feedback,
          rating: verdict === 'like' ? 7 : 4,
          tone: 'honest'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          router.push('/auth/login?redirect=/feed');
          return;
        }
        if (response.status === 400 && data.error?.includes('already')) {
          // Already judged - this is fine, just continue
          return;
        }
        throw new Error(data.error || 'Failed to submit');
      }

      // Credit earning logic
      const newTotal = judgeStats.today + 1;
      const newCreditsEarned = Math.floor(newTotal / 3) - Math.floor(judgeStats.today / 3);

      if (newCreditsEarned > 0) {
        setCreditsEarned(prev => prev + newCreditsEarned);
        triggerHaptic('success');
        toast.success('🎉 You earned 1 credit!');
      }

      checkTrigger('credits_earned');

      setJudgeStats(prev => ({
        ...prev,
        today: prev.today + 1,
        totalJudgments: prev.totalJudgments + 1
      }));

    } catch (error) {
      console.error('Error submitting judgment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit.');
    }
  }

  // Handle undo - restore previous state
  function handleUndo() {
    if (!pendingVerdict) return;

    // Cancel the pending submission
    clearTimeout(pendingVerdict.timeoutId);
    setPendingVerdict(null);

    // Go back to the previous card
    setCurrentIndex(prev => Math.max(0, prev - 1));

    triggerHaptic('light');
    toast.success('Verdict undone');
  }

  async function handleJudgment(verdict: 'like' | 'dislike', feedback?: string) {
    if (!user || judging || currentIndex >= feedItems.length || !supabaseRef.current) return;

    if (showTraining) {
      toast.error('Please complete the training first.');
      return;
    }

    const currentItem = feedItems[currentIndex];
    if (!currentItem?.id) {
      toast.error('Unable to find item. Please refresh.');
      return;
    }

    // Cancel any existing pending verdict
    if (pendingVerdict) {
      clearTimeout(pendingVerdict.timeoutId);
    }

    setJudging(true);
    triggerHaptic('light');

    const feedbackText = feedback || (verdict === 'like' ? '👍 Looks good' : '👎 Not quite right');

    // Move to next card immediately
    setCurrentIndex(prev => prev + 1);
    setJudging(false);

    // Set up delayed submission with undo option
    const timeoutId = setTimeout(() => {
      submitVerdict(currentItem.id, verdict, feedbackText);
      setPendingVerdict(null);
    }, 3000);

    setPendingVerdict({
      requestId: currentItem.id,
      verdict,
      feedback: feedbackText,
      timeoutId,
    });

    // Show undo toast
    toast.success(
      verdict === 'like' ? '👍 Liked!' : '👎 Disliked',
      {
        duration: 3000,
        showProgress: true,
        undoAction: handleUndo,
      }
    );
  }

  // Cleanup pending verdict on unmount
  useEffect(() => {
    return () => {
      if (pendingVerdict) {
        clearTimeout(pendingVerdict.timeoutId);
        // Submit immediately on unmount
        submitVerdict(pendingVerdict.requestId, pendingVerdict.verdict, pendingVerdict.feedback);
      }
    };
  }, [pendingVerdict]);


  function handleSkip() {
    triggerHaptic('light');
    setCurrentIndex(prev => prev + 1);
  }

  async function handleTrainingComplete() {
    if (!user || !supabaseRef.current) {
      toast.error('Session expired.');
      router.push('/auth/login?redirect=/feed');
      return;
    }

    try {
      await (supabaseRef.current
        .from('profiles')
        .update as any)({ judge_training_completed: true })
        .eq('id', user.id);

      setShowTraining(false);
      toast.success('Training complete! Start reviewing.');
    } catch (error) {
      console.error('Training error:', error);
      setShowTraining(false);
      toast.success('Training complete!');
    }
  }

  async function handleTrainingSkip() {
    if (!user || !supabaseRef.current) {
      toast.error('Session expired.');
      router.push('/auth/login?redirect=/feed');
      return;
    }

    try {
      const { count } = await supabaseRef.current
        .from('verdict_responses')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', user.id);

      if ((count || 0) >= 3) {
        await (supabaseRef.current
          .from('profiles')
          .update as any)({ judge_training_completed: true })
          .eq('id', user.id);
        toast.success('Welcome back!');
      } else {
        toast.success('Training skipped.');
      }
      setShowTraining(false);
    } catch (error) {
      console.error('Skip error:', error);
      setShowTraining(false);
    }
  }

  const currentItem = feedItems[currentIndex];
  const hasMoreItems = currentIndex < feedItems.length;
  const progressToCredit = judgeStats.today % 3;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          {/* Card skeleton */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Training Modal */}
      {showTraining && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div ref={trainingModalRef} onClick={e => e.stopPropagation()}>
            <JudgeTraining
              onComplete={handleTrainingComplete}
              onSkip={handleTrainingSkip}
              className="w-full max-w-md"
            />
          </div>
        </div>
      )}

      {/* Progressive Profile Modal */}
      {showProgressiveProfile && user && !showTraining && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div ref={progressiveProfileRef}>
            <ProgressiveProfile
              user={user}
              trigger={triggerType}
              onComplete={dismissProgressiveProfile}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                aria-label="Go back to dashboard"
                className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <Home className="h-5 w-5" aria-hidden="true" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Review Feed</h1>
                <p className="text-xs text-gray-500">Help others, earn credits</p>
              </div>
            </div>
            <CreditBalance compact />
          </div>
        </div>
      </header>

      {/* Earn Mode Banner */}
      {earnMode && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Earn Free Credits</span>
            </div>
            {returnUrl && creditsEarned > 0 && (
              <button
                onClick={() => router.push(returnUrl)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Done ({creditsEarned} earned)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar - Only show when earning */}
      {judgeStats.today > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to next credit</span>
              <span className="font-semibold text-indigo-600">{progressToCredit}/3</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(progressToCredit / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-[9]">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Filter by category">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = categoryFilter === cat.id;
              const colorStyles = CATEGORY_STYLES[cat.color] || CATEGORY_STYLES.gray;
              return (
                <button
                  key={cat.id || 'all'}
                  onClick={() => handleCategoryChange(cat.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Filter by ${cat.label}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${
                    isActive ? colorStyles.active : colorStyles.inactive
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {feedError ? (
          /* Error State */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {feedError === 'timeout' ? 'Taking too long' :
               feedError === 'network' ? 'Connection issue' :
               feedError === 'auth' ? 'Session expired' :
               'Something went wrong'}
            </h3>
            <p className="text-gray-600 mb-6">
              {feedError === 'auth'
                ? 'Please log in again to continue.'
                : 'Please check your connection and try again.'}
            </p>
            <div className="flex flex-col gap-3">
              {feedError === 'auth' ? (
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Log In
                </button>
              ) : (
                <button
                  onClick={() => {
                    setLoading(true);
                    setFeedError(null);
                    if (supabaseRef.current && user?.id) {
                      loadFeedItems(supabaseRef.current, categoryFilter, user.id);
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        ) : !hasMoreItems ? (
          /* Empty State - Beautiful and encouraging */
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="relative inline-block mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                <Target className="h-12 w-12 text-indigo-500" />
              </div>
              {judgeStats.today > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
                >
                  {judgeStats.today}
                </motion.div>
              )}
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {categoryFilter ? 'No requests in this category' : "You're all caught up!"}
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              {categoryFilter
                ? `There are no ${categoryFilter} submissions to review right now. Try another category or check back later.`
                : judgeStats.today > 0
                  ? `Great work! You've reviewed ${judgeStats.today} submission${judgeStats.today > 1 ? 's' : ''} today.`
                  : "There are no submissions waiting for feedback. Be the first to submit something!"}
            </p>

            <div className="space-y-3">
              {categoryFilter && (
                <button
                  onClick={() => handleCategoryChange(null)}
                  className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <Sparkles className="h-5 w-5" />
                  View All Categories
                </button>
              )}

              <Link
                href="/submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
                Submit Your Own Request
              </Link>

              <Link
                href="/dashboard"
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                <Home className="h-5 w-5" />
                Back to Dashboard
              </Link>
            </div>

            {/* Stats summary if user has reviewed */}
            {judgeStats.totalJudgments > 0 && (
              <motion.div
                className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm text-indigo-600 font-medium mb-2">Your Impact</p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-900">{judgeStats.totalJudgments}</p>
                    <p className="text-xs text-indigo-600">Total Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-900">{Math.floor(judgeStats.totalJudgments / 3)}</p>
                    <p className="text-xs text-indigo-600">Credits Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-900">{judgeStats.today}</p>
                    <p className="text-xs text-indigo-600">Today</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Feed Card */
          <div>
            {/* Counter */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
              <span>{currentIndex + 1} of {feedItems.length}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {feedItems.length - currentIndex} remaining
              </span>
            </div>

            {/* Card Stack */}
            {currentItem && (
              <div className="relative">
                {/* Background cards for stack effect */}
                {feedItems.length - currentIndex > 2 && (
                  <div
                    className="absolute inset-x-4 top-3 h-full bg-white rounded-2xl border border-gray-100 shadow-sm"
                    aria-hidden="true"
                  />
                )}
                {feedItems.length - currentIndex > 1 && (
                  <div
                    className="absolute inset-x-2 top-1.5 h-full bg-white rounded-2xl border border-gray-100 shadow-md"
                    aria-hidden="true"
                  />
                )}
                {/* Main card */}
                <div className="relative z-10">
                  <FeedCard
                    item={currentItem}
                    onJudge={handleJudgment}
                    onSkip={handleSkip}
                    judging={judging}
                  />
                </div>
              </div>
            )}

            {/* Keyboard shortcuts hint - hidden on mobile */}
            <div className="hidden sm:flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">←</kbd>
                <span>Dislike</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">→</kbd>
                <span>Like</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">S</kbd>
                <span>Skip</span>
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-20" aria-label="Bottom navigation">
        <div className="max-w-lg mx-auto px-6 py-2">
          <div className="flex items-center justify-around">
            <button
              onClick={() => router.push('/feed')}
              aria-current="page"
              aria-label="Review feed - current page"
              className="flex flex-col items-center gap-0.5 py-2 px-4 min-h-[48px] min-w-[64px] text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">Review</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Go to dashboard"
              className="flex flex-col items-center gap-0.5 py-2 px-4 min-h-[48px] min-w-[64px] text-gray-400 hover:text-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => router.push('/submit')}
              aria-label="Submit a new request"
              className="flex flex-col items-center gap-0.5 py-2 px-4 min-h-[48px] min-w-[64px] text-gray-400 hover:text-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">Submit</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
