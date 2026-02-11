'use client';

import { ThemeProvider, useTheme } from './ThemeProvider';
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
      {children}
      <GlobalUIComponents />
    </ThemeProvider>
  );
}

export { ThemeProvider, useTheme } from './ThemeProvider';
