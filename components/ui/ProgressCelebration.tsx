'use client';

import { useEffect, useState } from 'react';
import { Zap, Star, Target, ArrowRight } from 'lucide-react';
import { triggerHaptic } from './Confetti';

interface ProgressCelebrationProps {
  current: number;
  target: number;
  unit: string;
  reward: string;
  onComplete?: () => void;
}

/**
 * Animated progress indicator with milestone celebrations
 * Shows encouraging messages at different progress points
 */
export function ProgressCelebration({
  current,
  target,
  unit,
  reward,
  onComplete,
}: ProgressCelebrationProps) {
  const [prevCurrent, setPrevCurrent] = useState(current);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');

  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  // Check for milestones
  useEffect(() => {
    if (current > prevCurrent) {
      // Progress was made!
      triggerHaptic('light');

      // Check for milestone messages
      if (current === target) {
        setMilestoneMessage('Goal reached! 🎉');
        setShowMilestone(true);
        triggerHaptic('success');
        onComplete?.();
      } else if (remaining === 1) {
        setMilestoneMessage('Almost there! Just 1 more!');
        setShowMilestone(true);
      } else if (progress >= 66 && (prevCurrent / target) * 100 < 66) {
        setMilestoneMessage('Over halfway there! 💪');
        setShowMilestone(true);
      } else if (progress >= 33 && (prevCurrent / target) * 100 < 33) {
        setMilestoneMessage('Great start! Keep going!');
        setShowMilestone(true);
      }

      setPrevCurrent(current);

      // Hide milestone after delay
      if (showMilestone) {
        const timer = setTimeout(() => setShowMilestone(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [current, target, prevCurrent, remaining, progress, onComplete]);

  return (
    <div className="relative">
      {/* Milestone popup */}
      {showMilestone && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            {milestoneMessage}
          </div>
        </div>
      )}

      {/* Main progress container */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              progress >= 100
                ? 'bg-green-100 text-green-600'
                : 'bg-indigo-100 text-indigo-600'
            }`}>
              {progress >= 100 ? <Star className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {progress >= 100 ? `${reward} earned!` : `${remaining} ${unit} to go`}
              </p>
              <p className="text-xs text-gray-500">
                {current}/{target} {unit}
              </p>
            </div>
          </div>

          {progress < 100 && (
            <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
              <Zap className="h-3 w-3" />
              {reward}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
              progress >= 100
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>

          {/* Milestone markers */}
          {[33, 66].map((marker) => (
            <div
              key={marker}
              className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${
                progress >= marker ? 'bg-white' : 'bg-gray-400'
              }`}
              style={{ left: `${marker}%` }}
            />
          ))}
        </div>

        {/* Encouragement text */}
        {progress < 100 && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            {progress < 33 && 'Every contribution counts!'}
            {progress >= 33 && progress < 66 && 'You\'re making great progress!'}
            {progress >= 66 && progress < 100 && 'So close! Keep going!'}
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Compact progress pill for headers/nav
 */
export function ProgressPill({
  current,
  target,
  label,
}: {
  current: number;
  target: number;
  label: string;
}) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
      <div className="w-12 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-medium text-indigo-700">
        {current}/{target} {label}
      </span>
    </div>
  );
}
