'use client';

import { useState, useEffect } from 'react';
import { Activity, DollarSign, Star, TrendingUp, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JudgeActivity {
  id: string;
  judge: string;
  action: string;
  amount?: number;
  time: string;
  category?: string;
  streak?: number;
  level?: string;
}

export function LiveJudgeActivity() {
  const [activities, setActivities] = useState<JudgeActivity[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [activeJudges, setActiveJudges] = useState(0);

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 30000); // Refresh every 30 seconds
    
    // Simulate real-time updates
    const simulationInterval = setInterval(simulateActivity, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(simulationInterval);
    };
  }, []);

  const loadLiveData = async () => {
    try {
      const response = await fetch('/api/judge/live-activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.recentActivities || []);
        setTotalEarned(data.totalEarnedToday || 0);
        setActiveJudges(data.activeJudges || 0);
      }
    } catch (error) {
      console.error('Failed to load live activity:', error);
    }
  };

  const simulateActivity = () => {
    // Add realistic simulated activities between API calls
    const sampleActivities = [
      { judge: 'Sarah M.', action: 'completed verdict', amount: 0.85, category: 'dating_photos' },
      { judge: 'Mike R.', action: 'earned streak bonus', amount: 5.00, streak: 7 },
      { judge: 'Emma L.', action: 'reached Expert level', level: 'Expert' },
      { judge: 'James K.', action: 'completed pro verdict', amount: 2.00, category: 'business' },
      { judge: 'Lisa W.', action: 'earned quality bonus', amount: 1.50 },
    ];

    const randomActivity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
    const newActivity: JudgeActivity = {
      id: `sim-${Date.now()}`,
      ...randomActivity,
      time: 'just now'
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 5));
  };

  const getActivityIcon = (activity: JudgeActivity) => {
    if (activity.level) return <Award className="h-4 w-4 text-purple-600" />;
    if (activity.streak) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    if (activity.amount && activity.amount > 1.5) return <Star className="h-4 w-4 text-yellow-600" />;
    return <DollarSign className="h-4 w-4 text-green-600" />;
  };

  const formatActivity = (activity: JudgeActivity) => {
    if (activity.level) {
      return `${activity.judge} reached ${activity.level} level! 🎉`;
    }
    if (activity.streak) {
      return `${activity.judge} earned ${activity.streak}-day streak bonus: $${activity.amount?.toFixed(2)}`;
    }
    if (activity.action.includes('quality')) {
      return `${activity.judge} earned quality bonus: $${activity.amount?.toFixed(2)} ⭐`;
    }
    if (activity.category) {
      const categoryName = activity.category.replace('_', ' ');
      return `${activity.judge} ${activity.action} in ${categoryName}: $${activity.amount?.toFixed(2)}`;
    }
    return `${activity.judge} ${activity.action}: $${activity.amount?.toFixed(2)}`;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Live Judge Activity</h3>
            <p className="text-white/70 text-sm">Real-time earnings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-white/70">{activeJudges} active</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <p className="text-xs text-white/70 mb-1">Earned Today</p>
          <p className="text-2xl font-bold">${totalEarned.toFixed(0)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <p className="text-xs text-white/70 mb-1">Avg per Judge</p>
          <p className="text-2xl font-bold">
            ${activeJudges > 0 ? (totalEarned / activeJudges).toFixed(0) : '0'}
          </p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2 mb-4">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {getActivityIcon(activity)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{formatActivity(activity)}</p>
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Join CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.location.href = '/become-a-judge'}
        className="w-full bg-white text-purple-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Start Earning Like Them
      </motion.button>
    </div>
  );
}