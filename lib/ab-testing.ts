// A/B Testing Infrastructure for Verdict
// Lightweight, cookie-based A/B testing without external dependencies

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ('A' | 'B')[];
  trafficAllocation: number; // 0-100, percentage of users in experiment
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: 'A' | 'B';
  assignedAt: number;
}

export interface ABEvent {
  experimentId: string;
  variant: 'A' | 'B';
  event: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Active experiments configuration
// Add new experiments here when needed
export const EXPERIMENTS: Record<string, Experiment> = {
  // No active experiments currently
  // Example:
  // 'experiment-id': {
  //   id: 'experiment-id',
  //   name: 'Experiment Name',
  //   description: 'What this experiment tests',
  //   variants: ['A', 'B'],
  //   trafficAllocation: 50,
  //   startDate: new Date('2026-02-13'),
  //   isActive: true,
  // },
};

// Storage keys
const ASSIGNMENT_KEY = 'verdict_ab_assignments';
const EVENTS_KEY = 'verdict_ab_events';

// ============================================
// Assignment Logic
// ============================================

/**
 * Get or create experiment assignment for a user
 * Assignments are sticky - once assigned, users stay in their variant
 */
export function getVariant(experimentId: string): 'A' | 'B' | null {
  if (typeof window === 'undefined') return null;

  const experiment = EXPERIMENTS[experimentId];
  if (!experiment || !experiment.isActive) return null;

  // Check if experiment has ended
  if (experiment.endDate && new Date() > experiment.endDate) return null;

  // Get existing assignments
  const assignments = getAssignments();
  const existingAssignment = assignments.find(a => a.experimentId === experimentId);

  if (existingAssignment) {
    return existingAssignment.variant;
  }

  // Check traffic allocation (random assignment)
  const random = Math.random() * 100;
  if (random > experiment.trafficAllocation) {
    // User not in experiment, show control (A)
    return 'A';
  }

  // Assign variant (50/50 split)
  const variant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';

  // Save assignment
  const newAssignment: ExperimentAssignment = {
    experimentId,
    variant,
    assignedAt: Date.now(),
  };

  saveAssignment(newAssignment);

  // Track assignment event
  trackABEvent(experimentId, variant, 'assigned');

  return variant;
}

/**
 * Force a specific variant (for testing/preview)
 */
export function forceVariant(experimentId: string, variant: 'A' | 'B'): void {
  if (typeof window === 'undefined') return;

  const assignments = getAssignments();
  const existingIndex = assignments.findIndex(a => a.experimentId === experimentId);

  const newAssignment: ExperimentAssignment = {
    experimentId,
    variant,
    assignedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    assignments[existingIndex] = newAssignment;
  } else {
    assignments.push(newAssignment);
  }

  localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments));
}

/**
 * Clear all experiment assignments (for testing)
 */
export function clearAssignments(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ASSIGNMENT_KEY);
}

// ============================================
// Event Tracking
// ============================================

/**
 * Track an A/B test event
 */
export function trackABEvent(
  experimentId: string,
  variant: 'A' | 'B',
  event: string,
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  const abEvent: ABEvent = {
    experimentId,
    variant,
    event,
    timestamp: Date.now(),
    metadata,
  };

  // Save locally
  const events = getEvents();
  events.push(abEvent);

  // Keep only last 100 events locally
  const recentEvents = events.slice(-100);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(recentEvents));

  // Send to analytics (if available)
  sendToAnalytics(abEvent);
}

/**
 * Track conversion event
 */
export function trackConversion(
  experimentId: string,
  conversionType: 'signup' | 'submission' | 'payment' | 'verdict_complete',
  value?: number
): void {
  const assignment = getAssignments().find(a => a.experimentId === experimentId);
  if (!assignment) return;

  trackABEvent(experimentId, assignment.variant, `conversion_${conversionType}`, {
    value,
    conversionType,
  });
}

// ============================================
// Analytics Integration
// ============================================

