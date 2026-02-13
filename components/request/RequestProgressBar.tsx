'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Users, Loader2, XCircle, Edit3 } from 'lucide-react';

type RequestStatus = 'draft' | 'open' | 'in_progress' | 'closed' | 'completed' | 'cancelled';

interface RequestProgressBarProps {
  status: RequestStatus | string;
  receivedCount: number;
  targetCount: number;
  createdAt: string;
  showETA?: boolean;
  animate?: boolean;
  compact?: boolean;
}

const STATUS_ORDER: RequestStatus[] = ['draft', 'open', 'in_progress', 'closed'];

function normalizeStatus(status: string): RequestStatus {
  if (status === 'completed') return 'closed';
  return status as RequestStatus;
}

function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Edit3,
        step: 0,
      };
    case 'open':
      return {
        label: 'Open',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Clock,
        step: 1,
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Loader2,
        step: 2,
      };
    case 'closed':
    case 'completed':
      return {
        label: 'Complete',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
        step: 3,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        step: -1,
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Clock,
        step: 0,
      };
  }
}

function calculateETA(createdAt: string, receivedCount: number, targetCount: number): string {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  if (receivedCount >= targetCount) return 'Complete';
  if (receivedCount === 0) return 'Usually 1-2 hours';

  // Calculate rate and estimate remaining time
  const ratePerHour = receivedCount / hoursElapsed;
  const remaining = targetCount - receivedCount;
  const estimatedHours = ratePerHour > 0 ? remaining / ratePerHour : 2;

  if (estimatedHours < 0.5) return '< 30 min';
  if (estimatedHours < 1) return '~30-60 min';
  if (estimatedHours < 2) return '~1-2 hours';
  return `~${Math.ceil(estimatedHours)} hours`;
}

export function RequestProgressBar({
  status,
  receivedCount,
  targetCount,
  createdAt,
  showETA = true,
  animate = true,
  compact = false,
}: RequestProgressBarProps) {
  const normalizedStatus = normalizeStatus(status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const progress = targetCount > 0 ? Math.min((receivedCount / targetCount) * 100, 100) : 0;
  const isComplete = receivedCount >= targetCount;
  const isCancelled = normalizedStatus === 'cancelled';

  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animate]);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isComplete
                ? 'bg-green-500'
                : isCancelled
                ? 'bg-red-400'
                : 'bg-indigo-500'
            } ${animate && receivedCount > 0 && !isComplete && !isCancelled ? 'animate-pulse' : ''}`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        {/* Count */}
        <span className="text-sm font-medium text-gray-600 tabular-nums">
          {receivedCount}/{targetCount}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status badge and count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
            <statusConfig.icon className={`h-4 w-4 ${normalizedStatus === 'in_progress' && !isCancelled ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </span>
          {showETA && !isComplete && !isCancelled && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {calculateETA(createdAt, receivedCount, targetCount)}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900">{receivedCount}</span>
          <span className="text-gray-400"> / </span>
          <span className="text-gray-600">{targetCount}</span>
          <span className="text-sm text-gray-500 ml-1">verdicts</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isComplete
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : isCancelled
                ? 'bg-red-400'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            } ${animate && receivedCount > 0 && !isComplete && !isCancelled ? 'relative overflow-hidden' : ''}`}
            style={{ width: `${animatedProgress}%` }}
          >
            {/* Shimmer effect for in-progress */}
            {animate && receivedCount > 0 && !isComplete && !isCancelled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* Milestone markers */}
        {targetCount > 1 && (
          <div className="absolute top-0 left-0 right-0 h-3 flex justify-between pointer-events-none px-[1px]">
            {[...Array(targetCount - 1)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-full bg-white/50"
                style={{ marginLeft: `${((i + 1) / targetCount) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live activity indicator */}
      {!isComplete && !isCancelled && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </div>
          <span>
            {receivedCount === 0
              ? 'Judges are reviewing your submission'
              : `${targetCount - receivedCount} more verdict${targetCount - receivedCount !== 1 ? 's' : ''} expected`}
          </span>
        </div>
      )}

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Status badge component for use in lists
export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <config.icon className={`h-3 w-3 ${normalizedStatus === 'in_progress' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}
