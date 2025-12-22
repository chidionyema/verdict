'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  X, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Heart,
  Star,
  Users,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressiveOnboardingProps {
  user: User;
  onDismiss: () => void;
  context?: 'dashboard' | 'first-visit' | 'first-submission';
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: React.ReactNode;
  benefit: string;
  priority: number; // Higher = more important
  context: string[]; // When to show this step
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'try-first-request',
    title: 'Try Your First Request',
    description: 'Get feedback on something real - no setup required',
    action: 'Start Now',
    href: '/create',
    icon: <Zap className="h-5 w-5" />,
    benefit: 'See how AskVerdict works instantly',
    priority: 100,
    context: ['dashboard', 'first-visit']
  },
  {
    id: 'browse-community',
    title: 'Browse Real Examples',
    description: 'See what others are getting feedback on',
    action: 'Explore',
    href: '/feed',
    icon: <Users className="h-5 w-5" />,
    benefit: 'Get inspired by community requests',
    priority: 80,
    context: ['dashboard', 'first-visit']
  },
  {
    id: 'help-someone',
    title: 'Help Someone & Earn Credits',
    description: 'Review someone\'s request and earn free credits',
    action: 'Help Out',
    href: '/review',
    icon: <Heart className="h-5 w-5" />,
    benefit: 'Build karma while earning free credits',
    priority: 70,
    context: ['dashboard']
  },
  {
    id: 'complete-profile',
    title: 'Improve Your Recommendations',
    description: 'Add basic info for better matched feedback',
    action: 'Quick Setup',
    href: '/account',
    icon: <Star className="h-5 w-5" />,
    benefit: 'Get more relevant and helpful feedback',
    priority: 50,
    context: ['first-submission']
  }
];

export function ProgressiveOnboarding({ user, onDismiss, context = 'dashboard' }: ProgressiveOnboardingProps) {
  const router = useRouter();
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Filter steps based on context and priority
  const relevantSteps = ONBOARDING_STEPS
    .filter(step => step.context.includes(context))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3); // Show max 3 steps

  useEffect(() => {
    // Load completed steps from localStorage (or API)
    const completed = localStorage.getItem(`onboarding-completed-${user.id}`);
    if (completed) {
      setCompletedSteps(JSON.parse(completed));
    }

    // Auto-select highest priority step
    const uncompletedSteps = relevantSteps.filter(step => !completedSteps.includes(step.id));
    if (uncompletedSteps.length > 0) {
      setSelectedStep(uncompletedSteps[0]);
    }
  }, [user.id, completedSteps]);

  const handleStepAction = (step: OnboardingStep) => {
    // Mark as completed
    const newCompleted = [...completedSteps, step.id];
    setCompletedSteps(newCompleted);
    localStorage.setItem(`onboarding-completed-${user.id}`, JSON.stringify(newCompleted));
    
    // Navigate to the action
    router.push(step.href);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  // Don't show if all relevant steps are completed
  if (relevantSteps.every(step => completedSteps.includes(step.id))) {
    return null;
  }

  if (!selectedStep) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-1 shadow-xl"
        >
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                  {selectedStep.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedStep.title}</h3>
                  <p className="text-sm text-gray-600">{selectedStep.description}</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Why this helps:</span>
              </div>
              <p className="text-sm text-purple-800">{selectedStep.benefit}</p>
            </div>

            <div className="flex items-center justify-between">
              {/* Step indicators */}
              <div className="flex items-center gap-2">
                {relevantSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-100 text-green-700'
                        : selectedStep.id === step.id
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDismiss}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Maybe later
                </button>
                <button
                  onClick={() => handleStepAction(selectedStep)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  {selectedStep.action}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}