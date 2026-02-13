'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MessageSquare, Star, Camera, Briefcase, Heart, Shirt, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'verdict' | 'submit' | 'result';
  category: string;
  timeAgo: string;
  icon: string;
}

// Anonymized activity examples (not real-time data)
const ACTIVITY_TEMPLATES = [
  { type: 'verdict', category: 'dating profile', icon: '💕', message: 'Someone just got 3 verdicts on their dating photo' },
  { type: 'submit', category: 'career decision', icon: '💼', message: 'New career advice request submitted' },
  { type: 'result', category: 'style check', icon: '👔', message: 'Interview outfit rated 9.2/10' },
  { type: 'verdict', category: 'pitch deck', icon: '💡', message: 'Startup pitch received detailed feedback' },
  { type: 'submit', category: 'email review', icon: '✉️', message: 'Professional email submitted for review' },
  { type: 'result', category: 'dating profile', icon: '💕', message: 'Profile photo improved based on feedback' },
  { type: 'verdict', category: 'resume', icon: '📄', message: '3 experts reviewed a resume' },
  { type: 'submit', category: 'outfit check', icon: '👗', message: 'Date night outfit submitted' }
];

interface LiveActivityFeedProps {
  variant?: 'inline' | 'floating' | 'banner';
  className?: string;
}

export function LiveActivityFeed({ variant = 'inline', className }: LiveActivityFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activities, setActivities] = useState<typeof ACTIVITY_TEMPLATES>([]);

  // Initialize with shuffled activities
  useEffect(() => {
    const shuffled = [...ACTIVITY_TEMPLATES].sort(() => Math.random() - 0.5);
    setActivities(shuffled);
  }, []);

  // Rotate through activities
  useEffect(() => {
    if (activities.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const currentActivity = activities[currentIndex];

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "fixed bottom-24 left-4 z-40 max-w-[280px]",
          "bg-white rounded-xl shadow-lg border border-gray-200 p-3",
          "hidden md:block", // Only show on larger screens
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3"
          >
            <div className="text-2xl">{currentActivity.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-tight">
                {currentActivity.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">Just now</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0 mt-1" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
        "text-white py-2 px-4 overflow-hidden",
        className
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm font-medium">Live</span>
          </div>

          <div className="relative h-6 overflow-hidden flex-1 max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center gap-2"
              >
                <span className="text-lg">{currentActivity.icon}</span>
                <span className="text-sm truncate">{currentActivity.message}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1">
            {activities.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex % 5
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-4",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-gray-700">Recent activity</span>
      </div>

      <div className="space-y-3">
        {activities.slice(0, 4).map((activity, index) => (
          <motion.div
            key={`${activity.type}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              index === 0 && "bg-indigo-50"
            )}
          >
            <span className="text-xl">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{activity.message}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {index === 0 ? 'Just now' : `${(index + 1) * 2}m ago`}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default LiveActivityFeed;
