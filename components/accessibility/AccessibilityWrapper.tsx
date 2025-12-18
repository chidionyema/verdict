'use client';

import { useEffect } from 'react';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add skip navigation link
    const skipNav = document.createElement('a');
    skipNav.href = '#main-content';
    skipNav.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-md z-50';
    skipNav.textContent = 'Skip to main content';
    document.body.insertBefore(skipNav, document.body.firstChild);

    // Set up focus management
    const handleRouteChange = () => {
      // Announce page change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.className = 'sr-only';
      announcement.textContent = 'Page loaded';
      document.body.appendChild(announcement);
      
      setTimeout(() => announcement.remove(), 1000);
      
      // Focus main content
      const main = document.getElementById('main-content');
      if (main) {
        main.focus();
      }
    };

    // Set up keyboard navigation helpers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press '/' to focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput instanceof HTMLInputElement) {
          e.preventDefault();
          searchInput.focus();
        }
      }

      // Press '?' to show keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showKeyboardShortcuts();
      }
    };

    // Ensure proper heading hierarchy
    const checkHeadingHierarchy = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);
        if (level > lastLevel + 1 && lastLevel !== 0) {
          console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${lastLevel}`);
        }
        lastLevel = level;
      });
    };

    // Add ARIA labels to interactive elements
    const enhanceAccessibility = () => {
      // Add labels to icon-only buttons
      document.querySelectorAll('button:not([aria-label])').forEach((button) => {
        if (!button.textContent?.trim()) {
          const icon = button.querySelector('svg');
          if (icon) {
            const iconClass = icon.getAttribute('class') || '';
            if (iconClass.includes('x-')) button.setAttribute('aria-label', 'Close');
            else if (iconClass.includes('menu')) button.setAttribute('aria-label', 'Menu');
            else if (iconClass.includes('search')) button.setAttribute('aria-label', 'Search');
          }
        }
      });

      // Ensure all images have alt text
      document.querySelectorAll('img:not([alt])').forEach((img) => {
        img.setAttribute('alt', '');
      });

      // Add aria-current to active navigation items
      const currentPath = window.location.pathname;
      document.querySelectorAll('nav a').forEach((link) => {
        if (link.getAttribute('href') === currentPath) {
          link.setAttribute('aria-current', 'page');
        }
      });
    };

    // Set up intersection observer for lazy-loaded content
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (element.hasAttribute('data-lazy-load')) {
            // Announce lazy-loaded content to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = 'New content loaded';
            element.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
          }
        }
      });
    }, observerOptions);

    // Observe lazy-loaded elements
    document.querySelectorAll('[data-lazy-load]').forEach(el => {
      observer.observe(el);
    });

    // Run initial checks and setup
    handleRouteChange();
    checkHeadingHierarchy();
    enhanceAccessibility();

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
      skipNav.remove();
    };
  }, []);

  const showKeyboardShortcuts = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Keyboard shortcuts');
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="font-medium">Focus search</dt>
            <dd class="text-gray-600"><kbd class="px-2 py-1 bg-gray-100 rounded">/</kbd></dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Show shortcuts</dt>
            <dd class="text-gray-600"><kbd class="px-2 py-1 bg-gray-100 rounded">?</kbd></dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Navigate</dt>
            <dd class="text-gray-600"><kbd class="px-2 py-1 bg-gray-100 rounded">Tab</kbd></dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Go back</dt>
            <dd class="text-gray-600"><kbd class="px-2 py-1 bg-gray-100 rounded">Shift + Tab</kbd></dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium">Activate</dt>
            <dd class="text-gray-600"><kbd class="px-2 py-1 bg-gray-100 rounded">Enter</kbd> or <kbd class="px-2 py-1 bg-gray-100 rounded">Space</kbd></dd>
          </div>
        </dl>
        <button class="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" onclick="this.closest('[role=dialog]').remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the close button
    const closeButton = modal.querySelector('button');
    closeButton?.focus();
    
    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        window.removeEventListener('keydown', handleEscape);
      }
    };
    window.addEventListener('keydown', handleEscape);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  return (
    <>
      {children}
      <style jsx global>{`
        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        /* Show on focus */
        .focus\\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
        
        /* Focus styles */
        *:focus {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-gradient-to-r {
            background: #000 !important;
          }
          
          button {
            border: 2px solid currentColor !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Focus visible for keyboard navigation */
        .focus\\:ring-2:focus-visible {
          box-shadow: 0 0 0 2px #4f46e5;
        }
        
        /* Ensure interactive elements are large enough */
        button, a, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Color contrast improvements */
        .text-gray-500 {
          color: #4b5563; /* Higher contrast */
        }
        
        .text-gray-600 {
          color: #374151; /* Higher contrast */
        }
      `}</style>
    </>
  );
}