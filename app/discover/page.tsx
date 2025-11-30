'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to unified feed page
    router.replace('/feed');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}