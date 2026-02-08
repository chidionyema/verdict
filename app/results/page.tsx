'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { BackButton } from '@/components/ui/BackButton';

export default function ResultsPage() {
  const router = useRouter();
  const currentRequest = useStore((state) => state.currentRequest);

  useEffect(() => {
    if (currentRequest?.id) {
      router.replace(`/requests/${currentRequest.id}`);
    } else {
      router.replace('/my-requests');
    }
  }, [currentRequest?.id, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-6 text-center">
        <BackButton href="/my-requests" label="Back to My Requests" className="mb-3" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to your results…</h1>
        <p className="text-sm text-gray-600">
          We now show results on the request detail page. You&apos;ll be taken there automatically.
        </p>
      </div>
    </div>
  );
}
