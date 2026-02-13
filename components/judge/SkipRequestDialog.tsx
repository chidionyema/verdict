'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  SkipForward,
  Clock,
  Users,
  Lightbulb,
  Check,
  ChevronRight,
  Heart,
} from 'lucide-react';

interface SkipRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: (reason?: string) => void;
  queueCount?: number;
}

const SKIP_REASONS = [
  { id: 'not_expertise', label: "Not my area of expertise", icon: Lightbulb },
  { id: 'time_constraint', label: "Don't have time right now", icon: Clock },
  { id: 'need_break', label: "Taking a short break", icon: Heart },
  { id: 'unclear', label: "Request is unclear", icon: Users },
  { id: 'other', label: "Other reason", icon: ChevronRight },
];

/**
 * Skip request dialog with guilt-free messaging
 * Encourages judges to skip when appropriate without feeling bad
 */
export function SkipRequestDialog({
  isOpen,
  onClose,
  onSkip,
  queueCount = 0,
}: SkipRequestDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSkip = () => {
    onSkip(selectedReason || undefined);
    setSelectedReason(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <SkipForward className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Skip this request?</h2>
                <p className="text-xs text-gray-500">No worries - it happens!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Reassurance message */}
          <div className="px-6 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    It&apos;s totally okay to skip!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Skipping helps ensure the right judge sees each request.
                    {queueCount > 0 && (
                      <> There are <strong>{queueCount} other requests</strong> waiting for you.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason selection (optional) */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-3">
              Help us improve (optional):
            </p>
            <div className="space-y-2">
              {SKIP_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;

                return (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(isSelected ? null : reason.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                      {reason.label}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Stay on this request
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip to next
            </button>
          </div>

          {/* Stats note */}
          <div className="px-6 py-3 bg-gray-100 text-center">
            <p className="text-[10px] text-gray-500">
              Skipping doesn&apos;t affect your stats or streak
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline skip button with tooltip
 */
interface SkipButtonProps {
  onClick: () => void;
  className?: string;
  showTooltip?: boolean;
}

export function SkipButton({ onClick, className = '', showTooltip = true }: SkipButtonProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        className={`flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors ${className}`}
      >
        <SkipForward className="h-4 w-4" />
        <span className="text-sm font-medium">Skip</span>
      </button>

      {showTooltip && showHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
          It&apos;s okay to skip - no penalty!
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
