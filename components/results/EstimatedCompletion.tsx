'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle } from 'lucide-react';

interface EstimatedCompletionProps {
  receivedCount: number;
  targetCount: number;
  createdAt: string;
  status: 'open' | 'in_progress' | 'closed' | 'cancelled';
  className?: string;
}

export function EstimatedCompletion({
  receivedCount,
  targetCount,
  createdAt,
  status,
  className = '',
}: EstimatedCompletionProps) {
  const estimation = useMemo(() => {
    if (status === 'closed' || status === 'cancelled') {
      return null;
    }

    const now = new Date();
    const created = new Date(createdAt);
    const elapsedMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    const remaining = targetCount - receivedCount;

    if (remaining <= 0) {
      return { text: 'Complete!', isComplete: true, minutes: 0 };
    }

    // Calculate average time per verdict based on elapsed time
    let avgMinutesPerVerdict: number;

    if (receivedCount > 0) {
      // Use actual data
      avgMinutesPerVerdict = elapsedMinutes / receivedCount;
    } else {
      // Use estimated averages based on tier
      // Community: ~45 min avg, Standard: ~30 min avg, Pro: ~20 min avg
      if (targetCount <= 3) {
        avgMinutesPerVerdict = 45;
      } else if (targetCount <= 5) {
        avgMinutesPerVerdict = 30;
      } else {
        avgMinutesPerVerdict = 20;
      }
    }

    const estimatedRemainingMinutes = avgMinutesPerVerdict * remaining;

    // Format the time
    let text: string;
    if (estimatedRemainingMinutes < 60) {
      text = `~${Math.round(estimatedRemainingMinutes)} min`;
    } else if (estimatedRemainingMinutes < 120) {
      text = `~1 hour`;
    } else if (estimatedRemainingMinutes < 180) {
      text = `~1-2 hours`;
    } else if (estimatedRemainingMinutes < 360) {
      text = `~2-4 hours`;
    } else {
      text = `~4-8 hours`;
    }

    return {
      text,
      isComplete: false,
      minutes: estimatedRemainingMinutes,
      remaining,
    };
  }, [receivedCount, targetCount, createdAt, status]);

  if (!estimation) return null;

  if (estimation.isComplete) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200 ${className}`}
      >
        <CheckCircle className="h-4 w-4" />
        <span>All verdicts received!</span>
      </motion.div>
    );
  }

  // Determine urgency color
  const getUrgencyStyle = () => {
    if (estimation.minutes < 30) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: <Zap className="h-4 w-4" />,
      };
    } else if (estimation.minutes < 120) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: <Clock className="h-4 w-4" />,
      };
    } else {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: <Clock className="h-4 w-4" />,
      };
    }
  };

  const style = getUrgencyStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-1.5 ${style.bg} ${style.text} rounded-full text-sm font-medium border ${style.border} ${className}`}
    >
      {style.icon}
      <span>
        {estimation.text} remaining
        {estimation.remaining && estimation.remaining > 1 && (
          <span className="opacity-70 ml-1">({estimation.remaining} verdicts)</span>
        )}
      </span>
    </motion.div>
  );
}

// Progress timeline with estimated completion
export function ProgressTimeline({
  receivedCount,
  targetCount,
  createdAt,
  status,
  className = '',
}: EstimatedCompletionProps) {
  const progress = targetCount > 0 ? (receivedCount / targetCount) * 100 : 0;
  const isComplete = receivedCount >= targetCount || status === 'closed';

  const steps = useMemo(() => {
    const baseSteps = [
      {
        label: 'Submitted',
        complete: true,
        time: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        label: 'First Verdict',
        complete: receivedCount >= 1,
        time: receivedCount >= 1 ? 'Received' : 'Pending',
      },
    ];

    // Add midpoint for larger targets
    if (targetCount > 3) {
      baseSteps.push({
        label: 'Halfway',
        complete: receivedCount >= Math.ceil(targetCount / 2),
        time: receivedCount >= Math.ceil(targetCount / 2) ? 'Reached' : 'Pending',
      });
    }

    baseSteps.push({
      label: 'Complete',
      complete: isComplete,
      time: isComplete ? 'Done!' : `${targetCount - receivedCount} more`,
    });

    return baseSteps;
  }, [receivedCount, targetCount, createdAt, isComplete]);

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isComplete
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{receivedCount} received</span>
          <span>{targetCount} target</span>
        </div>
      </div>

      {/* Timeline steps */}
      <div className="flex items-start justify-between relative">
        {/* Connection line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-3 left-0 h-0.5 bg-indigo-500 transition-all duration-500"
          style={{
            width: `${((steps.filter((s) => s.complete).length - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-center z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.complete
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              {step.complete ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{idx + 1}</span>
              )}
            </motion.div>
            <div className="mt-2 text-center">
              <p
                className={`text-xs font-medium ${
                  step.complete ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-gray-400">{step.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
