'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generateMockVerdict } from '@/lib/mock-data';
import { Clock, CheckCircle } from 'lucide-react';

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
      const timeout = setTimeout(() => router.push('/results'), 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentRequest?.status, router]);

  if (!currentRequest) return null;

  const progress = (currentRequest.verdicts.length / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
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
        </div>
      </div>
    </div>
  );
}
