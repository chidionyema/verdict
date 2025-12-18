'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Zap, Globe, CheckCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'submission' | 'review' | 'credit_earned' | 'result_delivered';
  location: string;
  category: string;
  timeAgo: string;
  isLive: boolean;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'submission', location: 'London', category: 'dating profile', timeAgo: 'just now', isLive: true },
  { id: '2', type: 'review', location: 'New York', category: 'interview outfit', timeAgo: '2 min ago', isLive: false },
  { id: '3', type: 'credit_earned', location: 'Berlin', category: '3 judgments completed', timeAgo: '3 min ago', isLive: false },
  { id: '4', type: 'result_delivered', location: 'Paris', category: 'career advice', timeAgo: '5 min ago', isLive: false },
  { id: '5', type: 'submission', location: 'Tokyo', category: 'style check', timeAgo: '7 min ago', isLive: false },
];

const LIVE_STATS = {
  activeReviewers: 234,
  avgResponseTime: '28 min',
  completedToday: 1847,
  satisfactionRate: 98,
};

export function LiveActivityTicker() {
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState(LIVE_STATS);
  const [isVisible, setIsVisible] = useState(true);

  // Rotate activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activities]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stats with slight variations
      setStats(prev => ({
        activeReviewers: prev.activeReviewers + Math.floor(Math.random() * 11) - 5,
        avgResponseTime: `${Math.floor(25 + Math.random() * 10)} min`,
        completedToday: prev.completedToday + Math.floor(Math.random() * 3) + 1,
        satisfactionRate: 98
      }));

      // Occasionally add new activity
      if (Math.random() > 0.7) {
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: ['submission', 'review', 'credit_earned', 'result_delivered'][Math.floor(Math.random() * 4)] as any,
          location: ['London', 'New York', 'Paris', 'Tokyo', 'Sydney'][Math.floor(Math.random() * 5)],
          category: ['dating profile', 'interview outfit', 'style check'][Math.floor(Math.random() * 3)],
          timeAgo: 'just now',
          isLive: true
        };
        setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'review': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'credit_earned': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'result_delivered': return <Activity className="h-4 w-4 text-orange-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'submission':
        return `Someone in ${activity.location} submitted a ${activity.category}`;
      case 'review':
        return `Reviewer in ${activity.location} completed ${activity.category} feedback`;
      case 'credit_earned':
        return `User in ${activity.location} earned a credit (${activity.category})`;
      case 'result_delivered':
        return `${activity.category} results delivered to ${activity.location}`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Live Stats */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-400" />
            <span className="font-medium">{stats.activeReviewers}</span>
            <span className="opacity-80">reviewers online</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-yellow-400" />
            <span className="font-medium">{stats.avgResponseTime}</span>
            <span className="opacity-80">avg response</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="font-medium">{stats.completedToday.toLocaleString()}</span>
            <span className="opacity-80">completed today</span>
          </div>
        </div>

        {/* Activity Ticker */}
        <div className="flex-1 lg:flex-initial lg:min-w-[400px] relative min-h-[32px] overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`absolute w-full flex items-center gap-2 transition-all duration-500 min-h-[32px] ${
                  index === currentIndex 
                    ? 'opacity-100 translate-y-0' 
                    : index === (currentIndex - 1 + activities.length) % activities.length
                    ? 'opacity-0 -translate-y-full'
                    : 'opacity-0 translate-y-full'
                }`}
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <span className="text-sm leading-tight flex-1 pr-2">
                  {getActivityText(activity)}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activity.isLive && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                  <span className="text-xs opacity-60 whitespace-nowrap">{activity.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="lg:hidden flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-green-400 animate-pulse" />
          <span className="font-medium">{stats.activeReviewers} active</span>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}