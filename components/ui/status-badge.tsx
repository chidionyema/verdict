'use client';

import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Pause, 
  Play, 
  Eye,
  Users,
  DollarSign
} from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'pending' | 'completed' | 'error' | 'processing' | 'reviewing';
  label: string;
  subtitle?: string;
  count?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  subtitle,
  count,
  showIcon = true,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: Play,
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        };
      case 'processing':
        return {
          icon: Eye,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-600'
        };
      case 'reviewing':
        return {
          icon: Users,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-2 py-1',
          text: 'text-xs',
          iconSize: 'w-3 h-3',
          gap: 'gap-1'
        };
      case 'lg':
        return {
          padding: 'px-4 py-2',
          text: 'text-sm',
          iconSize: 'w-5 h-5',
          gap: 'gap-2'
        };
      default:
        return {
          padding: 'px-3 py-1.5',
          text: 'text-xs',
          iconSize: 'w-4 h-4',
          gap: 'gap-1.5'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();
  const Icon = statusConfig.icon;

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      <div
        className={`
          inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding}
          ${sizeConfig.text} font-medium rounded-full border
          ${statusConfig.color} transition-colors
        `}
      >
        {showIcon && (
          <Icon className={`${sizeConfig.iconSize} ${statusConfig.iconColor}`} />
        )}
        <span>{label}</span>
        {count !== undefined && (
          <span className="ml-1 font-normal">
            ({count})
          </span>
        )}
      </div>

      {subtitle && (
        <span className={`${sizeConfig.text} text-gray-600 ml-2`}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

// Specialized status badges for common use cases
export function JudgeStatusBadge({ 
  isAvailable, 
  queueCount = 0,
  earningsToday = 0 
}: { 
  isAvailable: boolean; 
  queueCount?: number;
  earningsToday?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <StatusBadge
        status={isAvailable ? 'active' : 'paused'}
        label={isAvailable ? 'Judging Active' : 'Judging Paused'}
        subtitle={`${queueCount} requests waiting`}
        size="md"
      />
      {earningsToday > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>${earningsToday.toFixed(2)} today</span>
        </div>
      )}
    </div>
  );
}

export function RequestStatusBadge({ 
  status, 
  verdictCount, 
  targetCount = 10 
}: { 
  status: string;
  verdictCount: number;
  targetCount?: number;
}) {
  const getRequestStatus = () => {
    if (verdictCount >= targetCount) return 'completed';
    if (verdictCount > 0) return 'processing';
    return 'pending';
  };

  const requestStatus = getRequestStatus();
  
  const getLabel = () => {
    switch (requestStatus) {
      case 'completed':
        return 'Complete';
      case 'processing':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  return (
    <StatusBadge
      status={requestStatus}
      label={getLabel()}
      subtitle={`${verdictCount}/${targetCount} verdicts`}
      size="sm"
    />
  );
}

export function PaymentStatusBadge({ 
  status 
}: { 
  status: 'paid' | 'pending' | 'failed' | 'processing' 
}) {
  const getPaymentStatus = () => {
    switch (status) {
      case 'paid':
        return { status: 'completed' as const, label: 'Paid' };
      case 'failed':
        return { status: 'error' as const, label: 'Failed' };
      case 'processing':
        return { status: 'processing' as const, label: 'Processing' };
      default:
        return { status: 'pending' as const, label: 'Pending' };
    }
  };

  const { status: badgeStatus, label } = getPaymentStatus();

  return (
    <StatusBadge
      status={badgeStatus}
      label={label}
      size="sm"
    />
  );
}