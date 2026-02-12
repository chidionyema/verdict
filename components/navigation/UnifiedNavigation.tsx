'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NavigationItem {
  href: string;
  label: string;
  icon: any;
  description: string;
  active?: boolean;
  primary?: boolean;
  badge?: string;
}
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TERMINOLOGY, getUserState, getRecommendedAction } from '@/lib/terminology';
import {
  Grid,
  MessageSquare, 
  Users,
  User,
  Plus,
  Sparkles,
  CreditCard,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface UserProfile {
  id: string;
  credits: number;
  total_submissions: number;
  total_reviews: number;
  display_name?: string;
  avatar_url?: string;
}

/**
 * UNIFIED NAVIGATION
 * Single coherent navigation that adapts to user state
 * No modes, no toggles - just progressive disclosure
 */
export function UnifiedNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Get unified profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            id, credits, display_name, avatar_url,
            total_submissions, total_reviews
          `)
          .eq('id', user.id)
          .single();
          
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine user state and recommendations
  const userState = profile ? getUserState(profile) : 'NEW';
  const recommendations = getRecommendedAction(userState, profile?.credits || 0);
  
  // Navigation items based on progressive disclosure
  const getNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [];
    
    if (!user) {
      // Anonymous users: simple discovery
      return [
        { href: '/judge', label: 'Judge', icon: Users, description: 'Help others get feedback' },
        { href: '/', label: 'How it Works', icon: MessageSquare, description: 'Learn the process' }
      ];
    }
    
    // Authenticated users: progressive navigation
    items.push({
      href: '/dashboard',
      label: TERMINOLOGY.NAV.HOME,
      icon: Grid,
      active: pathname === '/dashboard',
      description: 'Your requests and activity'
    });
    
    // Always show feedback creation (primary value)
    items.push({
      href: '/create',
      label: TERMINOLOGY.NAV.CREATE, 
      icon: MessageSquare,
      active: pathname === '/create',
      description: 'Submit new request',
      primary: true
    });
    
    // Show help/earn after user understands core value
    if (userState !== 'NEW') {
      items.push({
        href: '/judge',
        label: TERMINOLOGY.NAV.JUDGE,
        icon: Users,
        active: pathname === '/judge',
        description: 'Judge others and earn credits',
        badge: profile?.credits ? undefined : 'Earn'
      });
    }
    
    return items;
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  // Handle keyboard navigation for dropdowns
  const handleUserMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setUserMenuOpen(false);
      userMenuButtonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!userMenuOpen) {
        setUserMenuOpen(true);
        // Focus first menu item after menu opens
        setTimeout(() => {
          const firstItem = userMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
          firstItem?.focus();
        }, 50);
      } else {
        // Move to next menu item
        const items = userMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (items) {
          const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex]?.focus();
        }
      }
      return;
    }

    if (e.key === 'ArrowUp' && userMenuOpen) {
      e.preventDefault();
      const items = userMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (items) {
        const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      }
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && !userMenuOpen) {
      e.preventDefault();
      setUserMenuOpen(true);
      setTimeout(() => {
        const firstItem = userMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        firstItem?.focus();
      }, 50);
    }
  }, [userMenuOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;
      
      if (!target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
      if (!target.closest('[data-mobile-menu]')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={user ? '/dashboard' : '/'}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AskVerdict
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
            {getNavigationItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all group relative focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  item.active 
                    ? 'bg-indigo-100 text-indigo-700'
                    : item.primary
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={item.active ? 'page' : undefined}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
                
                {item.badge && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}

            {user && (
              <>
                {/* Credits Display */}
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{profile?.credits || 0}</span>
                  <span className="text-xs text-gray-600">credits</span>
                </div>

                {/* User Menu */}
                <div className="relative" data-user-menu>
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onKeyDown={handleUserMenuKeyDown}
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-label="User account menu"
                    id="user-menu-button"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                    </div>
                  </button>
                  
                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div
                      ref={userMenuRef}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      role="menu"
                      aria-labelledby="user-menu-button"
                      onKeyDown={handleUserMenuKeyDown}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{profile?.display_name || 'Account'}</p>
                        <p className="text-sm text-gray-600">{userState} user</p>
                      </div>
                      
                      <Link 
                        href="/account" 
                        role="menuitem"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      
                      <button 
                        onClick={() => {
                          handleSignOut();
                          setUserMenuOpen(false);
                        }}
                        role="menuitem"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center" data-mobile-menu>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-gray-200 py-4" role="navigation" aria-label="Mobile navigation">
            <div className="space-y-2">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    item.active 
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contextual Help Banner */}
      {user && userState === 'NEW' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">{recommendations.primary}</p>
                  <p className="text-sm text-blue-700">{recommendations.secondary}</p>
                </div>
              </div>
              <Link
                href="/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {recommendations.cta}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {user && (
        <MobileBottomNav pathname={pathname} />
      )}
    </nav>
  );
}

// Inline Mobile Bottom Navigation component for consistency
function MobileBottomNav({ pathname }: { pathname: string | null }) {
  const navItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Grid,
      active: pathname === '/dashboard' || pathname === '/workspace',
    },
    {
      href: '/judge',
      label: 'Earn',
      icon: Users,
      active: pathname === '/judge' || pathname?.startsWith('/judge/'),
    },
    {
      href: '/submit',
      label: 'Create',
      icon: Plus,
      active: pathname?.startsWith('/submit'),
      primary: true,
    },
    {
      href: '/my-requests',
      label: 'Requests',
      icon: MessageSquare,
      active: pathname === '/my-requests',
    },
    {
      href: '/account',
      label: 'Profile',
      icon: User,
      active: pathname === '/account',
    },
  ];

  // Hide on auth and detail pages
  const hiddenPaths = ['/auth', '/onboarding', '/judge/requests/', '/requests/'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors ${
                item.active
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${item.active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs mt-1 ${item.active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
}