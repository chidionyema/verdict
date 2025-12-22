'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WorkspaceRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any query parameters when redirecting to dashboard
    const params = searchParams.toString();
    const dashboardUrl = params ? `/dashboard?${params}` : '/dashboard';
    
    router.replace(dashboardUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}