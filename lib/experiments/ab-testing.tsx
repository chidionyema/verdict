'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { analytics } from '@/lib/analytics/ux-analytics';

// ============================================
// Types
// ============================================

interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: ExperimentVariant[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  targetAudience?: {
    percentage: number;
    criteria?: Record<string, any>;
  };
}

interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: number;
}

interface ExperimentContextType {
  getVariant: (experimentId: string) => string | null;
  isInExperiment: (experimentId: string) => boolean;
  trackConversion: (experimentId: string, conversionType: string, value?: number) => void;
  experiments: Record<string, Experiment>;
  assignments: Record<string, ExperimentAssignment>;
}

// ============================================
// Default Experiments Configuration
// ============================================

const DEFAULT_EXPERIMENTS: Record<string, Experiment> = {
  'onboarding-flow': {
    id: 'onboarding-flow',
    name: 'Onboarding Flow Test',
    description: 'Test simplified vs detailed onboarding',
    variants: [
      { id: 'control', name: 'Detailed Onboarding', weight: 50 },
      { id: 'simplified', name: 'Simplified Onboarding', weight: 50 },
    ],
    isActive: true,
  },
  'cta-copy': {
    id: 'cta-copy',
    name: 'CTA Copy Test',
    description: 'Test different call-to-action copy',
    variants: [
      { id: 'control', name: 'Get Started', weight: 33 },
      { id: 'action', name: 'Start Judging Now', weight: 34 },
      { id: 'benefit', name: 'Earn Credits Free', weight: 33 },
    ],
    isActive: true,
  },
  'pricing-display': {
    id: 'pricing-display',
    name: 'Pricing Display Test',
    description: 'Test different pricing presentations',
    variants: [
      { id: 'control', name: 'Standard Pricing', weight: 50 },
      { id: 'anchored', name: 'Anchored Pricing', weight: 50 },
    ],
    isActive: true,
  },
  'empty-state-messaging': {
    id: 'empty-state-messaging',
    name: 'Empty State Messaging',
    description: 'Test different empty state messages',
    variants: [
      { id: 'control', name: 'Standard Message', weight: 50 },
      { id: 'social-proof', name: 'With Social Proof', weight: 50 },
    ],
    isActive: true,
  },
};

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEY = 'experiment_assignments';
const USER_ID_KEY = 'experiment_user_id';

// ============================================
// Utility Functions
// ============================================

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'ssr-user';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function assignVariant(experiment: Experiment, userId: string): string {
  // Use consistent hashing for deterministic assignment
  const hash = hashString(`${experiment.id}-${userId}`);
  const bucket = hash % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return experiment.variants[0]?.id || 'control';
}

function loadAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAssignments(assignments: Record<string, ExperimentAssignment>) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // Storage full or unavailable
  }
}

// ============================================
// React Context
// ============================================

const ExperimentContext = createContext<ExperimentContextType | null>(null);

export function useExperiments() {
  const context = useContext(ExperimentContext);
  if (!context) {
    // Return defaults for SSR or when outside provider
    return {
      getVariant: () => null,
      isInExperiment: () => false,
      trackConversion: () => {},
      experiments: {},
      assignments: {},
    };
  }
  return context;
}

// ============================================
// Provider Component
// ============================================

interface ExperimentProviderProps {
  children: React.ReactNode;
  experiments?: Record<string, Experiment>;
}

