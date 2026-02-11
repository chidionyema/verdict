'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Loading fallback
function RedirectLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to submission...</p>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function CreateRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any query params (e.g., ?type=comparison)
    const params = searchParams.toString();
    const redirectUrl = params ? `/submit?${params}` : '/submit';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return <RedirectLoading />;
}

/**
 * /create now redirects to /submit
 * The unified submission flow handles all request types
 */
export default function CreateRedirectPage() {
  return (
    <Suspense fallback={<RedirectLoading />}>
      <CreateRedirectInner />
    </Suspense>
  );
}
