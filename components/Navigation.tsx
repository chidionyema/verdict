'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, User, CreditCard, Clock, Plus, Bell, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import NotificationCenter from './NotificationCenter';
import SearchBar from './SearchBar';

interface UserProfile {
  credits: number;
  is_judge: boolean;
}

interface UserStats {
  activeRequests: number;
  pendingVerdicts: number;
}

export default function Navigation() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ activeRequests: 0, pendingVerdicts: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user profile and stats
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, is_judge')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }

      // Fetch active requests count
      const { count: activeRequestsCount } = await supabase
        .from('verdict_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress']);

      // Fetch pending verdicts count (for judges)
      const { count: pendingVerdictsCount } = await supabase
        .from('verdict_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setUserStats({
        activeRequests: activeRequestsCount || 0,
        pendingVerdicts: pendingVerdictsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserData(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchUserData(currentUser.id);
      } else {
        setUserProfile(null);
        setUserStats({ activeRequests: 0, pendingVerdicts: 0 });
      }
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

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <SearchBar />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : user ? (
              <>
                {/* User Status Widget */}
                <div className="flex items-center space-x-4">
                  {/* Credits */}
                  <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm min-h-[36px]">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="font-medium">{userProfile?.credits || 0}</span>
                    <span className="text-xs text-green-600 ml-1">credits</span>
                  </div>
                  
                  {/* Active Requests */}
                  {userStats.activeRequests > 0 && (
                    <Link 
                      href="/my-requests"
                      className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm hover:bg-blue-100 transition min-h-[36px]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{userStats.activeRequests}</span>
                      <span className="text-xs text-blue-600 ml-1">active</span>
                    </Link>
                  )}
                  
                  {/* Judge Notifications */}
                  {userProfile?.is_judge && userStats.pendingVerdicts > 0 && (
                    <Link 
                      href="/judge"
                      className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm hover:bg-purple-100 transition relative min-h-[36px]"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      <span className="font-medium">{userStats.pendingVerdicts}</span>
                      <span className="text-xs text-purple-600 ml-1">pending</span>
                    </Link>
                  )}
                  
                  {/* Notifications */}
                  <NotificationCenter />
                  
                  {/* Quick New Request */}
                  <Link
                    href="/start"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center text-sm min-h-[36px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Link>
                </div>

                {/* Navigation Links */}
                <Link
                  href="/my-requests"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  My Requests
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
                  href="/discover"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Discover
                </Link>
                {userProfile?.is_judge ? (
                  <div className="relative group">
                    <button className="text-gray-700 hover:text-indigo-600 transition flex items-center">
                      Judge Dashboard
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <Link href="/judge" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        Dashboard
                      </Link>
                      <Link href="/judge/performance" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        Performance
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/judge"
                    className="text-gray-700 hover:text-indigo-600 transition"
                  >
                    Become a Judge
                  </Link>
                )}
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
              className="text-gray-700 p-3 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
          <div className="md:hidden py-6 space-y-4">
            {user ? (
              <>
                {/* Mobile User Status Widget */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span className="font-medium">{userProfile?.credits || 0} credits</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {userStats.activeRequests > 0 && (
                        <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="font-medium">{userStats.activeRequests} active</span>
                        </div>
                      )}
                      
                      {/* Mobile Notifications */}
                      <NotificationCenter />
                    </div>
                  </div>
                  
                  <Link
                    href="/start"
                    className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center font-medium min-h-[48px]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Request
                  </Link>
                </div>

                {userProfile?.is_judge && userStats.pendingVerdicts > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                    <Link
                      href="/judge"
                      className="flex items-center justify-between text-purple-700 min-h-[48px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-3" />
                        <span className="font-medium text-base">Judge Queue</span>
                      </div>
                      <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-bold">
                        {userStats.pendingVerdicts}
                      </span>
                    </Link>
                  </div>
                )}
                
                <Link
                  href="/my-requests"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Requests
                </Link>
                <Link
                  href="/judge"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Judge
                </Link>
                <Link
                  href="/account"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/judge"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Judge
                </Link>
                <Link
                  href="/auth/login"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-4 text-indigo-600 font-semibold text-lg min-h-[48px] flex items-center"
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
