'use client';

import { useEffect, useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { useTheme } from '@/components/providers/ThemeProvider';

// ============================================
// Dark Mode Aware Image
// ============================================

interface DarkModeImageProps extends Omit<ImageProps, 'src'> {
  lightSrc: string;
  darkSrc?: string;
  invertInDark?: boolean;
}

export function DarkModeImage({
  lightSrc,
  darkSrc,
  invertInDark = false,
  alt,
  className = '',
  ...props
}: DarkModeImageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const src = isDark && darkSrc ? darkSrc : lightSrc;
  const imageClass = isDark && invertInDark && !darkSrc
    ? `${className} dark-invert`
    : className;

  return (
    <Image
      src={src}
      alt={alt}
      className={imageClass}
      {...props}
    />
  );
}

// ============================================
// Reduced Motion Hook
// ============================================

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ============================================
// High Contrast Mode Hook
// ============================================

export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

// ============================================
// Color Scheme Hook
// ============================================

export function useSystemColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return colorScheme;
}

// ============================================
// Focus Visible Component
// ============================================

interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  ringColor?: string;
  ringOffset?: number;
}

export function FocusRing({
  children,
  className = '',
  ringColor,
  ringOffset = 2,
}: FocusRingProps) {
  const { resolvedTheme } = useTheme();
  const defaultRingColor = resolvedTheme === 'dark' ? '#818cf8' : '#4f46e5';
  const color = ringColor || defaultRingColor;

  return (
    <div
      className={`focus-within:ring-2 focus-within:ring-offset-${ringOffset} ${className}`}
      style={{ '--tw-ring-color': color } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ============================================
// Skip to Content Link
// ============================================

export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

// ============================================
// Screen Reader Only Text
// ============================================

export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ============================================
// Live Region for Announcements
// ============================================

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ============================================
// Accessible Icon Button
// ============================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon,
  label,
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <button
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ============================================
// Visually Hidden (for custom implementations)
// ============================================

export function VisuallyHidden({
  children,
  as: Component = 'span',
}: {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'label';
}) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
}

// ============================================
// Motion Safe Wrapper
// ============================================

interface MotionSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MotionSafe({ children, fallback }: MotionSafeProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// Theme-Aware Gradient
// ============================================

export function ThemeGradient({
  children,
  lightGradient = 'from-indigo-500 to-purple-600',
  darkGradient = 'from-indigo-400 to-purple-500',
  className = '',
}: {
  children?: React.ReactNode;
  lightGradient?: string;
  darkGradient?: string;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const gradient = resolvedTheme === 'dark' ? darkGradient : lightGradient;

  return (
    <div className={`bg-gradient-to-r ${gradient} ${className}`}>
      {children}
    </div>
  );
}
