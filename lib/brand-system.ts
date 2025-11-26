// Verdict Brand System - Single Source of Truth for Design Tokens

// BRAND COLORS - Indigo as Primary (Professional, Trustworthy, Modern)
export const brandColors = {
  // Primary Brand Colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',   // Primary brand color
    600: '#4f46e5',   // Primary dark
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Secondary Colors (Refined Purple for Accents)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff', 
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',   // Secondary accent
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Success (Green)
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  // Warning (Amber)
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },

  // Danger (Red)
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Neutrals (Refined Grays)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
} as const;

// TYPOGRAPHY SCALE - 6 Levels Maximum
export const typography = {
  // Display (Hero headlines only)
  display: {
    size: 'text-4xl md:text-6xl',
    weight: 'font-bold',
    leading: 'leading-tight',
  },
  
  // H1 (Page titles)
  h1: {
    size: 'text-3xl md:text-4xl',
    weight: 'font-bold', 
    leading: 'leading-tight',
  },
  
  // H2 (Section headers)
  h2: {
    size: 'text-2xl md:text-3xl',
    weight: 'font-semibold',
    leading: 'leading-tight',
  },
  
  // H3 (Subsection headers)
  h3: {
    size: 'text-xl md:text-2xl',
    weight: 'font-semibold',
    leading: 'leading-normal',
  },
  
  // H4 (Card titles, minor headers)
  h4: {
    size: 'text-lg md:text-xl',
    weight: 'font-medium',
    leading: 'leading-normal',
  },
  
  // Body text
  body: {
    large: 'text-lg leading-relaxed',
    default: 'text-base leading-normal',
    small: 'text-sm leading-normal',
  },
  
  // Labels and captions
  caption: {
    default: 'text-sm font-medium',
    small: 'text-xs font-medium',
  },
} as const;

// SPACING SYSTEM - 4px/8px Grid
export const spacing = {
  xs: 'p-2',      // 8px
  sm: 'p-3',      // 12px  
  md: 'p-4',      // 16px
  lg: 'p-6',      // 24px
  xl: 'p-8',      // 32px
  '2xl': 'p-12',  // 48px
  '3xl': 'p-16',  // 64px
} as const;

// COMPONENT VARIANTS
export const buttonVariants = {
  primary: {
    base: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium',
    focus: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    disabled: 'disabled:bg-indigo-300 disabled:cursor-not-allowed',
  },
  secondary: {
    base: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium',
    focus: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    disabled: 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
  },
  ghost: {
    base: 'bg-transparent hover:bg-gray-100 text-gray-700 font-medium',
    focus: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    disabled: 'disabled:text-gray-400 disabled:cursor-not-allowed',
  },
} as const;

export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',    // 36px min touch target
  md: 'px-4 py-2 text-base min-h-[44px]',    // 44px min touch target  
  lg: 'px-6 py-3 text-lg min-h-[48px]',      // 48px generous touch target
} as const;

// BRAND VOICE & TONE GUIDELINES
export const brandVoice = {
  // Core Brand Personality
  traits: [
    'Professional confidence (not arrogance)',
    'Helpful directness (not brutal)', 
    'Accessible expertise (not academic)',
    'Encouraging honesty (not harsh criticism)',
  ],
  
  // Writing Guidelines
  headlines: {
    style: 'Active voice, benefit-focused, under 8 words',
    examples: ['Get honest opinions in minutes', 'Skip the guesswork', 'Real feedback, real results'],
    avoid: ['Revolutionary', 'Game-changing', 'World\'s best', 'Disrupting'],
  },
  
  buttons: {
    style: 'Action-oriented, specific, confidence-building',
    examples: ['Get my verdict', 'Start my request', 'See honest feedback'],
    avoid: ['Submit', 'Click here', 'Learn more', 'Try now'],
  },
  
  descriptions: {
    style: 'Clear benefits, specific outcomes, social proof',
    examples: ['3 people review your question privately', 'Anonymous reviewers give you straight answers'],
    avoid: ['Revolutionary platform', 'Cutting-edge technology', 'World-class experts'],
  },
} as const;

// ANIMATION STANDARDS
export const animations = {
  duration: {
    fast: 'duration-200',
    normal: 'duration-300', 
    slow: 'duration-500',
  },
  timing: {
    default: 'ease-out',
    bounce: 'ease-in-out',
    sharp: 'ease-in',
  },
  hover: 'transition-all duration-200 ease-out',
  focus: 'transition-all duration-200 ease-out',
} as const;

// LAYOUT CONSTANTS
export const layout = {
  maxWidth: {
    content: 'max-w-4xl',    // Long-form content
    section: 'max-w-7xl',    // Page sections
    form: 'max-w-2xl',       // Forms and narrow content
  },
  
  breakpoints: {
    mobile: '640px',
    tablet: '768px', 
    desktop: '1024px',
    wide: '1280px',
  },
} as const;