'use client';

import { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  pieces?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
];

export function Confetti({
  active,
  duration = 3000,
  pieces = 50,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiProps) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const generateConfetti = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < pieces; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100, // percentage
        y: -10 - Math.random() * 20, // start above viewport
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: 2 + Math.random() * 3,
        },
      });
    }
    return newPieces;
  }, [pieces, colors]);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      setConfettiPieces(generateConfetti());

      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
        setConfettiPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, generateConfetti, onComplete]);

  if (!isVisible || confettiPieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: '2px',
            animationDuration: `${2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Sound effect utility
export function playSuccessSound() {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
  }

  try {
    // Create a simple success chime using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // Play a pleasant ascending arpeggio
    playTone(523.25, now, 0.15);      // C5
    playTone(659.25, now + 0.1, 0.15); // E5
    playTone(783.99, now + 0.2, 0.2);  // G5
  } catch (e) {
    // Audio not supported, fail silently
  }
}

// Haptic feedback utility
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [30],
    success: [50, 30, 50],
    error: [100, 50, 100],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch (e) {
    // Vibration not supported
  }
}
