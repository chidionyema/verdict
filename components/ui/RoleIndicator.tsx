'use client';

import { Eye, Edit3 } from 'lucide-react';

interface RoleIndicatorProps {
  role: 'reviewer' | 'submitter';
  className?: string;
}

/**
 * Visual indicator showing which mode/role the user is currently in
 * Helps with cross-journey clarity
 */
export function RoleIndicator({ role, className = '' }: RoleIndicatorProps) {
  const config = {
    reviewer: {
      label: 'Reviewer Mode',
      description: 'Earning by reviewing',
      icon: Eye,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
    },
    submitter: {
      label: 'Submit Mode',
      description: 'Getting feedback',
      icon: Edit3,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      iconColor: 'text-indigo-600',
    },
  };

  const { label, description, icon: Icon, bgColor, borderColor, textColor, iconColor } = config[role];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor} ${borderColor} border ${className}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
      </div>
    </div>
  );
}

/**
 * Compact badge version for tight spaces
 */
export function RoleBadge({ role, className = '' }: RoleIndicatorProps) {
  const isReviewer = role === 'reviewer';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isReviewer
        ? 'bg-green-100 text-green-700'
        : 'bg-indigo-100 text-indigo-700'
    } ${className}`}>
      {isReviewer ? <Eye className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
      {isReviewer ? 'Reviewing' : 'Submitting'}
    </span>
  );
}
