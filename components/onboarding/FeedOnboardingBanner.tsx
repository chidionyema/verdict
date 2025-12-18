'use client';

import { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, Users } from 'lucide-react';

interface FeedOnboardingBannerProps {
  userJudgmentCount?: number;
  userCredits?: number;
}

export function FeedOnboardingBanner({ userJudgmentCount = 0, userCredits = 0 }: FeedOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Check if user should see the banner
  const shouldShow = userJudgmentCount < 5 && !dismissed;
  const judgmentsLeft = Math.max(0, 5 - userJudgmentCount);
  const progress = (userJudgmentCount / 5) * 100;

  useEffect(() => {
    // Check if banner was previously dismissed
    const wasDismissed = localStorage.getItem('feed_onboarding_dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }

    // Show progress animation after mount
    setTimeout(() => setShowProgress(true), 500);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('feed_onboarding_dismissed', 'true');
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="pr-8">
        {userJudgmentCount === 0 ? (
          // First-time user
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 text-white rounded-full p-2">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Welcome to the Community Feed! 👋</h3>
                <p className="text-sm text-gray-600">Judge 5 submissions to earn your first free credit</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 mb-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Your Progress</span>
                <span className="text-sm text-indigo-600 font-bold">0/5 Judgments</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full w-0 transition-all duration-1000"></div>
              </div>
              <p className="text-sm text-gray-600">Start judging submissions below to earn your first credit!</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Help others, get helped back</span>
              </div>
              <div className="text-sm font-semibold text-indigo-600">
                5 judgments = 1 free submission
              </div>
            </div>
          </div>
        ) : (
          // Progress user
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 text-white rounded-full p-2">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Great Progress! 🔥</h3>
                <p className="text-sm text-gray-600">
                  {judgmentsLeft} more {judgmentsLeft === 1 ? 'judgment' : 'judgments'} to earn a free credit
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Almost there!</span>
                <span className="text-sm text-green-600 font-bold">{userJudgmentCount}/5 Judgments</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ${showProgress ? '' : 'w-0'}`}
                  style={{ width: showProgress ? `${progress}%` : '0%' }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Keep judging to earn your credit! Then submit your own request for free.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Next: <span className="font-semibold text-green-600">+1 Free Credit</span>
              </div>
              {userCredits > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">You have</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-bold">
                    {userCredits} {userCredits === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}