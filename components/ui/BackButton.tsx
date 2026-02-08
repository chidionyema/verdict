'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  /** If true, uses router.back() instead of navigating to href */
  useHistory?: boolean;
}

/**
 * BackButton - Standardized back navigation component
 *
 * Usage:
 * - <BackButton href="/dashboard" label="Back to Dashboard" />
 * - <BackButton useHistory label="Go Back" />
 *
 * Features:
 * - Consistent styling across the app
 * - Accessible with proper touch target (min 44px height)
 * - Uses ArrowLeft icon for visual consistency
 * - Supports both Link navigation and history.back()
 */
export function BackButton({
  href,
  label = 'Go Back',
  className = '',
  useHistory = false
}: BackButtonProps) {
  const router = useRouter();

  const baseStyles = `inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] text-sm font-medium ${className}`;

  if (useHistory) {
    return (
      <button
        onClick={() => router.back()}
        className={baseStyles}
        aria-label={label}
      >
        <ArrowLeft className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  if (!href) {
    console.warn('BackButton: Either href or useHistory must be provided');
    return null;
  }

  return (
    <Link href={href} className={baseStyles} aria-label={label}>
      <ArrowLeft className="h-5 w-5 mr-2 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default BackButton;
