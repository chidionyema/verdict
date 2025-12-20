'use client';

import { useState } from 'react';
import { User, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useProgressiveProfile } from '@/hooks/useProgressiveProfile';
import { ProgressiveProfile } from '@/components/onboarding/ProgressiveProfile';

interface CompleteProfilePromptProps {
  user: any;
  completionStatus: {
    display_name: boolean;
    age_range: boolean;
    interests: boolean;
    profile_completed: boolean;
  };
}

export function CompleteProfilePrompt({ user, completionStatus }: CompleteProfilePromptProps) {
  const [showModal, setShowModal] = useState(false);
  
  const completionPercentage = Object.values(completionStatus).filter(Boolean).length / 4 * 100;
  
  if (completionStatus.profile_completed || completionPercentage === 100) {
    return null; // Profile is complete
  }

  const missingSteps = [];
  if (!completionStatus.display_name) missingSteps.push('Display Name');
  if (!completionStatus.age_range) missingSteps.push('Age Range');
  if (!completionStatus.interests) missingSteps.push('Interests');

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-gray-600 mb-4">
              A complete profile helps you get better feedback and earn more credits when judging.
            </p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Profile Completion</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            
            {/* Missing Steps */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Still needed:</p>
              <div className="flex flex-wrap gap-2">
                {missingSteps.map((step) => (
                  <span
                    key={step}
                    className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Benefits */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Better matching</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>More credits</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          Complete Profile
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProgressiveProfile
            user={user}
            trigger="manual"
            onComplete={() => setShowModal(false)}
          />
        </div>
      )}
    </>
  );
}