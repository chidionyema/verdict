'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Info,
  HelpCircle,
  Lightbulb,
  X,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type ExpertiseLevel = 'beginner' | 'intermediate' | 'expert';

interface UserExpertise {
  level: ExpertiseLevel;
  actionsCount: number;
  featuresUsed: string[];
  lastUpdated: string;
}

interface ProgressiveDisclosureContextType {
  expertise: UserExpertise;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  trackAction: (action: string) => void;
  trackFeatureUsed: (feature: string) => void;
  isFeatureVisible: (feature: string, minLevel?: ExpertiseLevel) => boolean;
  resetExpertise: () => void;
}

// ============================================
// Context
// ============================================

const defaultExpertise: UserExpertise = {
  level: 'beginner',
  actionsCount: 0,
  featuresUsed: [],
  lastUpdated: new Date().toISOString(),
};

const ProgressiveDisclosureContext = createContext<ProgressiveDisclosureContextType | undefined>(undefined);

export function useProgressiveDisclosure() {
  const context = useContext(ProgressiveDisclosureContext);
  if (!context) {
    return {
      expertise: defaultExpertise,
      showAdvanced: false,
      setShowAdvanced: () => {},
      trackAction: () => {},
      trackFeatureUsed: () => {},
      isFeatureVisible: () => true,
      resetExpertise: () => {},
    };
  }
  return context;
}

// ============================================
// Provider
// ============================================

const STORAGE_KEY = 'user_expertise';
const SHOW_ADVANCED_KEY = 'show_advanced_features';

