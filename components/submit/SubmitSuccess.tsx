'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Eye, Share2, Bell, Sparkles, Users, Gavel, DollarSign } from 'lucide-react';
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
            {/* Display images based on request type */}
            {data.mediaType === 'photo' && data.mediaUrls.length > 0 && (
              data.requestType === 'comparison' || data.requestType === 'split_test' ? (
                // Show both images side by side for comparisons and split tests
                <div className="flex gap-2">
                  {data.mediaUrls[0] && (
                    <div className="relative">
                      <img
                        src={data.mediaUrls[0]}
                        alt={data.requestType === 'comparison' ? 'Option A' : 'Photo A'}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-green-400"
                      />
                      <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        A
                      </span>
                    </div>
                  )}
                  {data.mediaUrls[1] && (
                    <div className="relative">
                      <img
                        src={data.mediaUrls[1]}
                        alt={data.requestType === 'comparison' ? 'Option B' : 'Photo B'}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-blue-400"
                      />
                      <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        B
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Single image for standard requests
                <img
                  src={data.mediaUrls[0]}
                  alt="Your submission"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )
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
                {(data.requestType === 'comparison' || data.requestType === 'split_test') && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    data.requestType === 'comparison'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {data.requestType === 'comparison' ? 'A/B Comparison' : 'Split Test'}
                  </span>
                )}
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
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
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

        {/* Judge while you wait CTA */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gavel className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 mb-1">Earn while you wait</h3>
              <p className="text-sm text-gray-600 mb-3">
                Help others by judging their requests and earn money. Most verdicts take just 1-2 minutes.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Earn $0.60-$2.00 per verdict
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Help real people get feedback
                </span>
              </div>
              <button
                onClick={() => router.push('/judge')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm"
              >
                <Gavel className="h-4 w-4" />
                Start Judging
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              // Route to the correct page based on request type
              if (data.requestType === 'comparison') {
                router.push(`/comparisons/${requestId}`);
              } else if (data.requestType === 'split_test') {
                router.push(`/split-tests/${requestId}`);
              } else {
                router.push(`/requests/${requestId}`);
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            View Your {data.requestType === 'comparison' ? 'Comparison' : data.requestType === 'split_test' ? 'Split Test' : 'Request'}
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

