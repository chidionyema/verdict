'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Target, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface RecruitmentPrompt {
  id: string;
  trigger: 'after_submission' | 'low_credits' | 'time_based' | 'high_engagement';
  title: string;
  message: string;
  cta: string;
  icon: React.ReactNode;
  color: string;
}

export function SmartJudgeRecruitment({ userId }: { userId?: string }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<RecruitmentPrompt | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    
    checkRecruitmentTriggers();
  }, [userId]);

  const checkRecruitmentTriggers = async () => {
    try {
      const supabase = createClient();
      
      // Get user data for smart targeting
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_judge, credits, created_at')
        .eq('id', userId!)
        .single();

      if (!profile || (profile as any).is_judge) return; // Don't show to existing judges

      // Get user activity
      const { data: submissions } = await supabase
        .from('verdict_requests')
        .select('id')
        .eq('user_id', userId!)
        .limit(5);

      const { data: responses } = await supabase
        .from('verdict_responses')
        .select('id')
        .eq('reviewer_id', userId!)
        .limit(1);

      // Smart prompt selection based on user behavior
      let selectedPrompt: RecruitmentPrompt | null = null;

      // Trigger 1: After first submission (waiting period)
      if (submissions && submissions.length === 1 && !responses?.length) {
        selectedPrompt = {
          id: 'after_submission',
          trigger: 'after_submission',
          title: 'While you wait...',
          message: 'Your submission is being reviewed! Did you know you can earn money by reviewing others?',
          cta: 'Start Earning Now',
          icon: <Clock className="h-6 w-6" />,
          color: 'from-blue-600 to-indigo-600'
        };
      }

      // Trigger 2: Low credits
      else if ((profile as any).credits <= 1) {
        selectedPrompt = {
          id: 'low_credits',
          trigger: 'low_credits',
          title: 'Earn Free Credits',
          message: 'Review 3 submissions as a judge and earn 1 credit. Plus, get paid for every review!',
          cta: 'Become a Judge',
          icon: <DollarSign className="h-6 w-6" />,
          color: 'from-green-600 to-emerald-600'
        };
      }

      // Trigger 3: High engagement user
      else if (submissions && submissions.length >= 3) {
        selectedPrompt = {
          id: 'high_engagement',
          trigger: 'high_engagement',
          title: 'You\'re a Power User!',
          message: 'Active users like you make great judges. Earn $50-200/week in your spare time.',
          cta: 'Unlock Judge Benefits',
          icon: <Zap className="h-6 w-6" />,
          color: 'from-purple-600 to-pink-600'
        };
      }

      // Trigger 4: Time-based (user for 7+ days)
      else if ((profile as any).created_at) {
        const daysSinceSignup = Math.floor(
          (Date.now() - new Date((profile as any).created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceSignup >= 7) {
          selectedPrompt = {
            id: 'time_based',
            trigger: 'time_based',
            title: 'Ready for More?',
            message: 'You\'ve been with us for a week! Join our judge community and help others while earning.',
            cta: 'Explore Judge Role',
            icon: <Target className="h-6 w-6" />,
            color: 'from-orange-600 to-red-600'
          };
        }
      }

      // Show prompt if not dismissed
      if (selectedPrompt && !dismissed.has(selectedPrompt.id)) {
        // Add delay for better UX
        setTimeout(() => {
          setCurrentPrompt(selectedPrompt);
          setShowPrompt(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to check recruitment triggers:', error);
    }
  };

  const handleDismiss = () => {
    if (currentPrompt) {
      setDismissed(prev => new Set([...prev, currentPrompt.id]));
      localStorage.setItem(`judge_recruit_dismissed_${currentPrompt.id}`, 'true');
    }
    setShowPrompt(false);
  };

  const handleAccept = () => {
    if (currentPrompt) {
      // Track conversion
      localStorage.setItem(`judge_recruit_accepted_${currentPrompt.trigger}`, 'true');
    }
    window.location.href = '/become-a-judge';
  };

  if (!showPrompt || !currentPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 max-w-sm z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${currentPrompt.color} p-4 text-white relative`}>
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  {currentPrompt.icon}
                </div>
                <div className="pr-6">
                  <h3 className="font-bold text-lg mb-1">{currentPrompt.title}</h3>
                  <p className="text-white/90 text-sm">{currentPrompt.message}</p>
                </div>
              </div>
            </div>

            {/* Benefits list */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span>Earn $0.60 - $2.00 per review</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span>Work on your own schedule</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span>5-minute qualification process</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-2 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccept}
                className={`w-full bg-gradient-to-r ${currentPrompt.color} text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                {currentPrompt.cta}
                <ChevronRight className="h-4 w-4" />
              </motion.button>
              
              <button
                onClick={handleDismiss}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}