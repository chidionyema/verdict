'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navigation() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Verdict
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  My Verdicts
                </Link>
                <Link
                  href="/judge"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Judge
                </Link>
                <Link
                  href="/account"
                  className="flex items-center text-gray-700 hover:text-indigo-600 transition"
                >
                  <User className="h-5 w-5 mr-1" />
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/judge"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Become a Judge
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 p-2 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Verdicts
                </Link>
                <Link
                  href="/judge"
                  className="block py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Judge
                </Link>
                <Link
                  href="/account"
                  className="block py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/judge"
                  className="block py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Judge
                </Link>
                <Link
                  href="/auth/login"
                  className="block py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-2 text-indigo-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
