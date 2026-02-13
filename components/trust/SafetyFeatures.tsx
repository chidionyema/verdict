'use client';

import { useState } from 'react';
import { Flag, Ban, FileText, AlertTriangle, Shield, CheckCircle, X, ExternalLink, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';

// Block/Don't Match Modal
interface BlockJudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  judgeId: string;
  judgeName?: string;
  onBlock: (judgeId: string, reason: string) => Promise<void>;
}

export function BlockJudgeModal({
  isOpen,
  onClose,
  judgeId,
  judgeName = 'this judge',
  onBlock,
}: BlockJudgeModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onBlock(judgeId, reason);
      toast.success(`You won't be matched with ${judgeName} again`);
      onClose();
    } catch (error) {
      toast.error('Failed to block judge');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Don&apos;t Match Me With This Judge
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You won&apos;t be matched with this judge on future requests. Your current feedback from them will remain.
        </p>

        <div className="space-y-2 mb-6">
          <p className="text-sm font-medium text-gray-700">Why do you want to avoid this judge?</p>
          {[
            { value: 'unhelpful', label: 'Their feedback wasn\'t helpful' },
            { value: 'inappropriate', label: 'Inappropriate or offensive comments' },
            { value: 'style', label: 'Feedback style doesn\'t match my needs' },
            { value: 'other', label: 'Other reason' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={option.value}
                checked={reason === option.value}
                onChange={(e) => setReason(e.target.value)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-600">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Blocking...' : 'Block Judge'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Note: If the judge violated our guidelines, please also{' '}
          <button className="text-red-600 hover:underline">report them</button>.
        </p>
      </div>
    </div>
  );
}

// Block Judge Button
interface BlockJudgeButtonProps {
  judgeId: string;
  judgeName?: string;
  onBlock: (judgeId: string, reason: string) => Promise<void>;
  size?: 'sm' | 'md';
  className?: string;
}

export function BlockJudgeButton({
  judgeId,
  judgeName,
  onBlock,
  size = 'sm',
  className = '',
}: BlockJudgeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition ${
          size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'
        } ${className}`}
        title="Don't match me with this judge"
      >
        <Ban className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {size !== 'sm' && <span>Don&apos;t Match</span>}
      </button>

      <BlockJudgeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        judgeId={judgeId}
        judgeName={judgeName}
        onBlock={onBlock}
      />
    </>
  );
}

// Quick Report Button (enhanced version)
interface QuickReportButtonProps {
  contentType: 'verdict' | 'request' | 'judge' | 'message';
  contentId: string;
  onReport?: (contentId: string, reason: string) => Promise<void>;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function QuickReportButton({
  contentType,
  contentId,
  onReport,
  size = 'sm',
  variant = 'icon',
  className = '',
}: QuickReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onReport) {
        await onReport(contentId, reason);
      } else {
        // Default API call
        await fetch('/api/moderation/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType, contentId, reason, description: details }),
        });
      }
      setHasReported(true);
      toast.success('Report submitted. We\'ll review it shortly.');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasReported) {
    return (
      <span className={`text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}>
        Reported
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        } ${className}`}
        title={`Report this ${contentType}`}
      >
        <Flag className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {variant !== 'icon' && <span>Report</span>}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Report {contentType}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">What&apos;s wrong?</p>
                <div className="space-y-2">
                  {[
                    { value: 'inappropriate', label: 'Inappropriate content' },
                    { value: 'offensive', label: 'Offensive or harassing' },
                    { value: 'spam', label: 'Spam or promotional' },
                    { value: 'unhelpful', label: 'Low quality / unhelpful' },
                    { value: 'other', label: 'Other' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                  placeholder="Tell us more about the issue..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Reports are reviewed within 24 hours
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Content Guidelines Link Component
export function ContentGuidelinesLink({
  variant = 'text',
  className = '',
}: {
  variant?: 'text' | 'badge' | 'card';
  className?: string;
}) {
  if (variant === 'badge') {
    return (
      <Link
        href="/legal/community-guidelines"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition ${className}`}
      >
        <FileText className="h-4 w-4" />
        Community Guidelines
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        href="/legal/community-guidelines"
        className={`block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">Community Guidelines</h4>
            <p className="text-sm text-gray-600">
              Learn about our standards for feedback and content
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/legal/community-guidelines"
      className={`inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      <FileText className="h-4 w-4" />
      Community Guidelines
    </Link>
  );
}

// Appeal Process Info
export function AppealProcessInfo({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h4 className="font-medium text-amber-900 mb-1">Appeals Process</h4>
          <p className="text-sm text-amber-700 mb-2">
            If you believe a moderation action was taken in error, you can appeal within 30 days.
          </p>
          <Link
            href="/help/appeals"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            Learn about appeals
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Safety Footer for sensitive pages
export function SafetyFooter({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 border-t border-gray-200 py-4 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
        <Link href="/legal/community-guidelines" className="hover:text-gray-700 flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Guidelines
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/legal/privacy" className="hover:text-gray-700 flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Privacy
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/legal/terms" className="hover:text-gray-700 flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Terms
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/help" className="hover:text-gray-700 flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          Help
        </Link>
      </div>
    </div>
  );
}
