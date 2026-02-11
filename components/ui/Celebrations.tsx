'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Zap,
  Crown,
  Award,
  Target,
  TrendingUp,
  Gift,
  Sparkles,
  PartyPopper,
  Medal,
  Rocket,
  Heart,
  CheckCircle,
  X,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type MilestoneType =
  | 'first_request'
  | 'first_verdict'
  | 'first_payout'
  | 'judge_tier_up'
  | 'streak_7'
  | 'streak_30'
  | 'verdicts_10'
  | 'verdicts_50'
  | 'verdicts_100'
  | 'quality_rating'
  | 'profile_complete'
  | 'custom';

interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  icon: React.ReactNode;
  confettiColors?: string[];
  celebrationType?: 'confetti' | 'fireworks' | 'stars' | 'hearts';
}

interface CelebrationContextType {
  celebrate: (milestone: Milestone) => void;
  showProgress: (current: number, total: number, label: string) => void;
  hideProgress: () => void;
}

// ============================================
// Context
// ============================================

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    return {
      celebrate: () => {},
      showProgress: () => {},
      hideProgress: () => {},
    };
  }
  return context;
}

// ============================================
// Predefined Milestones
// ============================================

export const MILESTONES: Record<string, Omit<Milestone, 'id'>> = {
  first_request: {
    type: 'first_request',
    title: 'First Request!',
    description: 'You submitted your first request for feedback',
    icon: <Rocket className="w-8 h-8" />,
    celebrationType: 'confetti',
  },
  first_verdict: {
    type: 'first_verdict',
    title: 'First Verdict!',
    description: 'You gave your first verdict and earned credits',
    icon: <Trophy className="w-8 h-8" />,
    celebrationType: 'confetti',
  },
  first_payout: {
    type: 'first_payout',
    title: 'First Payout!',
    description: 'Congratulations on your first earnings payout',
    icon: <Gift className="w-8 h-8" />,
    confettiColors: ['#22c55e', '#10b981', '#059669', '#047857'],
    celebrationType: 'fireworks',
  },
  judge_tier_up: {
    type: 'judge_tier_up',
    title: 'Level Up!',
    description: 'You reached a new judge tier',
    icon: <Crown className="w-8 h-8" />,
    confettiColors: ['#8b5cf6', '#a855f7', '#c084fc', '#e879f9'],
    celebrationType: 'fireworks',
  },
  streak_7: {
    type: 'streak_7',
    title: '7-Day Streak!',
    description: 'You judged every day for a week',
    icon: <Zap className="w-8 h-8" />,
    celebrationType: 'stars',
  },
  streak_30: {
    type: 'streak_30',
    title: '30-Day Streak!',
    description: 'Incredible! A full month of daily judging',
    icon: <Star className="w-8 h-8" />,
    confettiColors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
    celebrationType: 'fireworks',
  },
  verdicts_10: {
    type: 'verdicts_10',
    title: '10 Verdicts!',
    description: 'You helped 10 people with their decisions',
    icon: <Target className="w-8 h-8" />,
    celebrationType: 'confetti',
  },
  verdicts_50: {
    type: 'verdicts_50',
    title: '50 Verdicts!',
    description: 'Half a century of helpful verdicts',
    icon: <Award className="w-8 h-8" />,
    celebrationType: 'confetti',
  },
  verdicts_100: {
    type: 'verdicts_100',
    title: 'Century Club!',
    description: '100 verdicts delivered. You\'re a legend!',
    icon: <Medal className="w-8 h-8" />,
    confettiColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    celebrationType: 'fireworks',
  },
  quality_rating: {
    type: 'quality_rating',
    title: 'Quality Star!',
    description: 'Your average rating exceeded 4.5 stars',
    icon: <Sparkles className="w-8 h-8" />,
    celebrationType: 'stars',
  },
  profile_complete: {
    type: 'profile_complete',
    title: 'Profile Complete!',
    description: 'Your profile is all set up',
    icon: <CheckCircle className="w-8 h-8" />,
    celebrationType: 'confetti',
  },
};

// ============================================
// Confetti Component
// ============================================

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  scale: number;
  shape: 'square' | 'circle' | 'triangle';
}

