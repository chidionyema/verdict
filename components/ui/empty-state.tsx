'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tips?: string[];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tips,
  className = '',
}: EmptyStateProps) {
  const ActionButton = actionHref ? Link : 'button';
  const actionProps = actionHref
    ? { href: actionHref, className: 'inline-block' }
    : { onClick: onAction, type: 'button' as const };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-12 text-center ${className}`}>
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-12 w-12 text-indigo-600" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      {(actionLabel && (actionHref || onAction)) && (
        <ActionButton
          {...actionProps}
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg min-h-[48px]"
        >
          {actionLabel}
        </ActionButton>
      )}

      {tips && tips.length > 0 && (
        <div className="mt-8 space-y-2">
          {tips.map((tip, index) => (
            <p key={index} className="text-sm text-gray-500">
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

