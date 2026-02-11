'use client';

import { Suspense } from 'react';
import { UnifiedDashboard } from '@/components/dashboard';

export const dynamic = 'force-dynamic';

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white/80 rounded-3xl h-24 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-white/80 rounded-2xl h-12 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <UnifiedDashboard />
    </Suspense>
  );
}
