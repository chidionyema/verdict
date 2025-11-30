'use client';

import { useState, useEffect } from 'react';
import { Heart, X, MessageSquare, Clock, Eye, Users, Zap } from 'lucide-react';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { JudgeReputation } from '@/components/reputation/JudgeReputation';
import { CreditEarningProgress } from '@/components/credits/CreditEarningProgress';
import { FeedCard } from '@/components/feed/FeedCard';
import { createClient } from '@/lib/supabase/client';
import { creditManager, CREDIT_ECONOMY_CONFIG } from '@/lib/credits';
import type { Database } from '@/lib/database.types';

type FeedRequest = Database['public']['Tables']['feedback_requests']['Row'] & {
  response_count?: number;
  user_has_judged?: boolean;
};

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [feedItems, setFeedItems] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [judging, setJudging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [judgeStats, setJudgeStats] = useState({ today: 0, streak: 0, totalJudgments: 0 });
  const [creditsEarned, setCreditsEarned] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadFeedItems();
        await loadJudgeStats(user.id);
      } else {
        // Redirect to login
        window.location.href = '/auth/login';
      }
    }
    init();
  }, []);

  async function loadFeedItems() {
    try {
      // Fetch public submissions that haven't been judged by current user
      const { data: requestsData, error: requestsError } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

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

  async function loadJudgeStats(userId: string) {
    try {
      const reputation = await creditManager.getJudgeReputation(userId);
      
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
    if (!user || judging || currentIndex >= feedItems.length) return;

    setJudging(true);
    try {
      const currentItem = feedItems[currentIndex];
      
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
        await creditManager.awardCreditsForJudging(user.id, responseData.id);
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
      // TODO: Show error toast
    } finally {
      setJudging(false);
    }
  }

  function handleSkip() {
    setCurrentIndex(prev => prev + 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading feed...</p>
        </div>
      </div>
    );
  }

  const currentItem = feedItems[currentIndex];
  const hasMoreItems = currentIndex < feedItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Discover</h1>
              <p className="text-sm text-gray-500">Judge others to earn credits</p>
            </div>
            <CreditBalance compact />
          </div>
        </div>
      </div>

      {/* Credit Earning Progress - Prominent */}
      {user && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <CreditEarningProgress 
              userId={user.id} 
              judgmentsToday={judgeStats.totalJudgments}
              onCreditEarned={() => {
                setCreditsEarned(prev => prev + 1);
                // Reload credits
                loadJudgeStats(user.id);
              }}
            />
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-orange-600" />
                <span className="font-medium">{judgeStats.streak}</span>
                <span>day streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-lg mx-auto">
        {!hasMoreItems ? (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 mb-6">You've seen all available submissions. Check back later for more.</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="p-4">
            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{currentIndex + 1} of {feedItems.length}</span>
                <span>{feedItems.length - currentIndex - 1} remaining</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / feedItems.length) * 100}%` }}
                ></div>
              </div>
            </div>

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
              onClick={() => window.location.href = '/feed'}
              className="flex flex-col items-center gap-1 text-indigo-600"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Judge</span>
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex flex-col items-center gap-1 text-gray-400"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => window.location.href = '/start'}
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