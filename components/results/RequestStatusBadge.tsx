'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

type RequestStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  receivedCount: number;
  targetCount: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

const statusConfig: Record<
  RequestStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof CheckCircle;
    animate?: boolean;
  }
> = {
  open: {
    label: 'Open',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Clock,
    animate: true,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Loader2,
    animate: true,
  },
  closed: {
    label: 'Complete',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    animate: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: XCircle,
    animate: false,
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    icon: 'h-4 w-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'h-5 w-5',
    gap: 'gap-2',
  },
};

export function RequestStatusBadge({
  status,
  receivedCount,
  targetCount,
  size = 'md',
  showProgress = false,
  className = '',
}: RequestStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;
  const progress = targetCount > 0 ? (receivedCount / targetCount) * 100 : 0;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center ${sizes.gap} ${sizes.padding} ${config.bgColor} ${config.color} ${sizes.text} font-medium rounded-full border ${config.borderColor}`}
      >
        <Icon
          className={`${sizes.icon} ${config.animate && status === 'in_progress' ? 'animate-spin' : ''}`}
        />
        <span>{config.label}</span>
        {showProgress && targetCount > 0 && (
          <span className="opacity-70">
            ({receivedCount}/{targetCount})
          </span>
        )}
      </motion.div>

      {/* Mini progress bar for in_progress status */}
      {showProgress && (status === 'open' || status === 'in_progress') && targetCount > 0 && (
        <div className="mt-1 w-full">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${
                status === 'open' ? 'bg-blue-500' : 'bg-amber-500'
              } rounded-full`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified status indicator for lists
export function StatusDot({ status }: { status: RequestStatus }) {
  const config = statusConfig[status];

  return (
    <span className="relative flex h-3 w-3">
      {config.animate && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-75`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${
          status === 'open'
            ? 'bg-blue-500'
            : status === 'in_progress'
            ? 'bg-amber-500'
            : status === 'closed'
            ? 'bg-green-500'
            : 'bg-gray-400'
        }`}
      />
    </span>
  );
}
