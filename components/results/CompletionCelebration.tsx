'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Share2,
  MessageSquare,
  X,
} from 'lucide-react';

interface CompletionCelebrationProps {
  isComplete: boolean;
  verdictCount: number;
  averageRating: number;
  category: string;
  requestId: string;
  onShare?: () => void;
  autoShow?: boolean;
}

export function CompletionCelebration({
  isComplete,
  verdictCount,
  averageRating,
  category,
  requestId,
  onShare,
  autoShow = true,
}: CompletionCelebrationProps) {
  // Initialize state based on localStorage check (only on mount)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isComplete || !autoShow) return false;
    const celebrationKey = `celebration_shown_${requestId}`;
    const alreadyShown = localStorage.getItem(celebrationKey);
    if (!alreadyShown) {
      localStorage.setItem(celebrationKey, 'true');
      return true;
    }
    return false;
  });

  const [showConfetti, setShowConfetti] = useState(isVisible);

  // Handle confetti timeout and haptic feedback
  useEffect(() => {
    if (isVisible && showConfetti) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

      // Stop confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showConfetti]);

  const getMessage = () => {
    if (averageRating >= 8) {
      return {
        title: 'Amazing Results!',
        subtitle: 'The judges loved what you shared',
        emoji: '🎉',
        color: 'from-green-500 to-emerald-600',
      };
    } else if (averageRating >= 6) {
      return {
        title: 'Results Are In!',
        subtitle: 'Mixed feedback with valuable insights',
        emoji: '💡',
        color: 'from-blue-500 to-indigo-600',
      };
    } else {
      return {
        title: 'Feedback Received',
        subtitle: 'Time to iterate and improve',
        emoji: '🔄',
        color: 'from-amber-500 to-orange-600',
      };
    }
  };

  const message = getMessage();

  if (!isComplete) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti overlay */}
          {showConfetti && <ConfettiExplosion />}

          {/* Celebration modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${message.color} p-8 text-white text-center relative`}>
                <button
                  onClick={() => setIsVisible(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-6xl mb-4"
                >
                  {message.emoji}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  {message.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90"
                >
                  {message.subtitle}
                </motion.p>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="text-2xl font-bold text-indigo-600">{verdictCount}</div>
                    <div className="text-xs text-gray-500">Verdicts</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="text-2xl font-bold text-amber-600">{averageRating.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Avg Rating</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="text-2xl font-bold text-green-600 capitalize">{category}</div>
                    <div className="text-xs text-gray-500">Category</div>
                  </motion.div>
                </div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      // Scroll to verdicts
                      const el = document.getElementById('verdicts-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    View Your Feedback
                  </button>

                  {onShare && averageRating >= 6 && (
                    <button
                      onClick={() => {
                        setIsVisible(false);
                        onShare();
                      }}
                      className="w-full py-3 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      Share Your Results
                    </button>
                  )}

                  <button
                    onClick={() => setIsVisible(false)}
                    className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition"
                  >
                    Dismiss
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Simple confetti explosion component
function ConfettiExplosion() {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Pre-compute random values in state to avoid impure render
  const [pieces] = useState(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      xOffset: (Math.random() - 0.5) * 20,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 0.5,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
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
            x: `${piece.x + piece.xOffset}vw`,
          }}
          transition={{
            duration: piece.duration,
            ease: 'linear',
            delay: piece.delay,
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: piece.color }}
        />
      ))}
    </div>
  );
}

// Inline mini celebration for completed requests in lists
export function MiniCompletionBadge({ averageRating }: { averageRating: number }) {
  if (averageRating < 7) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
    >
      <Sparkles className="h-3 w-3" />
      Great results!
    </motion.div>
  );
}
