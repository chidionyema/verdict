'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Eye, Share2, Bell, Sparkles, Users } from 'lucide-react';
import { SubmissionData, TIERS, CATEGORIES } from './types';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';

interface SubmitSuccessProps {
  requestId: string;
  data: SubmissionData;
  creditsUsed: number;
}

export function SubmitSuccess({ requestId, data, creditsUsed }: SubmitSuccessProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  const tier = TIERS.find(t => t.id === data.tier);
  const category = CATEGORIES.find(c => c.id === data.category);

  // Trigger celebration on mount
  useEffect(() => {
    setShowConfetti(true);
    triggerHaptic('success');
    playSuccessSound();
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Confetti effect */}
      <Confetti active={showConfetti} duration={4000} pieces={100} />

      <div className="max-w-lg w-full mx-auto text-center">
        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-once">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25" />
        </div>

        {/* Main message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Request Submitted!
        </h1>
        <p className="text-gray-600 mb-8">
          {tier?.verdictCount} judges are being matched to your request
        </p>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 text-left">
          <div className="flex items-start gap-4 mb-4">
            {data.mediaType === 'photo' && data.mediaUrls[0] && (
              <img
                src={data.mediaUrls[0]}
                alt="Your submission"
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            {data.mediaType === 'text' && (
              <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category?.icon}</span>
                <span className="font-medium text-gray-900">{category?.name}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{data.context}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{tier?.verdictCount}</p>
              <p className="text-xs text-gray-500">Verdicts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{tier?.turnaround}</p>
              <p className="text-xs text-gray-500">Est. Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{creditsUsed}</p>
              <p className="text-xs text-gray-500">Credits Used</p>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>Judges review your submission and write detailed feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>We'll notify you as each verdict comes in</span>
            </li>
            <li className="flex items-start gap-2">
              <Share2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>View all feedback on your request page</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/requests/${requestId}`)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            View Your Request
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => router.push('/submit')}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            Submit Another Request
          </button>
        </div>

        {/* Request ID for reference */}
        <p className="text-xs text-gray-400 mt-6">
          Request ID: {requestId}
        </p>
      </div>
    </div>
  );
}

