'use client';

import { useState, useEffect, useRef } from 'react';
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
import { creditManagerClient, CREDIT_ECONOMY_CONFIG } from '@/lib/credits-client';
import { toast } from '@/components/ui/toast';
import type { Database } from '@/lib/database.types';

type FeedRequest = Database['public']['Tables']['feedback_requests']['Row'] & {
  response_count?: number;
  user_has_judged?: boolean;
};

// Client component - no dynamic export needed

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [feedItems, setFeedItems] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [judging, setJudging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [judgeStats, setJudgeStats] = useState({ today: 0, streak: 0, totalJudgments: 0 });
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [showTraining, setShowTraining] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  
  // Progressive profiling
  const { shouldShow: showProgressiveProfile, triggerType, dismiss: dismissProgressiveProfile, checkTrigger } = useProgressiveProfile();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();

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

          const needsTraining = !(profile as any)?.judge_training_completed;
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
      
      // Fetch public submissions that haven't been judged by current user
      const fetchPromise = supabase
        .from('feedback_requests')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data: requestsData, error: requestsError } = result;

      if (requestsError) throw requestsError;
      
      // Get response counts for each request
      const itemsWithCounts = await Promise.all(
        (requestsData || []).map(async (item: any) => {
          const { count } = await supabase
            .from('feedback_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', item.id);
          
          return {
            ...item,
            response_count: count || 0,
          };
        })
      );
      
      // Filter out items already judged by this user and that have < 3 responses
      const filteredItems = itemsWithCounts.filter((item: any) => {
        // TODO: Add check if user has already judged this item
        return (item.response_count || 0) < 3; // Still needs judgments
      });

      setFeedItems(filteredItems);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadJudgeStats(userId: string, supabase: ReturnType<typeof createClient>) {
    try {
      if (!supabase) return;
      const reputation = await creditManagerClient.getJudgeReputation(userId);
      
      // Calculate today's judgments count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('feedback_responses')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_id', userId)
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

    setJudging(true);
    try {
      const currentItem = feedItems[currentIndex];
      const supabase = supabaseRef.current;
      
      // Submit judgment
      const { data: responseData, error: responseError } = await (supabase
        .from('feedback_responses') as any)
        .insert({
          request_id: currentItem.id,
          reviewer_id: user.id,
          feedback: feedback || (verdict === 'like' ? '👍 Looks good' : '👎 Not quite right'),
          rating: verdict === 'like' ? 7 : 4,
          tone: 'honest'
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData && responseData.id) {
        // Award credits for judging
        await creditManagerClient.awardCreditsForJudging(user.id, responseData.id);
        
        // Check if we should show progressive profiling after earning credits
        checkTrigger('credits_earned');
      }

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
      toast.error('Failed to submit judgment. Please try again.');
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

  function handleTrainingSkip() {
    setShowTraining(false);
    toast.error('Training is required to start judging. You can access it later from your profile.');
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

      {/* Judge Training Modal */}
      {showTraining && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleTrainingSkip}
        >
          <div onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProgressiveProfile
            user={user}
            trigger={triggerType}
            onComplete={dismissProgressiveProfile}
          />
        </div>
      )}

      {/* Main Feed */}
      <div className="max-w-lg mx-auto">
        {!hasMoreItems ? (
          <div className="px-4 py-12">
            <EmptyState 
              variant="no-requests"
              title="All caught up!"
              description="You've seen all available submissions. Check back later for more, or submit your own for feedback!"
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