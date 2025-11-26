import * as React from "react"
import { cn } from '@/lib/utils';

// Animation configuration constants
export const ANIMATION_CONFIG = {
  duration: {
    fast: 150,
    normal: 200, 
    slow: 300,
    slower: 500
  },
  easing: {
    default: 'ease-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }
} as const;

// Fade in animation component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: keyof typeof ANIMATION_CONFIG.duration;
  className?: string;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 'normal', 
  className 
}: FadeInProps) {
  return (
    <div 
      className={cn("animate-fade-in", className)}
      style={{
        '--animation-delay': `${delay}ms`,
        '--animation-duration': `${ANIMATION_CONFIG.duration[duration]}ms`
      } as React.CSSProperties}
    >
      {children}
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in var(--animation-duration, 200ms) var(--animation-delay, 0ms) ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// Scale in animation for modals, cards
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: keyof typeof ANIMATION_CONFIG.duration;
  className?: string;
}

export function ScaleIn({ 
  children, 
  delay = 0, 
  duration = 'normal', 
  className 
}: ScaleInProps) {
  return (
    <div 
      className={cn("animate-scale-in", className)}
      style={{
        '--animation-delay': `${delay}ms`,
        '--animation-duration': `${ANIMATION_CONFIG.duration[duration]}ms`
      } as React.CSSProperties}
    >
      {children}
      
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in var(--animation-duration, 200ms) var(--animation-delay, 0ms) ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// Slide in animation for sidebars, drawers
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: keyof typeof ANIMATION_CONFIG.duration;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction = 'left',
  delay = 0, 
  duration = 'normal', 
  className 
}: SlideInProps) {
  const getTransform = () => {
    switch (direction) {
      case 'left': return 'translateX(-20px)';
      case 'right': return 'translateX(20px)';
      case 'up': return 'translateY(-20px)';
      case 'down': return 'translateY(20px)';
    }
  };

  return (
    <div 
      className={cn("animate-slide-in", className)}
      style={{
        '--animation-delay': `${delay}ms`,
        '--animation-duration': `${ANIMATION_CONFIG.duration[duration]}ms`,
        '--initial-transform': getTransform()
      } as React.CSSProperties}
    >
      {children}
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: var(--initial-transform);
          }
          to {
            opacity: 1;
            transform: translate(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in var(--animation-duration, 200ms) var(--animation-delay, 0ms) ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// Staggered animation for lists
interface StaggeredAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: keyof typeof ANIMATION_CONFIG.duration;
  animation?: 'fade' | 'slide' | 'scale';
  className?: string;
}

export function StaggeredAnimation({ 
  children, 
  staggerDelay = 50,
  duration = 'normal',
  animation = 'fade',
  className 
}: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        const delay = index * staggerDelay;
        
        switch (animation) {
          case 'slide':
            return <SlideIn delay={delay} duration={duration}>{child}</SlideIn>;
          case 'scale':
            return <ScaleIn delay={delay} duration={duration}>{child}</ScaleIn>;
          default:
            return <FadeIn delay={delay} duration={duration}>{child}</FadeIn>;
        }
      })}
    </div>
  );
}

// Interactive hover animations
interface HoverLiftProps {
  children: React.ReactNode;
  lift?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HoverLift({ children, lift = 'sm', className }: HoverLiftProps) {
  const liftClasses = {
    sm: 'hover:-translate-y-0.5 hover:shadow-md',
    md: 'hover:-translate-y-1 hover:shadow-lg', 
    lg: 'hover:-translate-y-2 hover:shadow-xl'
  };

  return (
    <div className={cn(
      "transition-all duration-200 ease-out",
      liftClasses[lift],
      className
    )}>
      {children}
    </div>
  );
}

// Loading shimmer animation
interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Pulse animation for notifications
interface PulseProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  className?: string;
}

export function Pulse({ children, color = 'blue', className }: PulseProps) {
  const colorClasses = {
    blue: 'animate-pulse-blue',
    green: 'animate-pulse-green',
    red: 'animate-pulse-red',
    yellow: 'animate-pulse-yellow',
    purple: 'animate-pulse-purple'
  };

  const colorValues = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6'
  };

  return (
    <div className={cn("relative", colorClasses[color], className)}>
      {children}
      
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .${colorClasses[color]}::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${colorValues[color]};
          transform: translate(-50%, -50%);
          animation: pulse-ring 1.5s ease-out infinite;
          z-index: -1;
        }
      `}</style>
    </div>
  );
}

// Progress animation
interface ProgressBarProps {
  progress: number;
  duration?: number;
  color?: 'blue' | 'green' | 'purple' | 'indigo';
  className?: string;
}

export function ProgressBar({ 
  progress, 
  duration = 500, 
  color = 'indigo',
  className 
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress]);

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-600'
  };

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div 
        className={cn("h-full rounded-full transition-all ease-out", colorClasses[color])}
        style={{ 
          width: `${animatedProgress}%`,
          transitionDuration: `${duration}ms`
        }}
      />
    </div>
  );
}

// Count up animation for numbers
interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ 
  end, 
  start = 0, 
  duration = 1000,
  prefix = '',
  suffix = '',
  className 
}: CountUpProps) {
  const [count, setCount] = React.useState(start);
  const frameRate = 60;
  const totalFrames = Math.round(duration / (1000 / frameRate));
  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

  React.useEffect(() => {
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = easeOutQuart(frame / totalFrames);
      setCount(Math.round(start + (end - start) * progress));

      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, 1000 / frameRate);

    return () => clearInterval(counter);
  }, [end, start, totalFrames]);

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Typing animation for text
interface TypewriterProps {
  text: string;
  speed?: number;
  cursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function Typewriter({ 
  text, 
  speed = 100,
  cursor = true, 
  onComplete,
  className 
}: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <FadeIn duration="normal" className={className}>
      {children}
    </FadeIn>
  );
}

// Export animation utilities
export const animationUtils = {
  // Create staggered delays for arrays
  createStaggeredDelay: (index: number, baseDelay = 50) => index * baseDelay,
  
  // Animation sequence helper
  sequence: (animations: (() => Promise<void>)[], delay = 200) => {
    return animations.reduce((promise, animation, index) => {
      return promise.then(() => {
        return new Promise(resolve => {
          setTimeout(async () => {
            await animation();
            resolve(undefined);
          }, index * delay);
        });
      });
    }, Promise.resolve());
  },
  
  // Viewport intersection observer for scroll animations
  useScrollAnimation: (threshold = 0.1) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [threshold]);

    return { ref, isVisible };
  }
};