'use client';

import { useEffect, Suspense } from 'react';
import { initMonitoring, setUserContext, addBreadcrumb } from '@/lib/monitoring/sentry';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function MonitoringProviderInner({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Initialize monitoring on app load
    try {
      initMonitoring();
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
    
    // Set user context if authenticated
    const setupUserContext = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user profile for additional context
          const { data: profile } = await supabase
            .from('profiles')
            .select('pricing_tier, total_submissions, judge_verified')
            .eq('id', user.id)
            .single();
          
          setUserContext(user.id, {
            plan: (profile as any)?.pricing_tier || 'free',
            totalRequests: (profile as any)?.total_submissions || 0,
            isJudge: (profile as any)?.judge_verified || false,
          });
        }
      } catch (error) {
        console.error('Failed to setup user context:', error);
      }
    };
    
    setupUserContext();
  }, []);
  
  // Track navigation
  useEffect(() => {
    try {
      addBreadcrumb(
        `Navigated to ${pathname}`,
        'navigation',
        { 
          path: pathname,
          query: Object.fromEntries(searchParams.entries()),
        }
      );
    } catch (error) {
      console.error('Failed to track navigation:', error);
    }
  }, [pathname, searchParams]);
  
  // Track performance metrics
  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('value' in entry) {
              console.log('CLS:', entry.value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('processingStart' in entry && 'startTime' in entry) {
              const delay = (entry as any).processingStart - (entry as any).startTime;
              console.log('FID:', delay);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        return () => {
          clsObserver.disconnect();
          lcpObserver.disconnect();
          fidObserver.disconnect();
        };
      } catch (e) {
        console.error('Failed to setup performance observers:', e);
      }
    }
  }, []);
  
  return <>{children}</>;
}

export default function MonitoringProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <MonitoringProviderInner>
        {children}
      </MonitoringProviderInner>
    </Suspense>
  );
}