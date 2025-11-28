'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LogoProps {
  variant?: 'default' | 'minimal' | 'stacked';
  className?: string;
  showTagline?: boolean;
  animated?: boolean;
}

export default function Logo({ 
  variant = 'default', 
  className = '', 
  showTagline = false,
  animated = true 
}: LogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Professional color palette
  const primaryColor = '#4F46E5'; // Indigo
  const accentColor = '#6366F1'; // Lighter indigo
  const textColor = '#1E293B'; // Slate 800

  if (variant === 'minimal') {
    return (
      <svg
        className={`${className} ${animated && mounted ? 'logo-animate-in' : ''}`}
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        </defs>
        {/* Gavel icon with golden ratio proportions */}
        <path
          d="M20 8C20 6.89543 19.1046 6 18 6H16C14.8954 6 14 6.89543 14 8V16L20 16V8Z"
          fill="url(#logoGradient)"
          className="logo-gavel-handle"
        />
        <rect
          x="10"
          y="16"
          width="20"
          height="4"
          rx="2"
          fill="url(#logoGradient)"
          className="logo-gavel-head"
        />
        {/* Question mark overlay */}
        <path
          d="M20 24C20 24 20 26 20 28C20 29.1046 19.1046 30 18 30C16.8954 30 16 29.1046 16 28C16 26 16 24 16 24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          className="logo-question"
        />
        <circle cx="18" cy="33" r="1.5" fill="white" />
      </svg>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <svg
          className={`${animated && mounted ? 'logo-animate-in' : ''}`}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradientStacked" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={accentColor} />
            </linearGradient>
          </defs>
          <path
            d="M24 12C24 10.8954 23.1046 10 22 10H20C18.8954 10 18 10.8954 18 12V20L24 20V12Z"
            fill="url(#logoGradientStacked)"
            className="logo-gavel-handle"
          />
          <rect
            x="14"
            y="20"
            width="24"
            height="6"
            rx="3"
            fill="url(#logoGradientStacked)"
            className="logo-gavel-head"
          />
          <path
            d="M24 28C24 28 24 30 24 32C24 33.1046 23.1046 34 22 34C20.8954 34 20 33.1046 20 32C20 30 20 28 20 28"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="logo-question"
          />
          <circle cx="22" cy="37" r="2" fill="white" />
        </svg>
        <div className="text-center">
          <div className="font-bold text-xl tracking-tight" style={{ color: textColor }}>
            AskVerdict
          </div>
          {showTagline && (
            <div className="text-xs text-gray-500 mt-0.5">
              Decisions made together
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default horizontal logo
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        className={`${animated && mounted ? 'logo-animate-in' : ''} logo-mark`}
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradientDefault" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
          <filter id="logoShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/>
          </filter>
        </defs>
        {/* Modern gavel design with question mark */}
        <g filter="url(#logoShadow)">
          <path
            d="M18 7C18 5.89543 17.1046 5 16 5H14C12.8954 5 12 5.89543 12 7V14L18 14V7Z"
            fill="url(#logoGradientDefault)"
            className="logo-gavel-handle"
          />
          <rect
            x="8"
            y="14"
            width="20"
            height="5"
            rx="2.5"
            fill="url(#logoGradientDefault)"
            className="logo-gavel-head"
          />
          <path
            d="M18 21C18 21 18 23 18 25C18 26.1046 17.1046 27 16 27C14.8954 27 14 26.1046 14 25C14 23 14 21 14 21"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            className="logo-question"
          />
          <circle cx="16" cy="29.5" r="1.5" fill="white" />
        </g>
      </svg>
      
      <div className="flex flex-col">
        <div className="flex items-baseline gap-0.5">
          <span 
            className="font-bold text-2xl tracking-tight logo-text-primary"
            style={{ color: primaryColor }}
          >
            Ask
          </span>
          <span 
            className="font-bold text-2xl tracking-tight logo-text-secondary"
            style={{ color: textColor }}
          >
            Verdict
          </span>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-500 -mt-0.5 logo-tagline">
            Decisions made together
          </div>
        )}
      </div>
    </div>
  );
}

// Add this CSS to your globals.css
export const logoStyles = `
/* Logo animations */
@keyframes logoFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-animate-in {
  animation: logoFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-text-primary {
  animation: logoSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.logo-text-secondary {
  animation: logoSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

.logo-tagline {
  animation: logoFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

/* Hover effects */
.logo-mark {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-mark:hover {
  transform: scale(1.05);
}

.logo-mark:hover .logo-gavel-head {
  animation: gavelStrike 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.logo-mark:hover .logo-question {
  animation: questionPulse 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes gavelStrike {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-5deg); }
}

@keyframes questionPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; transform: scale(1.1); }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .logo-text-primary,
  .logo-text-secondary {
    font-size: 1.5rem;
  }
}
`;