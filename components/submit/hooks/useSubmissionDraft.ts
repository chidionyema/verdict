'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SubmissionDraft,
  SubmissionData,
  SubmissionStep,
  DRAFT_STORAGE_KEY,
  DRAFT_EXPIRY_HOURS,
  LEGACY_STORAGE_KEYS,
  createEmptySubmissionData,
} from '../types';

interface UseSubmissionDraftReturn {
  draft: SubmissionDraft | null;
  saveDraft: (step: SubmissionStep, data: SubmissionData, returnFrom?: 'earn' | 'payment') => void;
  clearDraft: () => void;
  isLoading: boolean;
  wasMigrated: boolean;
}

/**
 * Unified draft storage hook with legacy migration
 *
 * Features:
 * - 24-hour TTL with automatic expiry
 * - Migrates from legacy storage keys (submitDraft, draftRequest, verdict_request_draft)
 * - Clears legacy keys after migration
 * - Auto-saves to localStorage
 */
export function useSubmissionDraft(): UseSubmissionDraftReturn {
  const [draft, setDraft] = useState<SubmissionDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wasMigrated, setWasMigrated] = useState(false);
  const hasInitialized = useRef(false);

  // Load draft on mount (with legacy migration)
  useEffect(() => {
    if (typeof window === 'undefined' || hasInitialized.current) return;
    hasInitialized.current = true;

    const loadDraft = () => {
      // First, try to load from new unified key
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SubmissionDraft;

          // Check expiry
          const expiryMs = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
          if (Date.now() - parsed.savedAt < expiryMs && parsed.version === 2) {
            setDraft(parsed);
            setIsLoading(false);
            return;
          }

          // Expired - clear it
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }

      // Try to migrate from legacy keys
      const migrated = migrateLegacyDraft();
      if (migrated) {
        setDraft(migrated);
        setWasMigrated(true);
        // Save to new key
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(migrated));
        // Clear legacy keys
        clearLegacyKeys();
      }

      setIsLoading(false);
    };

    loadDraft();
  }, []);

  // Save draft
  const saveDraft = useCallback((
    step: SubmissionStep,
    data: SubmissionData,
    returnFrom?: 'earn' | 'payment'
  ) => {
    if (typeof window === 'undefined') return;

    const newDraft: SubmissionDraft = {
      version: 2,
      savedAt: Date.now(),
      step,
      data,
      returnFrom,
    };

    setDraft(newDraft);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    setDraft(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    clearLegacyKeys();
  }, []);

  return {
    draft,
    saveDraft,
    clearDraft,
    isLoading,
    wasMigrated,
  };
}

/**
 * Attempt to migrate from any legacy storage format
 */
function migrateLegacyDraft(): SubmissionDraft | null {
  if (typeof window === 'undefined') return null;

  // Try sessionStorage keys first (they're more recent)
  for (const key of LEGACY_STORAGE_KEYS.sessionStorage) {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = convertLegacyFormat(parsed, key);
        if (migrated) return migrated;
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  // Try localStorage keys
  for (const key of LEGACY_STORAGE_KEYS.localStorage) {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = convertLegacyFormat(parsed, key);
        if (migrated) return migrated;
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  return null;
}

/**
 * Convert legacy formats to new unified format
 */
function convertLegacyFormat(legacy: any, sourceKey: string): SubmissionDraft | null {
  // Check if draft is expired (1 hour for session-based, 24 hours for localStorage)
  const maxAge = sourceKey === 'verdict_request_draft'
    ? 24 * 60 * 60 * 1000 // 24 hours
    : 60 * 60 * 1000; // 1 hour

  if (legacy.savedAt && Date.now() - legacy.savedAt > maxAge) {
    return null;
  }

  // Format from submitDraft (app/submit/page.tsx)
  if (legacy.submissionData) {
    const data = legacy.submissionData;
    return {
      version: 2,
      savedAt: legacy.savedAt || Date.now(),
      step: mapLegacyStep(legacy.step),
      data: {
        requestType: mapLegacyMediaType(data.mediaType),
        mediaType: data.mediaType === 'text' ? 'text' : 'photo',
        mediaUrls: data.mediaUrl ? [data.mediaUrl] : [],
        textContent: data.textContent || '',
        category: data.category || '',
        context: data.context || data.question || '',
        specificQuestions: [],
        tier: 'community',
      },
    };
  }

  // Format from draftRequest (simplified-start.tsx)
  if (legacy.mediaType && (legacy.textContent !== undefined || legacy.category)) {
    return {
      version: 2,
      savedAt: Date.now(),
      step: legacy.context?.length >= 20 ? 'submit' : legacy.category ? 'details' : 'content',
      data: {
        requestType: 'standard',
        mediaType: legacy.mediaType === 'text' ? 'text' : 'photo',
        mediaUrls: [],
        textContent: legacy.textContent || '',
        category: legacy.category || '',
        context: legacy.context || '',
        specificQuestions: [],
        tier: 'community',
      },
    };
  }

  // Format from verdict_request_draft (create/page.tsx)
  if (legacy.requestType !== undefined || legacy.tier !== undefined) {
    return {
      version: 2,
      savedAt: Date.now(),
      step: legacy.context?.length >= 10 ? 'submit' : 'content',
      data: {
        requestType: legacy.requestType || 'standard',
        mediaType: legacy.mediaType === 'text' ? 'text' : 'photo',
        mediaUrls: legacy.mediaFiles?.length > 0 ? [] : [], // Files can't be serialized
        textContent: legacy.textContent || '',
        category: legacy.category || '',
        context: legacy.context || '',
        specificQuestions: legacy.specificQuestions || [],
        demographicFilters: legacy.demographicFilters,
        tier: legacy.tier || 'community',
      },
    };
  }

  return null;
}

/**
 * Map legacy step names to new step names
 */
function mapLegacyStep(legacyStep?: string): SubmissionStep {
  switch (legacyStep) {
    case 'details':
    case 'type':
    case 'upload':
      return 'content';
    case 'mode':
    case 'category':
      return 'details';
    case 'payment':
    case 'processing':
    case 'success':
    case 'review':
      return 'submit';
    default:
      return 'content';
  }
}

/**
 * Map legacy mediaType to requestType
 */
function mapLegacyMediaType(mediaType?: string): 'standard' | 'comparison' | 'split_test' {
  if (mediaType === 'comparison') return 'comparison';
  if (mediaType === 'split_test') return 'split_test';
  return 'standard';
}

/**
 * Clear all legacy storage keys
 */
function clearLegacyKeys(): void {
  if (typeof window === 'undefined') return;

  for (const key of LEGACY_STORAGE_KEYS.sessionStorage) {
    sessionStorage.removeItem(key);
  }
  for (const key of LEGACY_STORAGE_KEYS.localStorage) {
    localStorage.removeItem(key);
  }
}
