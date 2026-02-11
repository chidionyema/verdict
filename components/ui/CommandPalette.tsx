'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  FileText,
  Gavel,
  Plus,
  Settings,
  User,
  HelpCircle,
  CreditCard,
  Bell,
  LogOut,
  Moon,
  Sun,
  Keyboard,
  TrendingUp,
  BarChart3,
  Folder,
  Award,
  ArrowRight,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
  category: 'navigation' | 'actions' | 'settings' | 'help';
}

interface CommandPaletteProps {
  onToggleTheme?: () => void;
  currentTheme?: 'light' | 'dark' | 'system';
}

export function CommandPalette({ onToggleTheme, currentTheme = 'light' }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Command items
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'home',
      label: 'Go to Dashboard',
      description: 'View your dashboard',
      icon: Home,
      action: () => router.push('/dashboard'),
      keywords: ['home', 'dashboard', 'main'],
      shortcut: 'G D',
      category: 'navigation',
    },
    {
      id: 'judge',
      label: 'Go to Judge Queue',
      description: 'Start reviewing submissions',
      icon: Gavel,
      action: () => router.push('/judge'),
      keywords: ['judge', 'review', 'queue', 'earn'],
      shortcut: 'G J',
      category: 'navigation',
    },
    {
      id: 'requests',
      label: 'My Requests',
      description: 'View your submitted requests',
      icon: FileText,
      action: () => router.push('/dashboard?tab=seeker'),
      keywords: ['requests', 'submissions', 'my'],
      category: 'navigation',
    },
    {
      id: 'earnings',
      label: 'View Earnings',
      description: 'Check your judge earnings',
      icon: TrendingUp,
      action: () => router.push('/judge/earnings'),
      keywords: ['earnings', 'money', 'payout', 'income'],
      category: 'navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View your performance analytics',
      icon: BarChart3,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'stats', 'performance', 'metrics'],
      category: 'navigation',
    },
    {
      id: 'account',
      label: 'Account Settings',
      description: 'Manage your account',
      icon: User,
      action: () => router.push('/account'),
      keywords: ['account', 'profile', 'settings', 'user'],
      shortcut: 'G S',
      category: 'navigation',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'View your notifications',
      icon: Bell,
      action: () => router.push('/notifications'),
      keywords: ['notifications', 'alerts', 'messages'],
      category: 'navigation',
    },

    // Actions
    {
      id: 'new-request',
      label: 'New Request',
      description: 'Create a new feedback request',
      icon: Plus,
      action: () => router.push('/submit'),
      keywords: ['new', 'create', 'submit', 'request', 'feedback'],
      shortcut: 'N',
      category: 'actions',
    },
    {
      id: 'start-judging',
      label: 'Start Judging',
      description: 'Begin reviewing to earn credits',
      icon: Gavel,
      action: () => router.push('/judge'),
      keywords: ['judge', 'start', 'earn', 'review'],
      shortcut: 'J',
      category: 'actions',
    },
    {
      id: 'buy-credits',
      label: 'Buy Credits',
      description: 'Purchase more credits',
      icon: CreditCard,
      action: () => router.push('/pricing'),
      keywords: ['buy', 'credits', 'purchase', 'payment'],
      category: 'actions',
    },

    // Settings
    {
      id: 'toggle-theme',
      label: currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle between light and dark theme',
      icon: currentTheme === 'dark' ? Sun : Moon,
      action: () => {
        onToggleTheme?.();
        setIsOpen(false);
      },
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
      shortcut: 'T',
      category: 'settings',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App settings and preferences',
      icon: Settings,
      action: () => router.push('/account'),
      keywords: ['settings', 'preferences', 'config'],
      category: 'settings',
    },

    // Help
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: Keyboard,
      action: () => {
        setIsOpen(false);
        // Dispatch event to show keyboard shortcuts modal
        window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
      },
      keywords: ['keyboard', 'shortcuts', 'keys', 'hotkeys'],
      shortcut: '?',
      category: 'help',
    },
    {
      id: 'help',
      label: 'Help Center',
      description: 'Get help and support',
      icon: HelpCircle,
      action: () => router.push('/help'),
      keywords: ['help', 'support', 'faq', 'guide'],
      category: 'help',
    },
  ], [router, currentTheme, onToggleTheme]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const matchLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchDescription = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(k => k.includes(lowerQuery));
      return matchLabel || matchDescription || matchKeywords;
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      settings: [],
      help: [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Open/close handlers
  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  // Keyboard shortcut to open (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closePalette();
        } else {
          openPalette();
        }
        return;
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePalette();
        return;
      }

      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedCommand = filteredCommands[selectedIndex];
          if (selectedCommand) {
            selectedCommand.action();
            closePalette();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, openPalette, closePalette]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Expose open function globally
  useEffect(() => {
    const handleOpenCommand = () => openPalette();
    window.addEventListener('open-command-palette', handleOpenCommand);
    return () => window.removeEventListener('open-command-palette', handleOpenCommand);
  }, [openPalette]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    settings: 'Settings',
    help: 'Help',
  };

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closePalette}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-mono rounded">
                  esc
                </kbd>
              </div>

              {/* Command List */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No commands found for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => {
                    if (items.length === 0) return null;

                    return (
                      <div key={category} className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {categoryLabels[category]}
                        </div>
                        {items.map((command) => {
                          const currentFlatIndex = flatIndex++;
                          const isSelected = currentFlatIndex === selectedIndex;
                          const Icon = command.icon;

                          return (
                            <button
                              key={command.id}
                              data-selected={isSelected}
                              onClick={() => {
                                command.action();
                                closePalette();
                              }}
                              onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-indigo-100 dark:bg-indigo-800'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  isSelected
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{command.label}</div>
                                {command.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {command.description}
                                  </div>
                                )}
                              </div>
                              {command.shortcut && (
                                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-mono rounded">
                                  {command.shortcut}
                                </kbd>
                              )}
                              {isSelected && (
                                <ArrowRight className="h-4 w-4 text-indigo-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                      <span>navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                      <span>select</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Command className="h-3 w-3" />
                    <span>K to open</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export a hook to open the command palette programmatically
export function useCommandPalette() {
  const open = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  }, []);

  return { open };
}
