'use client';

import { Sparkles } from 'lucide-react';
import { socialProof } from './constants';

interface StepProgressHeaderProps {
  step: number;
  getStepProgressLabel: () => string;
}

export function StepProgressHeader({ step, getStepProgressLabel }: StepProgressHeaderProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Verdict</span>
          </div>
          <div className="flex items-center gap-4">
            {socialProof.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <item.icon className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{item.metric}</span>
                <span className="text-gray-600 hidden sm:inline">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`h-2 rounded-full transition-all duration-500 flex-1 ${
                step >= s
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                  : 'bg-gray-200'
              }`} />
              {s < 4 && <div className="w-2" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{getStepProgressLabel()}</span>
          <span className="hidden sm:inline">Takes ~2 minutes total</span>
        </div>
      </div>
    </div>
  );
}