export function ExperimentProvider({
  children,
  experiments = DEFAULT_EXPERIMENTS,
}: ExperimentProviderProps) {
  const [assignments, setAssignments] = useState<Record<string, ExperimentAssignment>>({});
  const [userId, setUserId] = useState<string>('');

  // Initialize on mount
  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    setAssignments(loadAssignments());
  }, []);

  // Get variant for an experiment
  const getVariant = useCallback((experimentId: string): string | null => {
    const experiment = experiments[experimentId];
    if (!experiment || !experiment.isActive) return null;

    // Check existing assignment
    if (assignments[experimentId]) {
      return assignments[experimentId].variantId;
    }

    // Create new assignment
    if (userId) {
      const variantId = assignVariant(experiment, userId);
      const newAssignment: ExperimentAssignment = {
        experimentId,
        variantId,
        assignedAt: Date.now(),
      };

      const newAssignments = { ...assignments, [experimentId]: newAssignment };
      setAssignments(newAssignments);
      saveAssignments(newAssignments);

      // Track assignment
      analytics.trackFeature('experiment', 'assigned', {
        experimentId,
        variantId,
        experimentName: experiment.name,
      });

      return variantId;
    }

    return null;
  }, [experiments, assignments, userId]);

  // Check if user is in experiment
  const isInExperiment = useCallback((experimentId: string): boolean => {
    return getVariant(experimentId) !== null;
  }, [getVariant]);

  // Track conversion
  const trackConversion = useCallback((
    experimentId: string,
    conversionType: string,
    value?: number
  ) => {
    const assignment = assignments[experimentId];
    if (!assignment) return;

    analytics.trackFeature('experiment', 'conversion', {
      experimentId,
      variantId: assignment.variantId,
      conversionType,
      value,
    });
  }, [assignments]);

  const value = useMemo(() => ({
    getVariant,
    isInExperiment,
    trackConversion,
    experiments,
    assignments,
  }), [getVariant, isInExperiment, trackConversion, experiments, assignments]);

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
}

// ============================================
// Hooks for Common Use Cases
// ============================================

/**
 * Hook to get a specific experiment variant
 */
export function useExperiment(experimentId: string) {
  const { getVariant, trackConversion, experiments } = useExperiments();
  const variant = getVariant(experimentId);
  const experiment = experiments[experimentId];

  const track = useCallback((conversionType: string, value?: number) => {
    trackConversion(experimentId, conversionType, value);
  }, [experimentId, trackConversion]);

  return {
    variant,
    isControl: variant === 'control',
    experiment,
    trackConversion: track,
  };
}

/**
 * Hook to get variant-specific content
 */
export function useVariantContent<T>(
  experimentId: string,
  content: Record<string, T>,
  defaultContent: T
): T {
  const { variant } = useExperiment(experimentId);

  if (variant && content[variant]) {
    return content[variant];
  }

  return defaultContent;
}

// ============================================
// Components
// ============================================

interface ExperimentProps {
  id: string;
  control: React.ReactNode;
  variants: Record<string, React.ReactNode>;
}

/**
 * Component that renders different content based on experiment variant
 */
export function Experiment({ id, control, variants }: ExperimentProps) {
  const { variant } = useExperiment(id);

  if (!variant) return <>{control}</>;

  if (variant === 'control') return <>{control}</>;

  return <>{variants[variant] || control}</>;
}

interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Simple feature flag component (experiment with 2 variants: on/off)
 */
export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const { variant } = useExperiment(flag);

  // If variant is 'enabled' or not 'control', show the feature
  if (variant && variant !== 'control' && variant !== 'disabled') {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================
// Admin/Debug Utilities
// ============================================

export function useExperimentDebug() {
  const { experiments, assignments } = useExperiments();

  const forceVariant = useCallback((experimentId: string, variantId: string) => {
    const storedAssignments = loadAssignments();
    storedAssignments[experimentId] = {
      experimentId,
      variantId,
      assignedAt: Date.now(),
    };
    saveAssignments(storedAssignments);
    window.location.reload();
  }, []);

  const clearAssignments = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const getDebugInfo = useCallback(() => {
    return {
      userId: getOrCreateUserId(),
      experiments: Object.keys(experiments).map(id => ({
        id,
        name: experiments[id].name,
        isActive: experiments[id].isActive,
        assignedVariant: assignments[id]?.variantId || 'not assigned',
      })),
    };
  }, [experiments, assignments]);

  return { forceVariant, clearAssignments, getDebugInfo };
}

// ============================================
// Export Default Experiments for Reference
// ============================================

export { DEFAULT_EXPERIMENTS };
