'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Heart,
  Star,
  Zap,
  CheckCircle,
  Copy,
  Download,
  Share2,
  Bookmark,
  ThumbsUp,
  Award,
  Sparkles,
  Trophy,
  Crown,
  Target,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react';

// Floating Action Button with Magnetic Effect
export function MagneticButton({ 
  children, 
  onClick, 
  className = "", 
  disabled = false 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x);
  const springY = useSpring(y);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic effect - stronger when closer
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const maxDistance = 100;
    
    if (distance < maxDistance) {
      const strength = (maxDistance - distance) / maxDistance;
      x.set(distanceX * strength * 0.3);
      y.set(distanceY * strength * 0.3);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      className={`relative transform transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      {children}
    </motion.button>
  );
}

// Pulse Effect for Important Elements
export function PulseElement({ 
  children, 
  intensity = 'medium',
  color = 'blue' 
}: {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const pulseScale = {
    low: [1, 1.02, 1],
    medium: [1, 1.05, 1],
    high: [1, 1.1, 1]
  }[intensity];

  const shadowColors = {
    blue: 'rgba(59, 130, 246, 0.3)',
    green: 'rgba(34, 197, 94, 0.3)',
    purple: 'rgba(147, 51, 234, 0.3)',
    orange: 'rgba(249, 115, 22, 0.3)',
    red: 'rgba(239, 68, 68, 0.3)'
  };

  return (
    <motion.div
      animate={{
        scale: pulseScale,
        boxShadow: [
          `0 0 0 0 ${shadowColors[color]}`,
          `0 0 0 10px ${shadowColors[color]}`,
          `0 0 0 20px rgba(59, 130, 246, 0)`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      {children}
    </motion.div>
  );
}

// Floating Hearts Animation for Success
export function FloatingHearts({ trigger }: { trigger: boolean }) {
  const [hearts, setHearts] = useState<Array<{ id: number; delay: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        delay: i * 0.1
      }));
      setHearts(newHearts);

      const timer = setTimeout(() => {
        setHearts([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              opacity: 0, 
              scale: 0, 
              x: '50%', 
              y: '50%',
              rotate: 0 
            }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1.2, 0.8], 
              y: [0, -100, -200],
              x: [0, Math.random() * 40 - 20, Math.random() * 80 - 40],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2, 
              delay: heart.delay,
              ease: "easeOut"
            }}
            className="absolute text-red-500"
          >
            <Heart className="h-6 w-6 fill-current" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Confetti Burst for Achievements
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    color: string;
    angle: number;
    velocity: number;
    size: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: (360 / 20) * i,
        velocity: 150 + Math.random() * 100,
        size: 4 + Math.random() * 4
      }));
      
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const radian = (particle.angle * Math.PI) / 180;
          const deltaX = Math.cos(radian) * particle.velocity;
          const deltaY = Math.sin(radian) * particle.velocity;

          return (
            <motion.div
              key={particle.id}
              initial={{ 
                opacity: 1, 
                x: 0, 
                y: 0, 
                scale: 1,
                rotate: 0 
              }}
              animate={{ 
                opacity: [1, 1, 0],
                x: deltaX,
                y: deltaY,
                scale: [1, 0.8, 0],
                rotate: [0, 720]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2,
                ease: "easeOut"
              }}
              className="absolute left-1/2 top-1/2"
              style={{
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
                borderRadius: '50%'
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Shimmer Loading Effect
export function ShimmerLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer ${className}`} />
  );
}

// Progress Ring with Animation
export function AnimatedProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = '#3b82f6',
  showLabel = true,
  label = '',
  className = ''
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="filter drop-shadow-sm"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{Math.round(progress)}%</div>
            {label && <div className="text-xs text-gray-600">{label}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Bounce Counter for Stats
export function BounceCounter({ 
  value, 
  duration = 1000,
  className = ""
}: { 
  value: number; 
  duration?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={className}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
}

// Typewriter Effect
export function TypewriterText({ 
  text, 
  speed = 50,
  className = "",
  onComplete
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="ml-1"
      >
        |
      </motion.span>
    </span>
  );
}

// Toast Notification with Animation
export function AnimatedToast({ 
  message, 
  type = 'success', 
  visible,
  onClose
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onClose: () => void;
}) {
  const icons = {
    success: CheckCircle,
    error: Target,
    warning: Clock,
    info: Sparkles
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px]"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colors[type]}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-gray-900 font-medium">{message}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Button with Ripple Effect
export function RippleButton({ 
  children, 
  onClick,
  className = "",
  disabled = false
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    if (onClick) onClick();
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      <div className="absolute inset-0">
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute bg-white/30 rounded-full"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </button>
  );
}

// Floating Badge with Bounce
export function FloatingBadge({ 
  children, 
  visible = true,
  color = 'red',
  bounce = true
}: {
  children: React.ReactNode;
  visible?: boolean;
  color?: 'red' | 'green' | 'blue' | 'purple' | 'orange';
  bounce?: boolean;
}) {
  const colorClasses = {
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white'
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: bounce ? [0, -5, 0] : 0
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 25,
            y: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
          className={`absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${colorClasses[color]}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton Loader with Shimmer
export function SkeletonLoader({ 
  width = '100%', 
  height = '20px',
  className = '',
  variant = 'rectangular'
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]";
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}