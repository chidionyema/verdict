'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Upload, 
  Sparkles,
  Gift,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UnifiedOnboardingProps {
  user: any;
  onComplete: () => void;
}

/**
 * SIMPLIFIED ONBOARDING FLOW
 * Single step: immediate value through action
 * Get users to their first submission ASAP
 */
export function UnifiedOnboarding({ user, onComplete }: UnifiedOnboardingProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    
    try {
      const supabase = createClient();
      
      // Mark onboarding as complete and give welcome credits
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          credits: 3, // Welcome bonus
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
      }

      // Route to creation flow immediately
      onComplete();
      router.push('/create?welcome=true');
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still proceed to avoid blocking user
      onComplete();
      router.push('/create');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Verdict!</h2>
          <p className="text-indigo-100">Get honest feedback from real people</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Gift className="h-6 w-6 text-green-600" />
              <h3 className="font-bold text-green-900">Welcome Bonus</h3>
            </div>
            <p className="text-green-800 text-lg font-semibold mb-2">
              You get <span className="text-2xl">3 free credits</span> to start!
            </p>
            <p className="text-sm text-green-700">
              Each credit gets you feedback from real people
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Ready to start?</span>
            </div>
            <p className="text-sm text-blue-800">
              Upload a photo, share some text, or ask for advice on anything
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            • Real people, not AI • Get feedback in minutes • Completely anonymous
          </p>
        </div>

        {/* Action */}
        <div className="p-6 bg-gray-50 rounded-b-2xl text-center">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {completing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Create Your First Request
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-3">
            Takes less than 2 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
}