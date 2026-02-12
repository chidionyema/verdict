'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  MessageSquare,
  User,
  Clock,
  ThumbsUp,
  Edit3,
  Send,
} from 'lucide-react';

interface VerdictPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  rating: number;
  feedback: string;
  tone: 'honest' | 'constructive' | 'encouraging';
  reasons?: string;
  judgeName?: string;
  isSubmitting?: boolean;
}

export function VerdictPreviewModal({
  isOpen,
  onClose,
  onSubmit,
  rating,
  feedback,
  tone,
  reasons,
  judgeName = 'You',
  isSubmitting = false,
}: VerdictPreviewModalProps) {
  if (!isOpen) return null;

  const getToneColor = () => {
    switch (tone) {
      case 'honest':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'constructive':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'encouraging':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRatingEmoji = () => {
    if (rating >= 8) return '😍';
    if (rating >= 6) return '😊';
    if (rating >= 4) return '😐';
    return '😕';
  };

  const getRatingLabel = () => {
    if (rating >= 9) return 'Excellent';
    if (rating >= 7) return 'Good';
    if (rating >= 5) return 'Average';
    if (rating >= 3) return 'Below Average';
    return 'Poor';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Preview Your Verdict</h2>
                  <p className="text-xs text-gray-500">This is how it will appear to the person</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Simulated verdict card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
              {/* Judge info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {judgeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{judgeName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getToneColor()}`}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">{getRatingEmoji()}</span>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < rating ? 'bg-indigo-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">{rating}/10</span>
                    <span className="text-gray-400 ml-2">({getRatingLabel()})</span>
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <p className="text-gray-800 leading-relaxed">{feedback}</p>

                {reasons && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 whitespace-pre-line">{reasons}</p>
                  </div>
                )}
              </div>

              {/* Helpful indicator (preview) */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <ThumbsUp className="h-4 w-4" />
                <span>Was this helpful?</span>
              </div>
            </div>

            {/* Quality indicators */}
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <p className="text-sm font-medium text-green-800 mb-2">Quality Check</p>
              <div className="space-y-2">
                <QualityIndicator
                  label="Feedback length"
                  value={feedback.length}
                  min={50}
                  good={100}
                  excellent={200}
                />
                {reasons && (
                  <QualityIndicator
                    label="Reasoning detail"
                    value={reasons.length}
                    min={40}
                    good={80}
                    excellent={150}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Make Changes
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Verdict
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function QualityIndicator({
  label,
  value,
  min,
  good,
  excellent,
}: {
  label: string;
  value: number;
  min: number;
  good: number;
  excellent: number;
}) {
  const getStatus = () => {
    if (value >= excellent) return { color: 'bg-green-500', text: 'Excellent', textColor: 'text-green-700' };
    if (value >= good) return { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-700' };
    if (value >= min) return { color: 'bg-amber-500', text: 'Minimum', textColor: 'text-amber-700' };
    return { color: 'bg-red-500', text: 'Too short', textColor: 'text-red-700' };
  };

  const status = getStatus();
  const percentage = Math.min((value / excellent) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className={`font-medium ${status.textColor}`}>{status.text}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${status.color} rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{value} chars</span>
    </div>
  );
}
