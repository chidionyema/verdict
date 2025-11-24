'use client';

import { useState } from 'react';
import { Heart, CheckCircle, Loader } from 'lucide-react';

interface ThankJudgesButtonProps {
  requestId: string;
  judgeCount: number;
  onSuccess?: () => void;
  className?: string;
}

export function ThankJudgesButton({
  requestId,
  judgeCount,
  onSuccess,
  className = '',
}: ThankJudgesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasThanked, setHasThanked] = useState(() => {
    // Check if already thanked (stored in localStorage)
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`thanked_${requestId}`) === 'true';
    }
    return false;
  });

  const handleThankJudges = async () => {
    setIsLoading(true);

    try {
      // TODO: Send notifications to judges via API
      // await fetch('/api/requests/thank-judges', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ requestId }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mark as thanked
      localStorage.setItem(`thanked_${requestId}`, 'true');
      setHasThanked(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to thank judges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasThanked) {
    return (
      <div
        className={`flex items-center justify-center gap-2 p-4 bg-green-50 rounded-xl border-2 border-green-200 ${className}`}
      >
        <CheckCircle className="w-5 h-5 text-green-600" />
        <p className="text-sm font-medium text-green-800">
          Thank you sent to all {judgeCount} judges!
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleThankJudges}
      disabled={isLoading}
      className={`group relative overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="flex items-center justify-center gap-3">
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Sending thanks...</span>
          </>
        ) : (
          <>
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Thank Your Judges</span>
          </>
        )}
      </div>

      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </button>
  );
}
