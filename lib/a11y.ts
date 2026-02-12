// Accessibility utilities for Verdict
// Shared focus classes and accessibility helpers

// Standard focus ring for all interactive elements
export const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

// Focus ring variants
export const focusRingInset = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset';
export const focusRingWhite = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600';

// Minimum touch target (WCAG 2.1 Level AA)
export const touchTarget = 'min-h-[44px] min-w-[44px]';
export const touchTargetCompact = 'min-h-[40px] min-w-[40px]';

// Interactive element base styles
export const interactiveBase = `${focusRing} ${touchTarget} touch-manipulation`;

// Screen reader only (visually hidden)
export const srOnly = 'sr-only';

// Skip to main content link styles
export const skipLink = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-indigo-600 focus:rounded-lg focus:shadow-lg';

// Common ARIA attributes for better screen reader support
export const ariaLabels = {
  closeModal: 'Close modal',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  loading: 'Loading',
  submit: 'Submit',
  cancel: 'Cancel',
  previous: 'Previous',
  next: 'Next',
  expandMore: 'Show more',
  expandLess: 'Show less',
  notifications: 'Notifications',
  profile: 'Profile menu',
  search: 'Search',
  filter: 'Filter options',
  sort: 'Sort options',
  refresh: 'Refresh',
  share: 'Share',
  like: 'Like',
  bookmark: 'Bookmark',
  settings: 'Settings',
  help: 'Help',
} as const;

// Live region announcer for dynamic content
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', politeness);
  announcer.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announcer);
  return announcer;
}

// Focus trap utility for modals
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => element.removeEventListener('keydown', handleKeyDown);
}

// Reduced motion preference check
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast preference check
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}
