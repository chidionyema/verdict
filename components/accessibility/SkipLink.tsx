'use client';

/**
 * SkipLink - Accessibility component for keyboard navigation
 *
 * Provides a hidden link that becomes visible on focus, allowing
 * keyboard users to skip directly to main content without tabbing
 * through the entire navigation.
 *
 * Usage: Add <SkipLink /> at the top of your layout, and ensure
 * your main content has id="main-content"
 */

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content'
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-indigo-600 focus:text-white
        focus:rounded-lg focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
        transition-all
      "
    >
      {label}
    </a>
  );
}

export default SkipLink;
