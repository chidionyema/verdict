'use client';

import { Sparkles, CheckCircle2 } from 'lucide-react';

export function ProTipsCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full filter blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Pro Tips for Higher Ratings</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
            <p className="text-sm text-white/90">Be specific and constructive - avoid generic feedback</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
            <p className="text-sm text-white/90">
              Reference the context and show you understand their situation
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
            <p className="text-sm text-white/90">Give actionable advice, not just opinions</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 flex-shrink-0" />
            <p className="text-sm text-white/90">
              Aim for 100+ characters for detailed, helpful responses
            </p>
          </div>
        </div>

        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs text-white/80">
            High-quality verdicts unlock premium requests with higher pay!
          </p>
        </div>
      </div>
    </div>
  );
}
