'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, Trophy, Target } from 'lucide-react';

interface CreditProgress {
  judgment_points: number; // 0-2 points toward next credit
  total_credits: number;
  total_judgments: number;
}

interface CreditProgressTrackerProps {
  userId: string;
  compact?: boolean;
}

export function CreditProgressTracker({ userId, compact = false }: CreditProgressTrackerProps) {
  const [progress, setProgress] = useState<CreditProgress>({
    judgment_points: 0,
    total_credits: 0,
    total_judgments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('judgment_points, credits, total_reviews')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProgress({
        judgment_points: (profile as any)?.judgment_points || 0,
        total_credits: (profile as any)?.credits || 0,
        total_judgments: (profile as any)?.total_reviews || 0
      });
    } catch (error) {
      console.error('Error loading credit progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const pointsToNextCredit = 3 - (progress.judgment_points % 3);
  const progressPercent = ((progress.judgment_points % 3) / 3) * 100;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800 flex items-center gap-2">
            <Star className="h-4 w-4" />
            {progress.judgment_points % 3}/3 points to next credit
          </span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {progress.total_credits} credits
          </span>
        </div>
        <div className="w-full bg-green-100 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center justify-center gap-2">
          <Target className="h-5 w-5" />
          Credit Progress
        </h3>
        <p className="text-green-700">
          {pointsToNextCredit === 3 
            ? "Start judging to earn your first credit!" 
            : `${pointsToNextCredit} more judgment${pointsToNextCredit === 1 ? '' : 's'} to earn 1 credit`
          }
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800">
            {progress.judgment_points % 3}/3 judgment points
          </span>
          <span className="text-xs text-green-600">
            {Math.floor(progressPercent)}% complete
          </span>
        </div>
        <div className="w-full bg-green-100 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-900">{progress.total_credits}</div>
          <div className="text-xs text-green-700">Total Credits</div>
        </div>
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-900">{progress.total_judgments}</div>
          <div className="text-xs text-green-700">Total Judgments</div>
        </div>
      </div>

      {progressPercent === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-green-800 mb-2">Ready to earn your first point?</p>
          <button 
            onClick={() => window.location.href = '/judge'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Start Judging
          </button>
        </div>
      )}
    </div>
  );
}