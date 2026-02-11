'use client';

import { Trophy, CheckCircle2, Gift } from 'lucide-react';
import type { Achievement } from './types';
import type { LucideIcon } from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export function AchievementsModal({ achievements, onClose }: AchievementsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8" />
            Your Achievements
          </h2>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon as LucideIcon;
              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-lg'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold">
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              achievement.unlocked
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                : 'bg-gray-400'
                            }`}
                            style={{
                              width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      {achievement.reward && (
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            achievement.unlocked
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Gift className="h-3 w-3" />
                          {achievement.reward}
                        </div>
                      )}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
