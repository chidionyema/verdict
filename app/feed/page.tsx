'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, X, MessageSquare, Clock, Eye, Users, Zap } from 'lucide-react';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { JudgeReputation } from '@/components/reputation/JudgeReputation';
import { CreditEarningProgress } from '@/components/credits/CreditEarningProgress';
import { FeedCard } from '@/components/feed/FeedCard';
import { EmptyState } from '@/components/ui/EmptyStates';
import { JudgeTraining } from '@/components/training/JudgeTraining';
import { ProgressiveFeedDashboard } from '@/components/feed/ProgressiveFeedDashboard';
import { ProgressiveProfile } from '@/components/onboarding/ProgressiveProfile';
import { useProgressiveProfile } from '@/hooks/useProgressiveProfile';
import { createClient } from '@/lib/supabase/client';
import { creditManager, CREDIT_ECONOMY_CONFIG } from '@/lib/credits';
import { toast } from '@/components/ui/toast';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Database } from '@/lib/database.types';

type FeedRequest = Database['public']['Tables']['verdict_requests']['Row'] & {
  response_count?: number;
  user_has_judged?: boolean;
};

// Client component - no dynamic export needed

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
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [earnMode, setEarnMode] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Progressive profiling
  const { shouldShow: showProgressiveProfile, triggerType, dismiss: dismissProgressiveProfile, checkTrigger } = useProgressiveProfile();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();

  // Focus traps for modals (WCAG accessibility)
  const trainingModalRef = useFocusTrap<HTMLDivElement>(showTraining);
  const progressiveProfileRef = useFocusTrap<HTMLDivElement>(showProgressiveProfile && !showTraining);

  // Check for earn mode from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setEarnMode(params.get('earn') === 'true');
      setReturnUrl(params.get('return'));
    }
  }, []);

  // Escape key to close Progressive Profile modal (WCAG accessibility)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showProgressiveProfile && !showTraining) {
        dismissProgressiveProfile();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProgressiveProfile, showTraining, dismissProgressiveProfile]);

  useEffect(() => {
    // Only initialize Supabase client in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    async function init() {
      try {
        // Initialize Supabase client only in browser
        if (!supabaseRef.current) {
          supabaseRef.current = createClient();
        }
        const supabase = supabaseRef.current;

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          await loadFeedItems(supabase);
          await loadJudgeStats(user.id, supabase);
          
          // Check if user needs training (new judge with < 3 total judgments)
          const { data: profile } = await supabase
            .from('profiles')
            .select('judge_training_completed')
            .eq('id', user.id)
            .single();

          // Get total judgment count to allow experienced judges to skip
          const { count: totalJudgments } = await supabase
            .from('verdict_responses')
            .select('*', { count: 'exact', head: true })
            .eq('judge_id', user.id);

          // Training is required only if not completed AND user has < 3 judgments
          const needsTraining = !(profile as any)?.judge_training_completed && (totalJudgments || 0) < 3;
          setShowTraining(needsTraining);
        } else {
          // Redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error initializing feed:', error);
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadFeedItems(supabase: ReturnType<typeof createClient>) {
    try {
      if (!supabase) return;
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      // Fetch public verdict requests that haven't been judged by current user
      const fetchPromise = supabase
        .from('verdict_requests')
        .select('*')
        .eq('visibility', 'public')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(50);

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data: requestsData, error: requestsError } = result;

      if (requestsError) throw requestsError;

      // Get the user's existing judgments to filter them out
      const { data: userJudgments } = await supabase
        .from('verdict_responses')
        .select('request_id')
        .eq('judge_id', user.id);

      const judgedRequestIds = new Set((userJudgments || []).map((j: any) => j.request_id));

      // Use the received_verdict_count from the request instead of separate query
      const itemsWithCounts = (requestsData || []).map((item: any) => ({
        ...item,
        response_count: item.received_verdict_count || 0,
      }));

      // Filter out items already judged by this user, their own requests, and completed ones
      const filteredItems = itemsWithCounts.filter((item: any) => {
        // Skip if user already judged this
        if (judgedRequestIds.has(item.id)) return false;
        // Skip if it's the user's own request
        if (item.user_id === user.id) return false;
        // Skip if request is completed (has 3+ responses)
        if ((item.response_count || 0) >= 3) return false;
        return true;
      });

      setFeedItems(filteredItems);
      setFeedError(null); // Clear any previous error
    } catch (error) {
      console.error('Error loading feed:', error);
      let errorMessage = 'Failed to load feed.';
      let errorType = 'generic';

      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          errorMessage = 'timeout';
          errorType = 'timeout';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'network';
          errorType = 'network';
        } else if (error.message.includes('401') || error.message.includes('auth')) {
          errorMessage = 'auth';
          errorType = 'auth';
        }
      }

      setFeedError(errorType);
      setFeedItems([]); // Clear items on error
    } finally {
      setLoading(false);
    }
  }

  async function loadJudgeStats(userId: string, supabase: ReturnType<typeof createClient>) {
    try {
      if (!supabase) return;
      const reputation = await creditManager.getJudgeReputation(userId);
      
      // Calculate today's judgments count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('verdict_responses')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', userId)
        .gte('created_at', today.toISOString());
      
      const totalJudgments = reputation?.total_judgments || 0;
      
      if (reputation) {
        setJudgeStats({
          today: count || 0,
          streak: reputation.current_streak || 0,
          totalJudgments: totalJudgments
        });
      } else {
        setJudgeStats({
          today: count || 0,
          streak: 0,
          totalJudgments: totalJudgments
        });
      }
    } catch (error) {
      console.error('Error loading judge stats:', error);
    }
  }

  async function handleJudgment(verdict: 'like' | 'dislike', feedback?: string) {
    if (!user || judging || currentIndex >= feedItems.length || !supabaseRef.current) return;

    // Prevent judging without completing training
    if (showTraining) {
      toast.error('Please complete the training first.');
      return;
    }

    setJudging(true);
    try {
      const currentItem = feedItems[currentIndex];

      // Submit judgment via API (handles verdict_responses, credit earning, notifications)
      const response = await fetch('/api/judge/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: currentItem.id,
          feedback: feedback || (verdict === 'like' ? '👍 Looks good' : '👎 Not quite right'),
          rating: verdict === 'like' ? 7 : 4,
          tone: 'honest'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && data.error?.includes('already')) {
          toast.error('You have already judged this request.');
          setCurrentIndex(prev => prev + 1); // Skip to next
          return;
        }
        throw new Error(data.error || 'Failed to submit judgment');
      }

      // Show credit earning feedback
      const newTotal = judgeStats.today + 1;
      const newCreditsEarned = Math.floor(newTotal / 3) - Math.floor(judgeStats.today / 3);

      if (newCreditsEarned > 0) {
        setCreditsEarned(prev => prev + newCreditsEarned);
        toast.success('🎉 You earned 1 credit! Keep judging to earn more.');
      } else {
        const remaining = 3 - (newTotal % 3);
        if (remaining < 3 && remaining > 0) {
          toast.success(`Judgment submitted! ${remaining} more to earn 1 credit.`);
        } else {
          toast.success('Judgment submitted!');
        }
      }

      // Check if we should show progressive profiling after earning credits
      checkTrigger('credits_earned');

      // Update stats
      setJudgeStats(prev => ({
        ...prev,
        today: prev.today + 1,
        totalJudgments: prev.totalJudgments + 1
      }));

      // Move to next item
      setCurrentIndex(prev => prev + 1);

    } catch (error) {
      console.error('Error submitting judgment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit judgment. Please try again.');
    } finally {
      setJudging(false);
    }
  }

  function handleSkip() {
    setCurrentIndex(prev => prev + 1);
  }

  async function handleTrainingComplete() {
    if (!user || !supabaseRef.current) return;
    
    try {
      // Mark training as completed
      await (supabaseRef.current
        .from('profiles')
        .update as any)({ judge_training_completed: true })
        .eq('id', user.id);

      setShowTraining(false);
      setTrainingCompleted(true);
      toast.success('Training completed! You can now start judging.');
    } catch (error) {
      console.error('Error completing training:', error);
    }
  }

  async function handleTrainingSkip() {
    if (!user || !supabaseRef.current) {
      toast.error('Training is required before you can start judging.');
      router.push('/dashboard');
      return;
    }

    // Check if user has enough experience to skip
    const { count: totalJudgments } = await supabaseRef.current
      .from('verdict_responses')
      .select('*', { count: 'exact', head: true })
      .eq('judge_id', user.id);

    if ((totalJudgments || 0) >= 3) {
      // Experienced user - allow skip and mark training as completed
      await (supabaseRef.current
        .from('profiles')
        .update as any)({ judge_training_completed: true })
        .eq('id', user.id);

      setShowTraining(false);
      toast.success('Welcome back! You can start judging.');
    } else {
      // New user - training is required
      toast.error('Training is required for new judges. Complete the quick tutorial to continue.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Credit progress skeleton */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="h-16 bg-white bg-opacity-50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Stats bar skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Feed card skeleton */}
        <div className="max-w-lg mx-auto p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
            {/* Header skeleton */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                </div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-4">
              <div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                </div>
              </div>

              {/* Media placeholder skeleton */}
              <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
              </div>

              {/* Progress skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="flex-1 bg-gray-200 rounded-full h-2"></div>
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="p-4 bg-gray-50 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-gray-100 rounded-lg"></div>
                <div className="flex-1 h-12 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="text-center">
                <div className="h-6 w-32 bg-yellow-100 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = feedItems[currentIndex];
  const hasMoreItems = currentIndex < feedItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progressive Feed Dashboard */}
      <div className="sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <ProgressiveFeedDashboard
            user={user}
            judgeStats={judgeStats}
            currentIndex={currentIndex}
            totalItems={feedItems.length}
          />
        </div>
      </div>

      {/* Credit Balance - Minimal in corner */}
      <div className="fixed top-4 right-4 z-20">
        <CreditBalance compact />
      </div>

      {/* Earn Mode Banner */}
      {earnMode && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Earn Free Credits</p>
                <p className="text-sm text-green-100">
                  Judge 3 submissions to earn 1 credit.
                  {judgeStats.today > 0 && ` (${judgeStats.today % 3}/3 towards next credit)`}
                </p>
              </div>
              {returnUrl && (
                <button
                  onClick={() => router.push(returnUrl)}
                  className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-50"
                >
                  {creditsEarned > 0 ? `Continue (${creditsEarned} earned)` : 'Go Back'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Judge Training Modal - Non-dismissible, training is required */}
      {showTraining && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="training-modal-title"
        >
          <div ref={trainingModalRef} onClick={(e) => e.stopPropagation()}>
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
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progressive-profile-title"
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

      {/* Main Feed */}
      <div className="max-w-lg mx-auto">
        {feedError ? (
          <div className="px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feedError === 'timeout' ? 'Loading Took Too Long' :
                 feedError === 'network' ? 'Connection Problem' :
                 feedError === 'auth' ? 'Session Expired' :
                 'Unable to Load Feed'}
              </h3>
              <p className="text-gray-600 mb-4">
                {feedError === 'timeout' ? 'The server is taking longer than usual to respond.' :
                 feedError === 'network' ? 'Please check your internet connection.' :
                 feedError === 'auth' ? 'Your session has expired. Please log in again.' :
                 'Something went wrong while loading the feed.'}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">Try these steps:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {feedError === 'timeout' ? (
                    <>
                      <li>• Wait a moment and try again</li>
                      <li>• Refresh the page</li>
                      <li>• Check if other websites load normally</li>
                    </>
                  ) : feedError === 'network' ? (
                    <>
                      <li>• Check your Wi-Fi or mobile data</li>
                      <li>• Try turning airplane mode on and off</li>
                      <li>• Move to an area with better signal</li>
                    </>
                  ) : feedError === 'auth' ? (
                    <>
                      <li>• Click "Log In Again" below</li>
                      <li>• Clear your browser cookies if issues persist</li>
                    </>
                  ) : (
                    <>
                      <li>• Refresh the page</li>
                      <li>• Try again in a few minutes</li>
                      <li>• Contact support if the issue persists</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {feedError === 'auth' ? (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
                  >
                    Log In Again
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLoading(true);
                      setFeedError(null);
                      if (supabaseRef.current) {
                        loadFeedItems(supabaseRef.current);
                      }
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[48px]"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition min-h-[48px]"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : !hasMoreItems ? (
          <div className="px-4 py-12">
            <EmptyState
              variant="no-requests"
              title="All caught up!"
              description="You've seen all available submissions. Check back later for more, or submit your own for feedback!"
              actions={[
                {
                  label: 'Submit Your Own Request',
                  action: () => router.push('/start'),
                  variant: 'primary',
                  icon: Plus
                },
                {
                  label: 'Return to Dashboard',
                  action: () => router.push('/dashboard'),
                  variant: 'secondary',
                  icon: Users
                }
              ]}
            />
          </div>
        ) : (
          <div className="p-4">
            {/* Current item */}
            {currentItem && (
              <FeedCard
                item={currentItem}
                onJudge={handleJudgment}
                onSkip={handleSkip}
                judging={judging}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => router.push('/feed')}
              className="flex flex-col items-center gap-1 text-indigo-600"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Review</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => router.push('/start')}
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Submit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}