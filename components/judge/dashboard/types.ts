import type { ReactNode } from 'react';

export interface QueueRequest {
  id: string;
  created_at: string;
  category: string;
  subcategory: string | null;
  media_type: string;
  context: string;
  target_verdict_count: number;
  received_verdict_count: number;
  request_tier?: 'community' | 'standard' | 'pro';
  expert_only?: boolean;
  priority?: number;
  routing_strategy?: 'expert_only' | 'mixed' | 'community';
  request_type?: 'verdict' | 'comparison' | 'split_test';
  comparison_data?: {
    option_a_title: string;
    option_b_title: string;
    option_a_image_url: string;
    option_b_image_url: string;
  };
  split_test_data?: {
    photo_a_url: string;
    photo_b_url: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward?: string;
}

export interface ActivityItem {
  id: string;
  type: 'verdict' | 'bonus' | 'milestone' | 'level_up';
  title: string;
  amount?: number;
  timestamp: string;
  icon: ReactNode;
}

export interface JudgeStats {
  verdicts_given: number;
  total_earnings: number;
  available_for_payout: number;
  average_quality_score: number | null;
  recent_verdicts: number;
  response_time_avg: number;
  weekly_earnings: number;
  completion_rate: number;
  streak_days: number;
  next_level_progress: number;
  daily_earnings: number;
  monthly_earnings: number;
  best_category: string;
  verdicts_today: number;
  earnings_trend: 'up' | 'down' | 'stable';
}

export interface JudgeLevel {
  name: string;
  level: number;
  icon: ReactNode;
  color: string;
}

export type QueueFilter = 'all' | 'appearance' | 'profile' | 'writing' | 'decision';
export type QueueSort = 'newest' | 'oldest' | 'earnings';
export type EarningsTimeframe = 'daily' | 'weekly' | 'monthly';
