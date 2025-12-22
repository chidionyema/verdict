'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getDestination, type RoutingDecision } from '@/lib/routing';
import { User } from '@supabase/supabase-js';

interface SmartEntryPointProps {
  children: React.ReactNode;
  enableLogging?: boolean;
}

function SmartEntryPointInner({ children, enableLogging = false }: SmartEntryPointProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRouting, setIsRouting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [hasRouted, setHasRouted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const initializeRouting = async () => {
      try {
        if (enableLogging) {
          console.log('SmartEntryPoint: Starting initialization', { pathname });
        }
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Skip routing for certain paths to avoid loops
        const skipRoutingPaths = [
          '/auth/login',
          '/auth/signup', 
          '/auth/verify-email',
          '/auth/reset-password',
          '/auth/forgot-password'
        ];

        if (skipRoutingPaths.includes(pathname)) {
          setIsRouting(false);
          setHasRouted(true);
          return;
        }

        // Get user profile if authenticated
        let userProfile = null;
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          userProfile = profile;
        }

        // Get routing decision
        const decision = await getDestination(pathname, currentUser, userProfile);
        
        if (enableLogging) {
          console.log('Smart Router Decision:', {
            requestedPath: pathname,
            decision,
            user: currentUser?.id ? 'authenticated' : 'unauthenticated'
          });
        }

        // Apply routing decision
        await applyRoutingDecision(decision);

      } catch (error) {
        console.error('Smart routing error:', error);
        // On error, allow access to current page
        setIsRouting(false);
        setHasRouted(true);
      }
    };

    if (!hasRouted) {
      initializeRouting();
    }
  }, [pathname, hasRouted, enableLogging, router, supabase.auth]);

  const applyRoutingDecision = async (decision: RoutingDecision) => {
    try {
      // If destination matches current path, no redirect needed
      if (decision.destination === pathname) {
        setIsRouting(false);
        setHasRouted(true);
        return;
      }

      // Build URL with params if needed
      let destinationUrl = decision.destination;
      if (decision.params) {
        const urlParams = new URLSearchParams(decision.params);
        destinationUrl += `?${urlParams.toString()}`;
      }

      // Preserve existing search params for certain cases
      if (decision.reason === 'unauthenticated_user_redirect_to_landing' && searchParams.toString()) {
        const separator = destinationUrl.includes('?') ? '&' : '?';
        destinationUrl += `${separator}${searchParams.toString()}`;
      }

      // Perform redirect
      if (enableLogging) {
        console.log('Redirecting to:', destinationUrl, 'Reason:', decision.reason);
      }

      router.replace(destinationUrl);
      setHasRouted(true);

    } catch (error) {
      console.error('Error applying routing decision:', error);
      setIsRouting(false);
      setHasRouted(true);
    }
  };

  // Show loading state while routing
  if (isRouting && !hasRouted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function SmartEntryPoint({ children, enableLogging = false }: SmartEntryPointProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SmartEntryPointInner enableLogging={enableLogging}>
        {children}
      </SmartEntryPointInner>
    </Suspense>
  );
}

// Hook for accessing routing state in components
function useSmartRoutingInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [routingState, setRoutingState] = useState<{
    isRouting: boolean;
    currentPath: string;
    reason?: string;
  }>({
    isRouting: false,
    currentPath: pathname
  });

  useEffect(() => {
    setRoutingState({
      isRouting: false,
      currentPath: pathname,
      reason: searchParams.get('routing_reason') || undefined
    });
  }, [pathname, searchParams]);

  return routingState;
}

export function useSmartRouting() {
  const [routingState, setRoutingState] = useState<{
    isRouting: boolean;
    currentPath: string;
    reason?: string;
  }>({
    isRouting: false,
    currentPath: '/'
  });

  return routingState;
}

// Component for manual routing triggers (buttons, etc.)
interface SmartLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  preserveUserChoice?: boolean;
}

export function SmartLink({ 
  href, 
  children, 
  className = '',
  onClick,
  preserveUserChoice = false
}: SmartLinkProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }

    try {
      // Get current user for smart routing
      const { data: { user } } = await supabase.auth.getUser();
      
      if (preserveUserChoice) {
        // Direct navigation without smart routing
        router.push(href);
        return;
      }

      // Use smart routing
      const decision = await getDestination(href, user);
      
      let destinationUrl = decision.destination;
      if (decision.params) {
        const urlParams = new URLSearchParams(decision.params);
        destinationUrl += `?${urlParams.toString()}`;
      }

      router.push(destinationUrl);
      
    } catch (error) {
      console.error('Smart link navigation error:', error);
      // Fallback to regular navigation
      router.push(href);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}