'use client';

import { useState, useEffect } from 'react';
import { Check, Heart, Star, Zap, Trophy, Sparkles } from 'lucide-react';

// Confetti animation for celebrations
export function ConfettiAnimation({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti opacity-80"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          <div
            className={`w-2 h-2 ${
              ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][i % 6]
            } transform rotate-45`}
          />
        </div>
      ))}
    </div>
  );
}

// Floating hearts animation
export function FloatingHeart({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-50 animate-float-up"
      style={{ left: x - 10, top: y - 10 }}
    >
      <Heart className="w-5 h-5 text-red-500 fill-current" />
    </div>
  );
}

// Success checkmark animation
export function AnimatedCheck({ 
  visible, 
  size = 'medium',
  color = 'green' 
}: { 
  visible: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'green' | 'blue' | 'purple';
}) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500'
  };

  return (
    <div className={`${visible ? 'animate-bounce-in' : 'animate-bounce-out'} transition-all duration-300`}>
      <div className={`rounded-full bg-white shadow-lg p-2 border-2 border-current ${colorClasses[color]}`}>
        <Check className={`${sizeClasses[size]} ${colorClasses[color]} animate-draw-check`} />
      </div>
    </div>
  );
}

// Glowing button effect
export function GlowButton({ 
  children, 
  onClick, 
  className = '',
  variant = 'primary',
  disabled = false 
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const [isGlowing, setIsGlowing] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsGlowing(true);
    onClick();
    setTimeout(() => setIsGlowing(false), 600);
  };

  const baseClasses = `
    relative overflow-hidden transition-all duration-300 transform
    ${isGlowing ? 'scale-105 shadow-2xl' : 'hover:scale-102 hover:shadow-lg'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-indigo-600 to-purple-600 text-white
      ${isGlowing ? 'from-indigo-500 to-purple-500 shadow-purple-500/50' : ''}
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border
      ${isGlowing ? 'from-gray-50 to-gray-100 shadow-gray-500/50' : ''}
    `
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {/* Glow overlay */}
      <div className={`absolute inset-0 bg-white/20 transition-opacity duration-300 ${
        isGlowing ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Sparkle effect */}
      {isGlowing && (
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute animate-sparkle text-white/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                transform: `scale(${0.5 + Math.random() * 0.5})`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// Progressive rating animation
export function AnimatedRating({ 
  rating, 
  maxRating = 10,
  showAnimation = true 
}: { 
  rating: number;
  maxRating?: number;
  showAnimation?: boolean;
}) {
  const [animatedRating, setAnimatedRating] = useState(0);

  useEffect(() => {
    if (!showAnimation) {
      setAnimatedRating(rating);
      return;
    }

    let current = 0;
    const increment = rating / 20; // Animate over 20 steps
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= rating) {
        setAnimatedRating(rating);
        clearInterval(timer);
      } else {
        setAnimatedRating(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [rating, showAnimation]);

  const getColor = (value: number) => {
    if (value >= 8) return 'text-green-500';
    if (value >= 6) return 'text-yellow-500';
    if (value >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`text-3xl font-bold transition-colors duration-300 ${getColor(animatedRating)}`}>
        {animatedRating.toFixed(1)}
      </div>
      <div className="text-gray-400">/{maxRating}</div>
      
      {/* Visual bar */}
      <div className="flex-1 max-w-xs ml-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              animatedRating >= 8 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              animatedRating >= 6 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              animatedRating >= 4 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${(animatedRating / maxRating) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Pulse animation for loading states
export function PulseLoader({ 
  message = 'Loading...',
  icon: Icon = Zap,
  className = '' 
}: {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="animate-pulse-ring absolute inset-0 rounded-full border-4 border-indigo-400"></div>
        <div className="animate-pulse-ring absolute inset-0 rounded-full border-4 border-purple-400 animation-delay-75"></div>
        <div className="animate-pulse-ring absolute inset-0 rounded-full border-4 border-pink-400 animation-delay-150"></div>
        <div className="relative bg-white rounded-full p-4 shadow-lg">
          <Icon className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}

// Floating action button with bounce
export function FloatingActionButton({ 
  onClick,
  icon: Icon = Star,
  label,
  className = '' 
}: {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={() => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);
        onClick();
      }}
      className={`
        fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 
        text-white rounded-full p-4 shadow-lg hover:shadow-xl 
        transition-all duration-300 transform hover:scale-110 group
        ${isPressed ? 'scale-95' : ''}
        ${className}
      `}
    >
      <Icon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm 
                      rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                      whitespace-nowrap pointer-events-none">
        {label}
      </div>
    </button>
  );
}

// Styles component to add custom animations
export function MicroInteractionStyles() {
  return (
    <style jsx global>{`
      @keyframes confetti {
        0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      
      @keyframes float-up {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
      }
      
      @keyframes bounce-in {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(-90deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      
      @keyframes bounce-out {
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        100% { transform: scale(0) rotate(180deg); opacity: 0; }
      }
      
      @keyframes draw-check {
        0% { stroke-dasharray: 0, 100; }
        100% { stroke-dasharray: 100, 0; }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      
      .animate-confetti { animation: confetti linear; }
      .animate-float-up { animation: float-up 2s ease-out forwards; }
      .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; }
      .animate-bounce-out { animation: bounce-out 0.4s ease-in forwards; }
      .animate-draw-check { stroke-dasharray: 100; animation: draw-check 0.6s ease-out forwards; }
      .animate-sparkle { animation: sparkle 0.6s ease-out; }
      .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
      
      .animation-delay-75 { animation-delay: 0.075s; }
      .animation-delay-150 { animation-delay: 0.15s; }
      
      .hover\\:scale-102:hover { transform: scale(1.02); }
    `}</style>
  );
}