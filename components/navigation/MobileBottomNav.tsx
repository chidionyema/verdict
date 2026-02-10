'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Users, Plus, Shield, User, MessageSquare, LayoutDashboard } from 'lucide-react';

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isJudge, setIsJudge] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setIsAuthenticated(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_judge')
            .eq('id', user.id)
            .single();

          setIsJudge(!!(profile as any)?.is_judge);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  // Don't show on certain pages
  const hiddenPaths = ['/auth', '/onboarding', '/judge/requests/', '/requests/'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));

  if (shouldHide || !isAuthenticated) return null;

  // Always show both Judge and My Requests for seamless role switching
  const navItems = [
    {
      href: '/my-requests',
      label: 'Requests',
      icon: MessageSquare,
      active: pathname === '/my-requests',
    },
    {
      href: '/feed',
      label: 'Earn',
      icon: Users,
      active: pathname === '/feed',
    },
    {
      href: '/submit',
      label: 'Submit',
      icon: Plus,
      active: pathname?.startsWith('/submit'),
      primary: true,
    },
    {
      href: '/judge',
      label: 'Review',
      icon: Shield,
      active: pathname?.startsWith('/judge'),
      // Show badge if user is a qualified judge
      badge: isJudge,
    },
    {
      href: '/account',
      label: 'Profile',
      icon: User,
      active: pathname === '/account' || pathname === '/profile',
    },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-bottom ${className}`}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isPrimary = item.primary;

          if (isPrimary) {
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
              className={`relative flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors ${
                item.active
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${item.active ? 'stroke-[2.5]' : ''}`} />
                {/* Badge for qualified judges */}
                {(item as any).badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </div>
              <span className={`text-xs mt-1 ${item.active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
              {item.active && (
                <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </nav>
  );
}

// Add padding to main content when bottom nav is present
export function MobileNavSpacer() {
  return <div className="h-16 md:hidden" />;
}
