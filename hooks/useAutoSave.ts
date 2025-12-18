/**
 * Auto-save hook for forms
 * Prevents data loss on navigation/refresh
 */

import { useEffect, useRef, useCallback } from 'react';
import { APP_CONFIG } from '@/lib/app-config';

interface AutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  debounceMs?: number;
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  onSave,
  onRestore,
  debounceMs = APP_CONFIG.UX.AUTO_SAVE_INTERVAL_MS
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Save data to localStorage
  const saveData = useCallback((dataToSave: any) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: 1 // For future migration needs
      });
      
      localStorage.setItem(`autosave_${key}`, serialized);
      lastSavedRef.current = serialized;
      onSave?.(dataToSave);
      
      // Visual feedback
      const indicator = document.getElementById('autosave-indicator');
      if (indicator) {
        indicator.textContent = '✅ Saved';
        indicator.className = 'text-green-600 text-sm';
        setTimeout(() => {
          if (indicator) {
            indicator.textContent = '';
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [key, onSave]);

  // Restore data from localStorage
  const restoreData = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;
        
        // Don't restore data older than 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          onRestore?.(parsed.data);
          return parsed.data;
        } else {
          // Clean up old data
          localStorage.removeItem(`autosave_${key}`);
        }
      }
    } catch (error) {
      console.error('Auto-restore failed:', error);
    }
    return null;
  }, [key, onRestore]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    lastSavedRef.current = '';
  }, [key]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled || !data) return;

    const serialized = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (serialized === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveData(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, saveData]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled && data) {
        saveData(data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, data, saveData]);

  return {
    saveNow: () => saveData(data),
    restoreData,
    clearSaved,
    hasUnsavedChanges: () => {
      const current = JSON.stringify(data);
      return current !== lastSavedRef.current;
    }
  };
}

// Auto-save indicator utility
export function updateAutoSaveIndicator(status: string, className: string = '') {
  const indicator = document.getElementById('autosave-indicator');
  if (indicator) {
    indicator.textContent = status;
    indicator.className = `fixed top-4 right-4 z-50 bg-white px-3 py-1 rounded-full shadow-lg border transition-all duration-300 ${className}`;
  }
}

// Utility hook for form auto-save with validation
export function useFormAutoSave<T extends Record<string, any>>(
  formKey: string,
  formData: T,
  options: {
    enabled?: boolean;
    onRestore?: (data: T) => void;
    validateBeforeSave?: (data: T) => boolean;
  } = {}
) {
  const {
    enabled = true,
    onRestore,
    validateBeforeSave
  } = options;

  const autoSave = useAutoSave({
    key: formKey,
    data: formData,
    enabled: enabled && (!validateBeforeSave || validateBeforeSave(formData)),
    onSave: (data) => {
      console.log(`Form ${formKey} auto-saved`, { timestamp: new Date().toISOString() });
    },
    onRestore
  });

  // Check for saved data on mount
  useEffect(() => {
    const savedData = autoSave.restoreData();
    if (savedData && onRestore) {
      // Show restore prompt
      const shouldRestore = window.confirm(
        'We found a saved draft of this form. Would you like to restore it?'
      );
      if (shouldRestore) {
        onRestore(savedData);
      } else {
        autoSave.clearSaved();
      }
    }
  }, []);

  return {
    ...autoSave,
    showRestorePrompt: (onAccept: (data: T) => void) => {
      const savedData = autoSave.restoreData();
      if (savedData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-bold mb-3">Restore Draft?</h3>
            <p class="text-gray-600 mb-6">We found a saved draft from earlier. Would you like to restore it?</p>
            <div class="flex gap-3">
              <button id="restore-yes" class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg">
                Restore Draft
              </button>
              <button id="restore-no" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
                Start Fresh
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#restore-yes')?.addEventListener('click', () => {
          onAccept(savedData);
          autoSave.clearSaved();
          modal.remove();
        });
        
        modal.querySelector('#restore-no')?.addEventListener('click', () => {
          autoSave.clearSaved();
          modal.remove();
        });
      }
    }
  };
}