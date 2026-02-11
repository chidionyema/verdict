'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SubmitFlow } from '@/components/submit';
import { SubmissionStep } from '@/components/submit/types';

// Loading fallback
function SubmitLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function SubmitPageInner() {
  const searchParams = useSearchParams();

  // Check for return context from URL params
  const returnParam = searchParams.get('return');
  const returnFrom = returnParam === 'earn' || returnParam === 'payment'
    ? (returnParam as 'earn' | 'payment')
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Get Expert Feedback
          </h1>
          <p className="text-gray-600">
            Submit your content and receive honest, helpful feedback
          </p>
        </div>

        {/* Submit Flow */}
        <SubmitFlow returnFrom={returnFrom} />
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitLoading />}>
      <SubmitPageInner />
    </Suspense>
  );
}
