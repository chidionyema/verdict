'use client';

import Link from 'next/link';
import { forwardRef } from 'react';

interface SmartLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
}

/**
 * SmartLink - A wrapper around Next.js Link for consistent navigation behavior.
 * Provides a unified interface for links throughout the app.
 */
export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ href, children, className, prefetch = true, ...props }, ref) => {
    return (
      <Link
        href={href}
        className={className}
        prefetch={prefetch}
        ref={ref}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

SmartLink.displayName = 'SmartLink';
