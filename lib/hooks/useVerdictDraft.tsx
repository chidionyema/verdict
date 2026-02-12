'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface VerdictDraft {
  rating: number;
  feedback: string;
  tone: 'honest' | 'constructive' | 'encouraging';
  reasons?: string;
  // For comparisons
  optionARating?: number;
  optionBRating?: number;
  optionAFeedback?: string;
  optionBFeedback?: string;
  chosenOption?: 'A' | 'B';
  reasoning?: string;
  // For split tests
  variantAScore?: number;
  variantBScore?: number;
  winner?: 'A' | 'B' | 'tie';
  hypothesisValidation?: 'supported' | 'not_supported' | 'inconclusive';
  confidence?: number;
  // Metadata
  savedAt: number;
  requestId: string;
}

const STORAGE_PREFIX = 'verdict_draft_';
const DRAFT_EXPIRY_HOURS = 24;

export function useVerdictDraft(requestId: string) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `${STORAGE_PREFIX}${requestId}`;

  // Check for existing draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draft: VerdictDraft = JSON.parse(savedDraft);
        const ageHours = (Date.now() - draft.savedAt) / (1000 * 60 * 60);

        if (ageHours < DRAFT_EXPIRY_HOURS) {
          setHasDraft(true);
          setLastSaved(new Date(draft.savedAt));
        } else {
          // Clear expired draft
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, [storageKey]);

  // Save draft with debounce
  const saveDraft = useCallback(
    (data: Partial<VerdictDraft>) => {
      if (typeof window === 'undefined') return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus('saving');

      // Debounce save by 1 second
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const draft: VerdictDraft = {
            ...data,
            savedAt: Date.now(),
            requestId,
          } as VerdictDraft;

          localStorage.setItem(storageKey, JSON.stringify(draft));
          setSaveStatus('saved');
          setHasDraft(true);
          setLastSaved(new Date());

          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Error saving draft:', error);
          setSaveStatus('error');
        }
      }, 1000);
    },
    [requestId, storageKey]
  );

  // Restore draft
  const restoreDraft = useCallback((): Partial<VerdictDraft> | null => {
    if (typeof window === 'undefined') return null;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draft: VerdictDraft = JSON.parse(savedDraft);
        const ageHours = (Date.now() - draft.savedAt) / (1000 * 60 * 60);

        if (ageHours < DRAFT_EXPIRY_HOURS) {
          return draft;
        }
      }
    } catch (error) {
      console.error('Error restoring draft:', error);
    }
    return null;
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    restoreDraft,
    clearDraft,
    saveStatus,
    hasDraft,
    lastSaved,
  };
}

/**
 * Simple save status indicator component
 */
export function DraftSaveIndicator({
  status,
  lastSaved,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}) {
  if (status === 'idle' && !lastSaved) return null;

  return (
    <div
      className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
        status === 'idle' ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {status === 'saving' && (
        <>
          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-gray-500">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Draft saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600">Save failed</span>
        </>
      )}
      {status === 'idle' && lastSaved && (
        <span className="text-gray-400">
          Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

/**
 * Draft restoration banner
 */
export function DraftRestorationBanner({
  onRestore,
  onDiscard,
  lastSaved,
}: {
  onRestore: () => void;
  onDiscard: () => void;
  lastSaved: Date | null;
}) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-amber-800">You have an unfinished verdict</p>
            <p className="text-sm text-amber-600 mt-0.5">
              {lastSaved
                ? `Saved ${lastSaved.toLocaleDateString()} at ${lastSaved.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Would you like to continue where you left off?'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRestore}
          className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
        >
          Resume Draft
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 py-2 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors text-sm"
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
}
