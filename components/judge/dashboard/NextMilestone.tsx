'use client';

import { Target } from 'lucide-react';

export function NextMilestone() {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full filter blur-2xl" />

      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Next Milestone
        </h3>

        <div className="mb-3">
          <p className="text-sm opacity-90 mb-1">Complete 10 more verdicts to unlock</p>
          <p className="text-xl font-bold">Premium Request Access</p>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/90 rounded-full transition-all duration-1000"
            style={{ width: '75%' }}
          />
        </div>
        <p className="text-xs mt-2 opacity-80">75% complete</p>
      </div>
    </div>
  );
}
