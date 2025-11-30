// Mode-Specific Color System
// Community Mode (Free) = Green
// Private Mode (Paid) = Purple

export const modeColors = {
  community: {
    primary: '#10B981',      // Green-600
    secondary: '#059669',    // Green-700
    light: '#D1FAE5',        // Green-200
    background: '#F0FDF4',   // Green-50
    hover: '#047857',        // Green-800
    text: '#065F46',         // Green-900
    badgeBg: '#D1FAE5',      // Green-100
    badgeText: '#065F46',    // Green-900
    gradient: 'from-green-600 to-emerald-600',
    gradientHover: 'from-green-700 to-emerald-700',
  },
  private: {
    primary: '#7C3AED',      // Purple-600
    secondary: '#6366F1',    // Indigo-500
    light: '#EDE9FE',        // Purple-200
    background: '#FAF5FF',   // Purple-50
    hover: '#6D28D9',        // Purple-700
    text: '#5B21B6',         // Purple-900
    badgeBg: '#EDE9FE',      // Purple-100
    badgeText: '#5B21B6',    // Purple-900
    gradient: 'from-indigo-600 to-purple-600',
    gradientHover: 'from-indigo-700 to-purple-700',
  },
} as const;

export type Mode = 'community' | 'private';

// Helper function to get mode colors
export function getModeColors(mode: Mode) {
  return modeColors[mode];
}

// Tailwind class helpers
export const modeClasses = {
  community: {
    button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white',
    buttonOutline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
    card: 'border-l-4 border-green-600 bg-gradient-to-r from-green-50 to-white',
    badge: 'bg-green-100 text-green-900',
    text: 'text-green-700',
    bg: 'bg-green-50',
  },
  private: {
    button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
    buttonOutline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
    card: 'border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white',
    badge: 'bg-purple-100 text-purple-900',
    text: 'text-purple-700',
    bg: 'bg-purple-50',
  },
} as const;