function FullScreenConfetti({
  colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  duration = 4000,
  onComplete,
}: {
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
}) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = [];
    const shapes: ConfettiPiece['shape'][] = ['square', 'circle', 'triangle'];

    for (let i = 0; i < 150; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.5 + Math.random() * 0.5,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [colors, duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: `${piece.y}vh`,
            rotate: piece.rotation,
            scale: piece.scale,
          }}
          animate={{
            y: '110vh',
            rotate: piece.rotation + 720,
            x: `${piece.x + (Math.random() - 0.5) * 20}vw`,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            ease: 'linear',
            delay: Math.random() * 0.5,
          }}
          className="absolute"
          style={{
            backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
            borderColor: piece.shape === 'triangle' ? piece.color : 'transparent',
            width: piece.shape === 'triangle' ? 0 : 10,
            height: piece.shape === 'triangle' ? 0 : piece.shape === 'square' ? 10 : 10,
            borderRadius: piece.shape === 'circle' ? '50%' : 0,
            borderLeft: piece.shape === 'triangle' ? '5px solid transparent' : 'none',
            borderRight: piece.shape === 'triangle' ? '5px solid transparent' : 'none',
            borderBottom: piece.shape === 'triangle' ? `10px solid ${piece.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Fireworks Component
// ============================================

function Fireworks({
  colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
  onComplete,
}: {
  colors?: string[];
  onComplete?: () => void;
}) {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    const createBurst = (delay: number) => {
      setTimeout(() => {
        const newBurst = {
          id: Date.now() + Math.random(),
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
        setBursts(prev => [...prev, newBurst]);

        setTimeout(() => {
          setBursts(prev => prev.filter(b => b.id !== newBurst.id));
        }, 1500);
      }, delay);
    };

    // Create multiple bursts
    createBurst(0);
    createBurst(300);
    createBurst(600);
    createBurst(900);
    createBurst(1200);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [colors, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: 1,
                opacity: 0,
                x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                y: Math.sin((i * 30 * Math.PI) / 180) * 100,
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: burst.color }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Floating Stars Component
// ============================================

function FloatingStars({ onComplete }: { onComplete?: () => void }) {
  const [stars, setStars] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setStars(newStars);

    const timer = setTimeout(() => {
      setStars([]);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ y: '100vh', x: `${star.x}vw`, opacity: 0, scale: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.5,
            delay: star.delay,
            ease: 'easeOut',
          }}
          className="absolute text-yellow-400"
        >
          <Star className="w-6 h-6 fill-current" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// Celebration Modal
// ============================================

function CelebrationModal({
  milestone,
  onClose,
}: {
  milestone: Milestone;
  onClose: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(true);

  // Trigger haptic feedback if available
  useEffect(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  const celebrationComponent = {
    confetti: <FullScreenConfetti colors={milestone.confettiColors} onComplete={() => setShowConfetti(false)} />,
    fireworks: <Fireworks colors={milestone.confettiColors} onComplete={() => setShowConfetti(false)} />,
    stars: <FloatingStars onComplete={() => setShowConfetti(false)} />,
    hearts: <FloatingStars onComplete={() => setShowConfetti(false)} />,
  };

  return (
    <>
      {showConfetti && celebrationComponent[milestone.celebrationType || 'confetti']}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg"
          >
            {milestone.icon}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {milestone.title}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-300 mb-6"
          >
            {milestone.description}
          </motion.p>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Awesome!
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}

// ============================================
// Progress Momentum Component
// ============================================

function ProgressMomentum({
  current,
  total,
  label,
  onClose,
}: {
  current: number;
  total: number;
  label: string;
  onClose: () => void;
}) {
  const percentage = Math.min(100, Math.round((current / total) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-24 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-72"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {current} of {total} complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
        />
      </div>

      <p className="text-right mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
        {percentage}%
      </p>
    </motion.div>
  );
}

// ============================================
// Celebration Provider
// ============================================

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [progressInfo, setProgressInfo] = useState<{
    current: number;
    total: number;
    label: string;
  } | null>(null);

  const celebrate = useCallback((milestone: Milestone) => {
    setActiveMilestone(milestone);
  }, []);

  const showProgress = useCallback((current: number, total: number, label: string) => {
    setProgressInfo({ current, total, label });
  }, []);

  const hideProgress = useCallback(() => {
    setProgressInfo(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, showProgress, hideProgress }}>
      {children}

      <AnimatePresence>
        {activeMilestone && (
          <CelebrationModal
            milestone={activeMilestone}
            onClose={() => setActiveMilestone(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {progressInfo && (
          <ProgressMomentum
            current={progressInfo.current}
            total={progressInfo.total}
            label={progressInfo.label}
            onClose={hideProgress}
          />
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
}

// ============================================
// Feature Discovery Tooltip
// ============================================

export function FeatureTooltip({
  id,
  title,
  description,
  position = 'bottom',
  children,
  showOnce = true,
}: {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  showOnce?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (showOnce) {
      const dismissed = localStorage.getItem(`tooltip_${id}_dismissed`);
      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    }

    // Show tooltip after a short delay on first render
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id, showOnce]);

  const dismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (showOnce) {
      localStorage.setItem(`tooltip_${id}_dismissed`, 'true');
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-indigo-600 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-indigo-600 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-indigo-600 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-indigo-600 border-y-transparent border-l-transparent',
  };

  if (isDismissed) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 ${positionClasses[position]}`}
          >
            <div className="bg-indigo-600 text-white rounded-xl p-3 shadow-lg max-w-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">{description}</p>
                </div>
                <button
                  onClick={dismiss}
                  className="p-0.5 hover:bg-indigo-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={`absolute border-4 ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Helper Hook for Milestone Checking
// ============================================

export function useMilestoneTracker() {
  const { celebrate } = useCelebration();

  const checkAndCelebrate = useCallback((
    type: keyof typeof MILESTONES,
    customData?: Partial<Milestone>
  ) => {
    const milestoneKey = `milestone_${type}_achieved`;

    // Check if already achieved
    if (localStorage.getItem(milestoneKey)) {
      return false;
    }

    // Mark as achieved
    localStorage.setItem(milestoneKey, new Date().toISOString());

    // Trigger celebration
    const milestone = MILESTONES[type];
    if (milestone) {
      celebrate({
        id: type,
        ...milestone,
        ...customData,
      });
      return true;
    }

    return false;
  }, [celebrate]);

  const resetMilestone = useCallback((type: string) => {
    localStorage.removeItem(`milestone_${type}_achieved`);
  }, []);

  const hasMilestone = useCallback((type: string) => {
    return !!localStorage.getItem(`milestone_${type}_achieved`);
  }, []);

  return { checkAndCelebrate, resetMilestone, hasMilestone };
}
