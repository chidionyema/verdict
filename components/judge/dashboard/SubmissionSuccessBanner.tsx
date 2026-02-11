'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, DollarSign, RefreshCw, XCircle } from 'lucide-react';

interface SubmissionSuccessBannerProps {
  onDismiss: () => void;
  onRefresh: () => void;
}

export function SubmissionSuccessBanner({ onDismiss, onRefresh }: SubmissionSuccessBannerProps) {
  const router = useRouter();

  return (
    <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden animate-in slide-in-from-top duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Verdict Submitted!</h3>
            <p className="text-green-100 text-sm">
              You earned money for this verdict! Available for payout after 7 days.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/judge/earnings')}
            className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition inline-flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            View Earnings
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Judge Another
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Dismiss"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
