'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generateMockVerdict } from '@/lib/mock-data';
import { Clock, CheckCircle, Info } from 'lucide-react';

export default function WaitingPage() {
  const router = useRouter();
  const currentRequest = useStore((state) => state.currentRequest);
  const addVerdict = useStore((state) => state.addVerdict);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const verdictCountRef = useRef(0);

  useEffect(() => {
    if (!currentRequest) {
      router.push('/');
      return;
    }

    // Timer
    const timerInterval = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);

    // Simulate verdicts arriving
    const verdictInterval = setInterval(() => {
      if (verdictCountRef.current < 3) {
        const newVerdict = generateMockVerdict(
          currentRequest.category,
          verdictCountRef.current
        );
        addVerdict(newVerdict);
        verdictCountRef.current += 1;
      }
    }, 2000 + Math.random() * 2000);

    return () => {
      clearInterval(verdictInterval);
      clearInterval(timerInterval);
    };
  }, [currentRequest, addVerdict, router]);

  // Redirect when complete
  useEffect(() => {
    if (currentRequest?.status === 'completed') {
      const timeout = setTimeout(() => {
        if (currentRequest?.id) {
          router.push(`/requests/${currentRequest.id}`);
        } else {
          router.push('/my-requests');
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentRequest?.status, currentRequest?.id, router]);

  if (!currentRequest) return null;

  const progress = (currentRequest.verdicts.length / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-10 grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Judges are reviewing your submission
            </h2>

            <div className="mb-8">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {Math.floor(timeElapsed / 60)}:
                  {(timeElapsed % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Most people get all 3 verdicts in <span className="font-medium">10–45 minutes</span>.
                We&apos;ll email you as soon as results are ready.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{currentRequest.verdicts.length} of 3 verdicts</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Recent Verdicts Preview */}
            <div className="space-y-2 mb-6">
              {currentRequest.verdicts.slice(-3).map((verdict) => (
                <div
                  key={verdict.id}
                  className="flex items-center text-sm text-gray-600 animate-fade-in"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Judge from {verdict.demographics.location} submitted feedback</span>
                </div>
              ))}
            </div>

            <p className="text-gray-600 text-sm">
              Your results will be ready soon. Quality feedback takes time!
            </p>

            {currentRequest.status === 'completed' && (
              <p className="text-green-600 font-semibold mt-4">
                All verdicts received! Redirecting to results...
              </p>
            )}
          </div>

          {/* While you wait / engagement panel */}
          <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 text-left">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-900">
              <Info className="h-4 w-4 text-indigo-600" />
              <span>What happens next</span>
            </div>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-5">
              <li>Judges receive your request and start writing detailed feedback.</li>
              <li>As each verdict arrives, we update this page in real time.</li>
              <li>When all 3 are in, we build a summary view to make results easy to scan.</li>
            </ol>

            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-indigo-800 mb-1">
                You can safely close this tab
              </p>
              <p className="text-xs text-indigo-700">
                We&apos;ll email you as soon as your results are ready. You&apos;ll always find them
                under <span className="font-semibold">My Requests</span>.
              </p>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed">
              <p className="mb-2">
                While you wait, think about what you&apos;ll do if the feedback confirms your gut
                feeling—or completely challenges it. The best time to decide how you&apos;ll react is
                before you see the verdict.
              </p>
              <p>
                Tip: You can come back later and ask follow‑up questions by creating a new request
                that references this one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