export function ProgressiveDisclosureProvider({ children }: { children: React.ReactNode }) {
  const [expertise, setExpertise] = useState<UserExpertise>(defaultExpertise);
  const [showAdvanced, setShowAdvancedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedExpertise = localStorage.getItem(STORAGE_KEY);
    if (storedExpertise) {
      try {
        setExpertise(JSON.parse(storedExpertise));
      } catch {
        // Invalid data, use defaults
      }
    }

    const storedAdvanced = localStorage.getItem(SHOW_ADVANCED_KEY);
    if (storedAdvanced) {
      setShowAdvancedState(storedAdvanced === 'true');
    }

    setMounted(true);
  }, []);

  // Save expertise to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expertise));
    }
  }, [expertise, mounted]);

  // Calculate expertise level based on actions
  const calculateLevel = (actionsCount: number, featuresUsed: string[]): ExpertiseLevel => {
    if (actionsCount >= 50 || featuresUsed.length >= 10) return 'expert';
    if (actionsCount >= 15 || featuresUsed.length >= 5) return 'intermediate';
    return 'beginner';
  };

  const trackAction = useCallback((action: string) => {
    setExpertise(prev => {
      const newCount = prev.actionsCount + 1;
      const newLevel = calculateLevel(newCount, prev.featuresUsed);
      return {
        ...prev,
        actionsCount: newCount,
        level: newLevel,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const trackFeatureUsed = useCallback((feature: string) => {
    setExpertise(prev => {
      if (prev.featuresUsed.includes(feature)) return prev;

      const newFeatures = [...prev.featuresUsed, feature];
      const newLevel = calculateLevel(prev.actionsCount, newFeatures);
      return {
        ...prev,
        featuresUsed: newFeatures,
        level: newLevel,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const setShowAdvanced = useCallback((show: boolean) => {
    setShowAdvancedState(show);
    localStorage.setItem(SHOW_ADVANCED_KEY, String(show));
  }, []);

  const isFeatureVisible = useCallback((feature: string, minLevel: ExpertiseLevel = 'beginner') => {
    if (showAdvanced) return true;

    const levels: ExpertiseLevel[] = ['beginner', 'intermediate', 'expert'];
    const userLevelIndex = levels.indexOf(expertise.level);
    const requiredLevelIndex = levels.indexOf(minLevel);

    return userLevelIndex >= requiredLevelIndex;
  }, [expertise.level, showAdvanced]);

  const resetExpertise = useCallback(() => {
    setExpertise(defaultExpertise);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ProgressiveDisclosureContext.Provider
      value={{
        expertise,
        showAdvanced,
        setShowAdvanced,
        trackAction,
        trackFeatureUsed,
        isFeatureVisible,
        resetExpertise,
      }}
    >
      {children}
    </ProgressiveDisclosureContext.Provider>
  );
}

// ============================================
// Show Advanced Toggle
// ============================================

export function AdvancedToggle({ className = '' }: { className?: string }) {
  const { showAdvanced, setShowAdvanced, expertise } = useProgressiveDisclosure();

  return (
    <button
      onClick={() => setShowAdvanced(!showAdvanced)}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        showAdvanced
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      } ${className}`}
    >
      {showAdvanced ? (
        <>
          <EyeOff className="w-4 h-4" />
          <span>Hide Advanced</span>
        </>
      ) : (
        <>
          <Sliders className="w-4 h-4" />
          <span>Show Advanced</span>
        </>
      )}
    </button>
  );
}

// ============================================
// Collapsible Advanced Section
// ============================================

export function AdvancedSection({
  title = 'Advanced Options',
  children,
  defaultOpen = false,
  minLevel = 'intermediate' as ExpertiseLevel,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  minLevel?: ExpertiseLevel;
  className?: string;
}) {
  const { isFeatureVisible, showAdvanced } = useProgressiveDisclosure();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Auto-open if showAdvanced is enabled
  useEffect(() => {
    if (showAdvanced) {
      setIsOpen(true);
    }
  }, [showAdvanced]);

  // Don't render if user doesn't have required expertise
  if (!isFeatureVisible('advanced_section', minLevel) && !showAdvanced) {
    return null;
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Feature Gate
// ============================================

export function FeatureGate({
  feature,
  minLevel = 'intermediate' as ExpertiseLevel,
  children,
  fallback,
}: {
  feature: string;
  minLevel?: ExpertiseLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isFeatureVisible } = useProgressiveDisclosure();

  if (!isFeatureVisible(feature, minLevel)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ============================================
// Contextual Help Tooltip
// ============================================

export function ContextualHelp({
  title,
  content,
  learnMoreUrl,
  placement = 'top',
  children,
}: {
  title?: string;
  content: string;
  learnMoreUrl?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="ml-1.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-50 ${placementClasses[placement]}`}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-xl p-3 shadow-xl max-w-xs">
              {title && (
                <p className="font-semibold text-sm mb-1">{title}</p>
              )}
              <p className="text-sm text-gray-300">{content}</p>
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  className="inline-block mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Education Card
// ============================================

export function EducationCard({
  id,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  dismissible = true,
  className = '',
}: {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  className?: string;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`education_${id}_dismissed`);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`education_${id}_dismissed`, 'true');
  };

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 ${className}`}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg">
          {icon || <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Expertise Badge
// ============================================

export function ExpertiseBadge({ className = '' }: { className?: string }) {
  const { expertise } = useProgressiveDisclosure();

  const badgeConfig = {
    beginner: {
      label: 'Beginner',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    intermediate: {
      label: 'Intermediate',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    expert: {
      label: 'Expert',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
  };

  const config = badgeConfig[expertise.level];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color} ${className}`}
    >
      {config.icon}
      {config.label}
    </div>
  );
}

// ============================================
// Progressive Form Field
// ============================================

export function ProgressiveField({
  label,
  required = false,
  advanced = false,
  helpText,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  advanced?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isFeatureVisible, showAdvanced } = useProgressiveDisclosure();

  // Hide advanced fields unless user has expertise or showAdvanced is on
  if (advanced && !isFeatureVisible('advanced_field', 'intermediate') && !showAdvanced) {
    return null;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {advanced && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
            Advanced
          </span>
        )}
        {helpText && (
          <ContextualHelp content={helpText}>
            <span className="sr-only">Help</span>
          </ContextualHelp>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================
// Simplicity Mode Toggle
// ============================================

export function SimplicityModeCard({ className = '' }: { className?: string }) {
  const { showAdvanced, setShowAdvanced, expertise } = useProgressiveDisclosure();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Interface Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {showAdvanced ? 'Showing all features' : 'Simplified view'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            showAdvanced ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <motion.div
            animate={{ x: showAdvanced ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
          />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Your experience level</span>
          <ExpertiseBadge />
        </div>
      </div>
    </div>
  );
}
