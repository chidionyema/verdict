'use client';

import { ThemeProvider, useTheme } from './ThemeProvider';
import { LoadingProvider } from './LoadingProvider';
import { NetworkStatusProvider } from './NetworkStatusProvider';
import { CelebrationProvider } from '@/components/ui/Celebrations';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

function GlobalUIComponents() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <>
      <CommandPalette
        onToggleTheme={toggleTheme}
        currentTheme={resolvedTheme}
      />
      <KeyboardShortcutsModal />
    </>
  );
}

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NetworkStatusProvider>
        <LoadingProvider>
          <CelebrationProvider>
            {children}
            <GlobalUIComponents />
          </CelebrationProvider>
        </LoadingProvider>
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}

export { ThemeProvider, useTheme } from './ThemeProvider';
export { LoadingProvider, useLoading, useLoadingOperation, useAsyncOperation, LoadingSpinner } from './LoadingProvider';
export { NetworkStatusProvider, useNetworkStatus, useNetworkFetch, OfflineIndicator } from './NetworkStatusProvider';
