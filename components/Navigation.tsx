'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, User, CreditCard, Clock, Plus, Bell, ChevronDown, Zap, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import NotificationCenter from './NotificationCenter';
import SearchBar from './SearchBar';

interface UserProfile {
  credits: number;
  is_reviewer: boolean;
}

interface UserStats {
  activeRequests: number;
  pendingVerdicts: number;
}

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ activeRequests: 0, pendingVerdicts: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user profile and stats
  const fetchUserData = async (userId: string) => {
    try {
      // Only create client in browser
      if (typeof window === 'undefined') return;
      
      const supabase = createClient();
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, is_reviewer')
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

      // Fetch pending feedback count (for reviewers)
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
    // Only run in browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
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
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      setLoading(false);
    }
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={user ? '/my-requests' : '/'}
              className="group relative inline-block logo-focus-ring"
            >
              <div className="relative">
                {/* Premium shadow layers for depth */}
                <span className="absolute inset-0 text-2xl font-black tracking-tight opacity-10 blur-sm transform translate-x-1 translate-y-1">
                  <span className="text-indigo-600">Ask</span>
                  <span className="text-slate-800">Verdict</span>
                </span>
                
                {/* Main logo text with premium styling */}
                <span className="relative z-10 text-2xl font-black tracking-tight logo-animate">
                  <span className="inline-block text-indigo-600 transition-all duration-300 group-hover:text-indigo-700 group-hover:transform group-hover:-translate-x-0.5">
                    Ask
                  </span>
                  <span className="inline-block text-slate-800 transition-all duration-300 group-hover:text-slate-900 group-hover:transform group-hover:translate-x-0.5">
              Verdict
                  </span>
                </span>
                
                {/* Premium underline with gradient */}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-500 to-slate-800 transform scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
                
                {/* Subtle glow effect on hover */}
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/10 group-hover:to-purple-600/10 blur-xl transition-all duration-500" />
              </div>
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
                  {/* Credits Display - More prominent */}
                  <Link href="/account" className="flex items-center bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 px-5 py-2 rounded-full text-sm min-h-[36px] hover:from-yellow-100 hover:to-amber-100 transition-all border border-amber-200 shadow-sm">
                    <Zap className="h-4 w-4 mr-2 text-amber-600" />
                    <span className="font-bold text-lg">
                      {userProfile?.credits || 0}
                    </span>
                    <span className="text-xs text-amber-600 ml-1 font-medium">
                      {userProfile?.credits === 1 ? 'credit' : 'credits'}
                    </span>
                  </Link>
                  
                  {/* Active Requests */}
                  {userStats.activeRequests > 0 && (
                    <Link 
                      href="/decisions"
                      className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm hover:bg-blue-100 transition min-h-[36px]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{userStats.activeRequests}</span>
                      <span className="text-xs text-blue-600 ml-1">active</span>
                    </Link>
                  )}
                  
                  {/* Reviewer Notifications */}
                  {userProfile?.is_reviewer && userStats.pendingVerdicts > 0 && (
                    <Link 
                      href="/judge"
                      className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm hover:bg-purple-100 transition relative min-h-[36px]"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      <span className="font-medium">{userStats.pendingVerdicts}</span>
                      <span className="text-xs text-purple-600 ml-1">to review</span>
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
                  href="/feed"
                  className="text-gray-700 hover:text-indigo-600 transition flex items-center min-h-[36px] font-medium"
                >
                  Discover
                </Link>
                <Link
                  href="/submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center text-sm min-h-[36px] font-medium"
                >
                  Submit
                </Link>
                <Link
                  href="/judge"
                  className="text-gray-700 hover:text-indigo-600 transition flex items-center min-h-[36px] font-medium"
                >
                  Judge Queue
                </Link>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Link
                  href="/decisions"
                  className="text-gray-600 hover:text-gray-800 transition flex items-center min-h-[36px] text-sm"
                >
                  My Decisions
                </Link>
                <Link
                  href="/account"
                  className="text-gray-700 hover:text-indigo-600 transition flex items-center min-h-[36px]"
                >
                  <User className="h-5 w-5 mr-1" />
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/feed"
                  className="text-gray-700 hover:text-indigo-600 transition flex items-center min-h-[36px] font-medium"
                >
                  Discover
                </Link>
                <Link
                  href="/submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center text-sm min-h-[36px] font-medium"
                >
                  Submit
                </Link>
                {userProfile?.is_reviewer ? (
                  <div className="relative group">
                    <button className="text-gray-700 hover:text-indigo-600 transition flex items-center">
                      Reviewer Dashboard
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
                    href="/verification"
                    className="text-gray-700 hover:text-indigo-600 transition flex items-center gap-1"
                  >
                    Become Verified Expert
                  </Link>
                )}
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-indigo-600 transition flex items-center"
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
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
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
          <div 
            id="mobile-navigation-menu"
            className="md:hidden py-6 space-y-4"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            {user ? (
              <>
                {/* Mobile User Status Widget */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {userProfile?.credits || 0}{' '}
                        {userProfile?.credits === 1 ? 'request left' : 'requests left'}
                      </span>
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

                {userProfile?.is_reviewer && userStats.pendingVerdicts > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                    <Link
                      href="/judge"
                      className="flex items-center justify-between text-purple-700 min-h-[48px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-3" />
                        <span className="font-medium text-base">Review Queue</span>
                      </div>
                      <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-bold">
                        {userStats.pendingVerdicts}
                      </span>
                    </Link>
                  </div>
                )}
                
                <Link
                  href="/decisions"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Decisions
                </Link>
                <Link
                  href="/judge"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Review
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
                  href="/feed"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Discover
                </Link>
                <Link
                  href="/start?mode=roast"
                  className="block py-4 text-red-600 hover:text-red-700 text-lg font-semibold border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔥 Roast Me
                </Link>
                <Link
                  href="/verification"
                  className="block py-4 text-gray-700 hover:text-indigo-600 text-lg font-medium border-b border-gray-200 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become Verified Expert
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

