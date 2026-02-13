'use client';

import { motion } from 'framer-motion';
import { Gavel, BarChart3, TrendingUp } from 'lucide-react';
import type { JudgeTabType } from './types';

interface JudgeDashboardTabsProps {
  activeTab: JudgeTabType;
  onTabChange: (tab: JudgeTabType) => void;
  queueCount?: number;
  className?: string;
}

export function JudgeDashboardTabs({
  activeTab,
  onTabChange,
  queueCount,
  className = '',
}: JudgeDashboardTabsProps) {
  const tabs: Array<{
    id: JudgeTabType;
    label: string;
    icon: typeof Gavel;
    count?: number;
    description: string;
  }> = [
    {
      id: 'queue',
      label: 'Queue',
      icon: Gavel,
      count: queueCount,
      description: 'Available requests to judge',
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: BarChart3,
      description: 'Your earnings and performance',
    },
    {
      id: 'progression',
      label: 'Progression',
      icon: TrendingUp,
      description: 'Level up and achievements',
    },
  ];

  return (
    <div className={`sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-gray-200 -mx-4 px-4 ${className}`}>
      <div className="flex gap-1 py-2" role="tablist" aria-label="Dashboard sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeJudgeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
