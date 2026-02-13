'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, ArrowUp, ArrowDown } from 'lucide-react';

interface KeyboardShortcutsProps {
  className?: string;
  variant?: 'banner' | 'modal' | 'inline';
  onDismiss?: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'rating';
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['j', 'k'], description: 'Navigate between requests', category: 'navigation' },
  { keys: ['Enter'], description: 'Open selected request', category: 'navigation' },
  { keys: ['Esc'], description: 'Go back / close modal', category: 'navigation' },
  { keys: ['Tab'], description: 'Move between sections', category: 'navigation' },

  // Rating
  { keys: ['1-9', '0'], description: 'Set rating (0 = 10)', category: 'rating' },
  { keys: ['\u2191', '\u2193'], description: 'Adjust rating up/down', category: 'rating' },

  // Actions
  { keys: ['Cmd/Ctrl', 'Enter'], description: 'Submit verdict', category: 'actions' },
  { keys: ['Cmd/Ctrl', 'p'], description: 'Preview verdict', category: 'actions' },
  { keys: ['s'], description: 'Skip request', category: 'actions' },
  { keys: ['?'], description: 'Show shortcuts', category: 'actions' },
];

/**
 * Keyboard shortcuts reminder for judges
 * Helps with efficient judging workflow
 */
export function KeyboardShortcuts({ className = '', variant = 'inline', onDismiss }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed before
  useEffect(() => {
    const dismissedKey = 'judge-shortcuts-dismissed';
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
    // Use a microtask to avoid synchronous state update in effect
    Promise.resolve().then(() => {
      setDismissed(wasDismissed);
    });
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('judge-shortcuts-dismissed', 'true');
    setDismissed(true);
    setIsOpen(false);
    onDismiss?.();
  };

  // Register keyboard shortcut to show modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const renderKey = (key: string) => (
    <kbd
      key={key}
      className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-semibold text-gray-700 shadow-sm"
    >
      {key === 'Cmd/Ctrl' ? (
        <>
          <Command className="h-3 w-3" />
          <span className="mx-0.5">/</span>
          <span>Ctrl</span>
        </>
      ) : key === '\u2191' ? (
        <ArrowUp className="h-3 w-3" />
      ) : key === '\u2193' ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        key
      )}
    </kbd>
  );

  // Inline hint (non-intrusive)
  if (variant === 'inline' && !dismissed) {
    return (
      <div className={`flex items-center justify-center gap-2 py-2 text-xs text-gray-500 ${className}`}>
        <Keyboard className="h-3.5 w-3.5" />
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono mx-1">?</kbd> for keyboard shortcuts
        </span>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 ml-1"
          aria-label="Dismiss hint"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Banner version
  if (variant === 'banner' && !dismissed) {
    return (
      <div className={`bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Keyboard className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900">Pro tip: Use keyboard shortcuts for faster judging</p>
            <p className="text-xs text-indigo-700">
              Press <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[10px] font-mono mx-1">?</kbd> to see all shortcuts
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Modal (shown when ? is pressed)
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Keyboard className="h-6 w-6" />
                <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {(['navigation', 'rating', 'actions'] as const).map((category) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {SHORTCUTS.filter((s) => s.category === category).map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              {keyIndex > 0 && <span className="text-gray-400 text-xs mx-1">+</span>}
                              {renderKey(key)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to handle keyboard shortcuts in the judge flow
 */
export function useJudgeKeyboardShortcuts(handlers: {
  onSubmit?: () => void;
  onPreview?: () => void;
  onSkip?: () => void;
  onRatingChange?: (rating: number) => void;
  onBack?: () => void;
  isSubmitDisabled?: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Cmd/Ctrl+Enter even in textarea
        if (!((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
          return;
        }
      }

      // Submit: Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !handlers.isSubmitDisabled) {
        e.preventDefault();
        handlers.onSubmit?.();
        return;
      }

      // Preview: Cmd/Ctrl + p
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        handlers.onPreview?.();
        return;
      }

      // Skip: s key
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.onSkip?.();
        return;
      }

      // Back: Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onBack?.();
        return;
      }

      // Rating: 1-9, 0 for 10
      if (/^[0-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
        const rating = e.key === '0' ? 10 : parseInt(e.key);
        handlers.onRatingChange?.(rating);
        return;
      }

      // Rating adjustment: Arrow keys
      if (e.key === 'ArrowUp') {
        // Would need current rating to implement properly
        return;
      }
      if (e.key === 'ArrowDown') {
        // Would need current rating to implement properly
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
