'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Menu, 
  X, 
  User, 
  CreditCard, 
  Clock, 
  Plus, 
  Bell, 
  ChevronDown, 
  Zap, 
  Shield, 
  Home,
  BarChart3,
  Users,
  Scale,
  RotateCcw,
  Award,
  Crown,
  Sparkles,
  Target,
  Grid,
  MessageSquare,
  Eye,
  Settings,
  LogOut,
  HelpCircle,
  Camera,
  FileText,
  Mic,
  Star,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { MagneticButton, FloatingBadge, RippleButton } from '@/components/ui/MicroInteractions';

interface UserProfile {
  credits: number;
  is_judge: boolean;
  display_name?: string;
  avatar_url?: string;
}

interface UserStats {
  activeRequests: number;
  pendingVerdicts: number;
  totalVerdicts: number;
  judgeEarnings: number;
}

// Smart navigation that adapts based on user state and current page
export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ 
    activeRequests: 0, 
    pendingVerdicts: 0,
    totalVerdicts: 0,
    judgeEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSubmitDropdown, setShowSubmitDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Refs for click outside detection
  const submitDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Smart context detection
  const isHomePage = pathname === '/';
  const isWorkspacePage = pathname === '/workspace';
  const isCreatePage = pathname === '/create';
  const isJudgePage = pathname?.startsWith('/judge');
  const isFeedPage = pathname === '/feed';

  // Fetch user profile and stats
  const fetchUserData = async (userId: string) => {
    try {
      if (typeof window === 'undefined') return;
      
      const supabase = createClient();
      
      // Fetch enhanced profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, is_judge, display_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }

      // Fetch enhanced stats
      const [
        { count: activeRequestsCount },
        { count: totalVerdictsCount },
        { count: pendingVerdictsCount }
      ] = await Promise.all([
        supabase
          .from('verdict_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['open', 'in_progress']),
        
        supabase
          .from('feedback_responses')
          .select('*', { count: 'exact', head: true })
          .eq('judge_id', userId),
        
        supabase
          .from('verdict_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
      ]);

      setUserStats({
        activeRequests: activeRequestsCount || 0,
        pendingVerdicts: pendingVerdictsCount || 0,
        totalVerdicts: totalVerdictsCount || 0,
        judgeEarnings: 0, // Calculate based on verdicts * rate
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
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
          setUserStats({ activeRequests: 0, pendingVerdicts: 0, totalVerdicts: 0, judgeEarnings: 0 });
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error in Navigation useEffect:', error);
      setLoading(false);
    }
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submitDropdownRef.current && !submitDropdownRef.current.contains(event.target as Node)) {
        setShowSubmitDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Smart logo destination
  const getLogoDestination = () => {
    if (!user) return '/';
    return '/workspace';
  };

  // Smart "New Request" button context
  const getNewRequestLabel = () => {
    if (isWorkspacePage) return 'New Request';
    if (userStats.activeRequests === 0) return 'Start First Request';
    return 'Create Request';
  };

  // Define navigation item interface
  interface NavItem {
    href: string;
    label: string;
    icon: any;
    active?: boolean;
    badge?: number;
    highlight?: boolean;
  }

  // Contextual navigation items
  const getMainNavItems = (): NavItem[] => {
    if (!user) {
      return [
        { href: '/feed', label: 'Community', icon: Users },
        { href: '/help', label: 'How It Works', icon: HelpCircle },
      ];
    }

    const items: NavItem[] = [
      { 
        href: '/workspace', 
        label: 'Workspace', 
        icon: Grid,
        active: isWorkspacePage,
        badge: userStats.activeRequests > 0 ? userStats.activeRequests : undefined,
      },
    ];

    // Add judge navigation if user is a judge
    if (userProfile?.is_judge) {
      items.push({
        href: '/judge',
        label: 'Judge Queue',
        icon: Shield,
        active: isJudgePage,
        badge: userStats.pendingVerdicts > 0 ? userStats.pendingVerdicts : undefined,
      });
    } else {
      // Show "Earn as Judge" for non-judges
      items.push({
        href: '/become-a-judge',
        label: 'Earn Money',
        icon: Sparkles,
        active: pathname === '/become-a-judge',
        highlight: true, // Special highlight for conversion
      });
    }

    items.push({
      href: '/feed', 
      label: 'Community', 
      icon: Users,
      active: isFeedPage,
    });

    return items;
  };

  if (loading) {
    return (
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={getLogoDestination()}
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
          <div className="hidden md:flex items-center space-x-6">
            {/* Main Navigation */}
            {getMainNavItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all relative ${
                  item.active 
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                <FloatingBadge
                  visible={!!item.badge}
                  color="red"
                  bounce={true}
                >
                  {item.badge}
                </FloatingBadge>
              </Link>
            ))}

            {user && (
              <>
                {/* Smart Submit Button with Dropdown */}
                <div className="relative" ref={submitDropdownRef}>
                  <MagneticButton
                    onClick={() => setShowSubmitDropdown(!showSubmitDropdown)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium group relative overflow-hidden"
                  >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    <span>{getNewRequestLabel()}</span>
                    <ChevronDown className="h-4 w-4" />
                  </MagneticButton>

                  {showSubmitDropdown && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Quick Create</p>
                        <p className="text-xs text-gray-700">Choose your feedback type</p>
                      </div>
                      
                      <Link
                        href="/create?type=verdict"
                        onClick={() => setShowSubmitDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Standard Feedback</p>
                          <p className="text-xs text-gray-700">Get expert opinions</p>
                        </div>
                      </Link>
                      
                      <Link
                        href="/create?type=comparison"
                        onClick={() => setShowSubmitDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Scale className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">A/B Comparison</p>
                          <p className="text-xs text-gray-700">Compare two options</p>
                        </div>
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Advanced
                        </span>
                      </Link>
                      
                      <Link
                        href="/create?type=split_test"
                        onClick={() => setShowSubmitDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">Split Test</p>
                          <p className="text-xs text-gray-700">Test with demographics</p>
                        </div>
                        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Pro
                        </span>
                      </Link>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <Link
                          href="/create"
                          onClick={() => setShowSubmitDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">Full Creation Flow</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Credits Display */}
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile?.credits || 0}
                  </span>
                </div>

                {/* Notifications */}
                <button className="relative min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" aria-label="View notifications">
                  <Bell className="h-5 w-5" />
                  {userStats.activeRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {userStats.activeRequests}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-label="Open profile menu"
                  >
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">
                          {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-sm text-gray-700">{user.email}</p>
                        
                        {/* Quick Stats */}
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-700">{userStats.activeRequests}</div>
                            <div className="text-blue-600">Active</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-700">{userStats.totalVerdicts}</div>
                            <div className="text-green-600">Verdicts</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-bold text-purple-700">{userProfile?.credits || 0}</div>
                            <div className="text-purple-600">Credits</div>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/workspace"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Grid className="h-4 w-4 text-gray-600" />
                        <span>My Workspace</span>
                      </Link>

                      {userProfile?.is_judge && (
                        <Link
                          href="/judge"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="h-4 w-4 text-indigo-600" />
                          <span>Judge Dashboard</span>
                          {userStats.pendingVerdicts > 0 && (
                            <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                              {userStats.pendingVerdicts} pending
                            </span>
                          )}
                        </Link>
                      )}

                      <Link
                        href="/account"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span>Account Settings</span>
                      </Link>

                      <Link
                        href="/help"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <HelpCircle className="h-4 w-4 text-gray-600" />
                        <span>Help & Support</span>
                      </Link>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowProfileDropdown(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-red-50 transition-colors text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Unauthenticated Navigation */}
            {!user && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
            <div className="py-4 space-y-2">
              {getMainNavItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                    item.active 
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white mx-4 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>{getNewRequestLabel()}</span>
                  </Link>

                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Credits: {userProfile?.credits || 0}</span>
                      <span>Active: {userStats.activeRequests}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="px-4 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}