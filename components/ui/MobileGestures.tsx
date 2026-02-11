'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { RefreshCw, X, ChevronDown } from 'lucide-react';

// ============================================
// Haptic Feedback
// ============================================

export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(25), [vibrate]);
  const heavyTap = useCallback(() => vibrate(50), [vibrate]);
  const success = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 100, 50]), [vibrate]);
  const warning = useCallback(() => vibrate([30, 50, 30]), [vibrate]);

  return { vibrate, lightTap, mediumTap, heavyTap, success, error, warning };
}

// ============================================
// Swipe to Dismiss
// ============================================

interface SwipeToDismissProps {
  children: React.ReactNode;
  onDismiss: () => void;
  direction?: 'left' | 'right' | 'both';
  threshold?: number;
  className?: string;
  backgroundContent?: React.ReactNode;
  disabled?: boolean;
}

export function SwipeToDismiss({
  children,
  onDismiss,
  direction = 'right',
  threshold = 100,
  className = '',
  backgroundContent,
  disabled = false,
}: SwipeToDismissProps) {
  const x = useMotionValue(0);
  const { lightTap, success } = useHaptics();
  const [isDragging, setIsDragging] = useState(false);

  // Background opacity based on drag distance
  const backgroundOpacity = useTransform(x, [-threshold, 0, threshold], [1, 0, 1]);

  // Scale effect
  const scale = useTransform(x, [-threshold, 0, threshold], [0.95, 1, 0.95]);

  const handleDragStart = () => {
    setIsDragging(true);
    lightTap();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const shouldDismiss =
      (direction === 'right' && info.offset.x > threshold) ||
      (direction === 'left' && info.offset.x < -threshold) ||
      (direction === 'both' && Math.abs(info.offset.x) > threshold);

    if (shouldDismiss) {
      success();
      const exitX = info.offset.x > 0 ? window.innerWidth : -window.innerWidth;
      animate(x, exitX, { duration: 0.2 });
      setTimeout(onDismiss, 200);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  const dragConstraints =
    direction === 'left'
      ? { left: -threshold * 2, right: 0 }
      : direction === 'right'
      ? { left: 0, right: threshold * 2 }
      : { left: -threshold * 2, right: threshold * 2 };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background action indicator */}
      <motion.div
        style={{ opacity: backgroundOpacity }}
        className="absolute inset-0 flex items-center justify-end px-6 bg-red-500"
      >
        {backgroundContent || <X className="w-6 h-6 text-white" />}
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        style={{ x, scale }}
        drag={disabled ? false : 'x'}
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="relative bg-white dark:bg-gray-800"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// Pull to Refresh
// ============================================

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const { lightTap, success } = useHaptics();

  const canPull = useCallback(() => {
    if (!containerRef.current || disabled) return false;
    return containerRef.current.scrollTop === 0;
  }, [disabled]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull()) return;
    startY.current = e.touches[0].clientY;
  }, [canPull]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull() || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Exponential decay for natural feel
      const newDistance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(newDistance);

      // Haptic at threshold
      if (pullDistance < threshold && newDistance >= threshold) {
        lightTap();
      }
    }
  }, [canPull, isRefreshing, threshold, pullDistance, lightTap]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      success();

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, success]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div
        initial={false}
        animate={{
          height: isRefreshing ? 60 : pullDistance,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900"
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : rotation }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          <RefreshCw
            className={`w-6 h-6 ${
              progress >= 1 || isRefreshing
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400'
            }`}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: isRefreshing ? 0 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// Bottom Sheet
// ============================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  defaultSnap = 0,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const { lightTap } = useHaptics();
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);

  const sheetHeight = typeof window !== 'undefined' ? window.innerHeight * snapPoints[currentSnap] : 400;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Swipe down to close
    if (offset > 100 || velocity > 500) {
      onClose();
      return;
    }

    // Snap to next point
    if (velocity < -500 && currentSnap < snapPoints.length - 1) {
      lightTap();
      setCurrentSnap(prev => prev + 1);
    } else if (velocity > 200 && currentSnap > 0) {
      lightTap();
      setCurrentSnap(prev => prev - 1);
    }

    animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0, height: sheetHeight }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-auto p-4" style={{ maxHeight: sheetHeight - 80 }}>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// Long Press Handler
// ============================================

interface LongPressProps {
  onLongPress: () => void;
  onPress?: () => void;
  duration?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function LongPress({
  onLongPress,
  onPress,
  duration = 500,
  children,
  className = '',
  disabled = false,
}: LongPressProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const { mediumTap } = useHaptics();

  const start = useCallback(() => {
    if (disabled) return;
    isLongPress.current = false;

    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      mediumTap();
      onLongPress();
    }, duration);
  }, [disabled, duration, onLongPress, mediumTap]);

  const stop = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isLongPress.current && onPress) {
      onPress();
    }
  }, [onPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return (
    <div
      onTouchStart={start}
      onTouchEnd={stop}
      onTouchCancel={cancel}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={cancel}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================
// Swipeable Card Stack
// ============================================

interface SwipeableCardProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  className?: string;
}

export function SwipeableCardStack<T>({
  items,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}: SwipeableCardProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { success } = useHaptics();

  const handleSwipe = (direction: 'left' | 'right') => {
    const item = items[currentIndex];
    if (!item) return;

    success();

    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft(item);
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight(item);
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (currentIndex >= items.length) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        No more items
      </div>
    );
  }

  return (
    <div className={`relative h-96 ${className}`}>
      {items.slice(currentIndex, currentIndex + 3).map((item, stackIndex) => {
        const isTop = stackIndex === 0;

        return (
          <SwipeCard
            key={currentIndex + stackIndex}
            isTop={isTop}
            stackIndex={stackIndex}
            onSwipeLeft={() => handleSwipe('left')}
            onSwipeRight={() => handleSwipe('right')}
          >
            {renderCard(item, currentIndex + stackIndex)}
          </SwipeCard>
        );
      })}
    </div>
  );
}

function SwipeCard({
  children,
  isTop,
  stackIndex,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  isTop: boolean;
  stackIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      animate(x, 500, { duration: 0.2 });
      setTimeout(onSwipeRight, 200);
    } else if (info.offset.x < -100) {
      animate(x, -500, { duration: 0.2 });
      setTimeout(onSwipeLeft, 200);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        scale: 1 - stackIndex * 0.05,
        y: stackIndex * 10,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={isTop ? handleDragEnd : undefined}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Gesture Hint
// ============================================

export function GestureHint({
  gesture,
  label,
  visible,
  position = 'bottom',
}: {
  gesture: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pull-down' | 'tap';
  label: string;
  visible: boolean;
  position?: 'top' | 'bottom' | 'center';
}) {
  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  const gestureAnimations = {
    'swipe-left': { x: [0, -20, 0] },
    'swipe-right': { x: [0, 20, 0] },
    'swipe-up': { y: [0, -20, 0] },
    'swipe-down': { y: [0, 20, 0] },
    'pull-down': { y: [0, 10, 0] },
    'tap': { scale: [1, 0.9, 1] },
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed ${positionClasses[position]} z-50 flex items-center gap-2 px-4 py-2 bg-black/80 text-white rounded-full`}
    >
      <motion.div
        animate={gestureAnimations[gesture]}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <ChevronDown
          className={`w-5 h-5 ${
            gesture === 'swipe-left' ? 'rotate-90' :
            gesture === 'swipe-right' ? '-rotate-90' :
            gesture === 'swipe-up' ? 'rotate-180' :
            ''
          }`}
        />
      </motion.div>
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
}