function sendToAnalytics(event: ABEvent): void {
  // Send to your analytics service
  // This could be Supabase, Mixpanel, Amplitude, etc.

  // Example: Send to Supabase
  if (typeof window !== 'undefined') {
    // Fire and forget - don't block
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'ab_test',
        event_name: event.event,
        properties: {
          experiment_id: event.experimentId,
          variant: event.variant,
          ...event.metadata,
        },
      }),
    }).catch(() => {
      // Silently fail - analytics should not break the app
    });
  }
}

// ============================================
// Helpers
// ============================================

function getAssignments(): ExperimentAssignment[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(ASSIGNMENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAssignment(assignment: ExperimentAssignment): void {
  const assignments = getAssignments();
  assignments.push(assignment);
  localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments));
}

function getEvents(): ABEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============================================
// React Hook
// ============================================

import { useState, useEffect } from 'react';

export function useExperiment(experimentId: string): {
  variant: 'A' | 'B' | null;
  isLoading: boolean;
  trackEvent: (event: string, metadata?: Record<string, any>) => void;
  trackConversion: (type: 'signup' | 'submission' | 'payment' | 'verdict_complete', value?: number) => void;
} {
  const [variant, setVariant] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assignedVariant = getVariant(experimentId);
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [experimentId]);

  const trackEventFn = (event: string, metadata?: Record<string, any>) => {
    if (variant) {
      trackABEvent(experimentId, variant, event, metadata);
    }
  };

  const trackConversionFn = (
    type: 'signup' | 'submission' | 'payment' | 'verdict_complete',
    value?: number
  ) => {
    if (variant) {
      trackConversion(experimentId, type, value);
    }
  };

  return {
    variant,
    isLoading,
    trackEvent: trackEventFn,
    trackConversion: trackConversionFn,
  };
}

// ============================================
// URL-based variant override (for testing)
// ============================================

export function getVariantFromURL(experimentId: string): 'A' | 'B' | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const variant = params.get(`ab_${experimentId}`);

  if (variant === 'A' || variant === 'B') {
    forceVariant(experimentId, variant);
    return variant;
  }

  return null;
}

// ============================================
// Statistics Helpers (for dashboard)
// ============================================

export interface ExperimentStats {
  experimentId: string;
  variantA: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  winner: 'A' | 'B' | 'none' | 'inconclusive';
  confidence: number;
}

export function getLocalExperimentStats(experimentId: string): ExperimentStats {
  const events = getEvents().filter(e => e.experimentId === experimentId);

  const variantAEvents = events.filter(e => e.variant === 'A');
  const variantBEvents = events.filter(e => e.variant === 'B');

  const variantAImpressions = variantAEvents.filter(e => e.event === 'assigned').length;
  const variantBImpressions = variantBEvents.filter(e => e.event === 'assigned').length;

  const variantAConversions = variantAEvents.filter(e => e.event.startsWith('conversion_')).length;
  const variantBConversions = variantBEvents.filter(e => e.event.startsWith('conversion_')).length;

  const variantARate = variantAImpressions > 0 ? variantAConversions / variantAImpressions : 0;
  const variantBRate = variantBImpressions > 0 ? variantBConversions / variantBImpressions : 0;

  // Simple winner determination (in production, use proper statistical significance)
  let winner: 'A' | 'B' | 'none' | 'inconclusive' = 'inconclusive';
  let confidence = 0;

  const totalSamples = variantAImpressions + variantBImpressions;
  if (totalSamples >= 100) {
    const diff = Math.abs(variantARate - variantBRate);
    if (diff > 0.05) { // 5% difference threshold
      winner = variantARate > variantBRate ? 'A' : 'B';
      confidence = Math.min(95, 50 + (totalSamples / 10)); // Simplified confidence
    }
  }

  return {
    experimentId,
    variantA: {
      impressions: variantAImpressions,
      conversions: variantAConversions,
      conversionRate: variantARate,
    },
    variantB: {
      impressions: variantBImpressions,
      conversions: variantBConversions,
      conversionRate: variantBRate,
    },
    winner,
    confidence,
  };
}
