'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, XCircle, Clock, AlertCircle, Coins } from 'lucide-react';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { toast } from '@/components/ui/toast';

const EDIT_WINDOW_MINUTES = 5;

interface RequestActionsProps {
  requestId: string;
  status: string;
  createdAt: string;
  receivedVerdictCount: number;
  targetVerdictCount: number;
  creditsCharged?: number;
  onStatusChange?: () => void;
  compact?: boolean;
}

function getTimeRemaining(createdAt: string): { canEdit: boolean; minutes: number; seconds: number } {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMs = now - created;
  const windowMs = EDIT_WINDOW_MINUTES * 60 * 1000;
  const remainingMs = Math.max(0, windowMs - elapsedMs);

  return {
    canEdit: remainingMs > 0,
    minutes: Math.floor(remainingMs / 60000),
    seconds: Math.floor((remainingMs % 60000) / 1000),
  };
}

export function RequestActions({
  requestId,
  status,
  createdAt,
  receivedVerdictCount,
  targetVerdictCount,
  creditsCharged = 1,
  onStatusChange,
  compact = false,
}: RequestActionsProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemaining(createdAt));

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const isOpen = status === 'open' || status === 'in_progress';
  const canCancel = isOpen && receivedVerdictCount === 0;
  const canEdit = isOpen && receivedVerdictCount === 0 && timeRemaining.canEdit;

  // Calculate refund amount (pro-rated)
  const deliveredRatio = receivedVerdictCount / targetVerdictCount;
  const refundCredits = Math.ceil(creditsCharged * (1 - deliveredRatio));

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel request');
      }

      toast.success(
        refundCredits > 0
          ? `Request cancelled. ${refundCredits} credit${refundCredits > 1 ? 's' : ''} refunded.`
          : 'Request cancelled successfully.'
      );

      setShowCancelModal(false);
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
    }
  }, [requestId, refundCredits, onStatusChange, router]);

  const handleEdit = useCallback(() => {
    router.push(`/requests/${requestId}/edit`);
  }, [requestId, router]);

  if (!canEdit && !canCancel) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={handleEdit}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title={`Edit (${timeRemaining.minutes}:${timeRemaining.seconds.toString().padStart(2, '0')} left)`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Cancel request"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}

        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          isLoading={isCancelling}
          variant="danger"
          title="Cancel Request?"
          message={
            <div className="space-y-3">
              <p>Are you sure you want to cancel this request?</p>
              {refundCredits > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {refundCredits} credit{refundCredits > 1 ? 's' : ''} will be refunded
                  </span>
                </div>
              )}
            </div>
          }
          confirmText="Yes, Cancel Request"
          cancelText="Keep Request"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">Request Actions</h3>

      {/* Edit Action */}
      {canEdit && (
        <div className="space-y-2">
          <button
            onClick={handleEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium hover:bg-indigo-100 transition min-h-[44px]"
          >
            <Edit2 className="h-4 w-4" />
            Edit Request
          </button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} remaining to edit
            </span>
          </div>
        </div>
      )}

      {/* Edit window expired notice */}
      {isOpen && receivedVerdictCount === 0 && !timeRemaining.canEdit && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>Edit window has expired. You can still cancel this request.</span>
        </div>
      )}

      {/* Cancel Action */}
      {canCancel && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition min-h-[44px]"
        >
          <XCircle className="h-4 w-4" />
          Cancel Request
        </button>
      )}

      {/* Cannot cancel notice */}
      {isOpen && receivedVerdictCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            Cannot cancel: {receivedVerdictCount} verdict{receivedVerdictCount > 1 ? 's' : ''} already received.
          </span>
        </div>
      )}

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        variant="danger"
        title="Cancel Request?"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to cancel this request? This action cannot be undone.</p>
            {refundCredits > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  {refundCredits} credit{refundCredits > 1 ? 's' : ''} will be refunded to your account
                </span>
              </div>
            )}
          </div>
        }
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
      />
    </div>
  );
}
