'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RealTimeWaitingStatusProps {
  requestId: string;
  targetCount: number;
  initialCount?: number;
  onComplete?: () => void;
  className?: string;
}

export function RealTimeWaitingStatus({
  requestId,
  targetCount,
  initialCount = 0,
  onComplete,
  className = '',
}: RealTimeWaitingStatusProps) {
  const [verdictCount, setVerdictCount] = useState(initialCount);
  const [activeJudges, setActiveJudges] = useState<number>(0);
  const [recentVerdict, setRecentVerdict] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time verdict updates
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verdict_responses',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setVerdictCount((prev) => {
            const newCount = prev + 1;

            // Show animation
            setRecentVerdict(true);
            setTimeout(() => setRecentVerdict(false), 3000);

            // Check if complete
            if (newCount >= targetCount && onComplete) {
              onComplete();
            }

            return newCount;
          });
        }
      )
      .subscribe();

    // Simulate active judges (in production, track actual claiming)
    const judgeInterval = setInterval(() => {
      const remaining = targetCount - verdictCount;
      if (remaining > 0) {
        // Estimate 1-3 judges actively working
        const active = Math.min(remaining, Math.floor(Math.random() * 2) + 1);
        setActiveJudges(active);
      } else {
        setActiveJudges(0);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(judgeInterval);
    };
  }, [requestId, targetCount, verdictCount, onComplete, supabase]);

  const progress = (verdictCount / targetCount) * 100;
  const isComplete = verdictCount >= targetCount;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
      isComplete ? 'border-green-500' : 'border-indigo-500'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {isComplete ? 'All Verdicts Received!' : 'Judges Are Reviewing'}
            </h3>
            <p className="text-sm text-gray-600">
              {isComplete
                ? 'Your request is complete'
                : `${verdictCount} of ${targetCount} verdicts received`}
            </p>
          </div>
        </div>

        {/* Verdict counter */}
        <div className="text-right">
          <div className="text-3xl font-bold text-indigo-600">
            {verdictCount}/{targetCount}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isComplete
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          >
            {!isComplete && (
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            )}
          </div>
        </div>
      </div>

      {/* Live status */}
      {!isComplete && (
        <div className="space-y-3">
          {/* Active judges indicator */}
          {activeJudges > 0 && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200 animate-fade-in">
              <Users className="w-5 h-5 text-purple-600 animate-pulse" />
              <p className="text-sm font-medium text-purple-800">
                {activeJudges} {activeJudges === 1 ? 'person is' : 'people are'} reading your
                situation…
              </p>
            </div>
          )}

          {/* Recent verdict notification */}
          {recentVerdict && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 animate-bounce-in">
              <Sparkles className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">New verdict just arrived!</p>
            </div>
          )}

          {/* Estimated time */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Estimated completion:</span>
            <span className="font-medium">
              {Math.max(1, Math.ceil(((targetCount - verdictCount) * 2) / 60))} min
            </span>
          </div>
        </div>
      )}

      {/* Completion message */}
      {isComplete && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800 text-center">
            ✓ All 3 verdicts delivered! You can now view your results.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
