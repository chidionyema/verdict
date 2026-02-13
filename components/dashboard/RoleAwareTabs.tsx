'use client';

import { motion } from 'framer-motion';
import { FileText, Gavel } from 'lucide-react';

type TabType = 'requester' | 'judge';

interface RoleAwareTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  requesterCount?: number;
  judgeCount?: number;
  className?: string;
}

export function RoleAwareTabs({
  activeTab,
  onTabChange,
  requesterCount,
  judgeCount,
  className = '',
}: RoleAwareTabsProps) {
  const tabs: Array<{
    id: TabType;
    label: string;
    icon: typeof FileText;
    count?: number;
    description: string;
  }> = [
    {
      id: 'requester',
      label: 'My Requests',
      icon: FileText,
      count: requesterCount,
      description: 'View feedback on your submissions',
    },
    {
      id: 'judge',
      label: 'Judge',
      icon: Gavel,
      count: judgeCount,
      description: 'Earn by reviewing submissions',
    },
  ];

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-1.5 ${className}`}>
      <div className="flex gap-1" role="tablist" aria-label="Dashboard views">
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
              className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
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
