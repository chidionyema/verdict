// Accessibility utilities and hooks for WCAG 2.1 AA compliance

import * as React from 'react';

// Focus management utilities
export class FocusManager {
  private static focusHistory: HTMLElement[] = [];

  // Trap focus within a container (for modals, dialogs)
  static trapFocus(container: HTMLElement, initialFocus?: HTMLElement) {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus initial element or first focusable element
    (initialFocus || firstElement).focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }

  // Get all focusable elements within a container
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])', 
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
      'details summary'
    ].join(',');

    const elements = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    
    return Array.from(elements).filter(element => {
      return element.offsetParent !== null && // Element is visible
             !element.hasAttribute('inert') &&
             !element.closest('[inert]');
    });
  }

  // Save current focus to restore later
  static saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusHistory.push(activeElement);
    }
  }

  // Restore previously saved focus
  static restoreFocus() {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  // Focus first element with error
  static focusFirstError(container: HTMLElement = document.body) {
    const errorElement = container.querySelector('[aria-invalid="true"], .error-field');
    if (errorElement instanceof HTMLElement) {
      errorElement.focus();
      return true;
    }
    return false;
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  // Announce message to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.getElementById('screen-reader-announcer');
    
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }

  // Create screen reader announcer element (call once on app init)
  static createAnnouncer() {
    if (document.getElementById('screen-reader-announcer')) return;
    
    const announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcer);
  }

  // Generate unique IDs for form associations
  static generateId(prefix = 'element'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Keyboard navigation utilities
export class KeyboardNav {
  // Common key codes for navigation
  static readonly KEYS = {
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown'
  } as const;

  // Handle arrow key navigation in lists/menus
  static handleArrowKeyNavigation(
    event: KeyboardEvent, 
    elements: HTMLElement[],
    currentIndex: number,
    loop = true
  ): number {
    let newIndex = currentIndex;

    switch (event.key) {
      case this.KEYS.ARROW_UP:
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? elements.length - 1 : 0);
        break;
      
      case this.KEYS.ARROW_DOWN:
        event.preventDefault();
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : (loop ? 0 : elements.length - 1);
        break;
      
      case this.KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      
      case this.KEYS.END:
        event.preventDefault();
        newIndex = elements.length - 1;
        break;
    }

    if (newIndex !== currentIndex && elements[newIndex]) {
      elements[newIndex].focus();
    }

    return newIndex;
  }
}

// Color contrast utilities
export class ContrastUtils {
  // Calculate relative luminance
  private static getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Convert hex to RGB
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate contrast ratio between two colors
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Check if color combination meets WCAG standards
  static meetsWCAG(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): {
    normal: boolean;
    large: boolean;
  } {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return {
        normal: ratio >= 7,
        large: ratio >= 4.5
      };
    }
    
    return {
      normal: ratio >= 4.5,
      large: ratio >= 3
    };
  }
}

// Custom hooks for accessibility
export function useAccessibleForm() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const announceErrors = React.useCallback(() => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      ScreenReaderUtils.announce(
        `Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct.`,
        'assertive'
      );
    }
  }, [errors]);

  const setFieldError = React.useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = React.useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldTouched = React.useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    announceErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}

export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const itemRefs = React.useRef<(HTMLElement | null)[]>([]);

  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    const newIndex = KeyboardNav.handleArrowKeyNavigation(
      event,
      itemRefs.current.filter(Boolean) as HTMLElement[],
      activeIndex
    );

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    if (event.key === KeyboardNav.KEYS.ENTER && onSelect) {
      onSelect(activeIndex);
    }
  }, [activeIndex, onSelect]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const setItemRef = React.useCallback((index: number, element: HTMLElement | null) => {
    itemRefs.current[index] = element;
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    setItemRef,
    itemRefs: itemRefs.current
  };
}

export function useFocusTrap(isActive: boolean = true) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    FocusManager.saveFocus();
    
    const cleanup = FocusManager.trapFocus(container);
    
    return () => {
      cleanup?.();
      FocusManager.restoreFocus();
    };
  }, [isActive]);

  return containerRef;
}

export function useAnnouncements() {
  const announce = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    ScreenReaderUtils.announce(message, priority);
  }, []);

  return { announce };
}

// Skip link component for keyboard users
export function SkipLink({ 
  href = "#main-content",
  children = "Skip to main content"
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium z-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

// Screen reader only text component
export function ScreenReaderOnly({ 
  children,
  as: Component = 'span'
}: {
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

// Live region component for dynamic content
export function LiveRegion({
  children,
  level = 'polite',
  atomic = false,
  className
}: {
  children: React.ReactNode;
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      className={className}
    >
      {children}
    </div>
  );
}

// Initialize accessibility features
export function initializeAccessibility() {
  ScreenReaderUtils.createAnnouncer();
  
  // Add global styles for accessibility
  const styles = document.createElement('style');
  styles.textContent = `
    /* Screen reader only content */
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    
    /* Focus indicators */
    *:focus-visible {
      outline: 2px solid #4f46e5 !important;
      outline-offset: 2px !important;
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  
  document.head.appendChild(styles);
}

// Export all accessibility utilities
export const a11y = {
  focus: FocusManager,
  screenReader: ScreenReaderUtils,
  keyboard: KeyboardNav,
  contrast: ContrastUtils,
  init: initializeAccessibility
};