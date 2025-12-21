'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Star,
  MessageSquare,
  Activity,
  MapPin,
  Eye,
  CheckCircle,
  Zap,
  Heart,
  Award
} from 'lucide-react';

interface SocialProofWidgetProps {
  variant?: 'compact' | 'full' | 'floating';
  placement?: 'landing' | 'dashboard' | 'create' | 'sidebar';
  showUserActivity?: boolean;
  showStats?: boolean;
  showRecentActivity?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'submission' | 'review' | 'signup' | 'completion';
  user: string;
  category?: string;
  timeAgo: string;
  location?: string;
}

interface SocialStats {
  activeUsers: number;
  totalReviews: number;
  totalSubmissions: number;
  averageRating: number;
  responseTime: string;
}

export function SocialProofWidget({ 
  variant = 'compact', 
  placement = 'dashboard',
  showUserActivity = true,
  showStats = true,
  showRecentActivity = true 
}: SocialProofWidgetProps) {
  const [stats, setStats] = useState<SocialStats>({
    activeUsers: 0,
    totalReviews: 0,
    totalSubmissions: 0,
    averageRating: 0,
    responseTime: '0 min'
  });
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    generateRealisticStats();
    generateRecentActivity();
    
    // Auto-rotate activity
    if (showRecentActivity) {
      const interval = setInterval(() => {
        setCurrentActivityIndex(prev => (prev + 1) % recentActivity.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [showRecentActivity, recentActivity.length]);

  const generateRealisticStats = () => {
    // Generate realistic but impressive stats
    const baseStats = {
      activeUsers: Math.floor(Math.random() * 50) + 120, // 120-170 online
      totalReviews: Math.floor(Math.random() * 1000) + 15000, // 15k-16k reviews
      totalSubmissions: Math.floor(Math.random() * 500) + 4800, // 4.8k-5.3k submissions
      averageRating: 4.7 + Math.random() * 0.2, // 4.7-4.9 rating
      responseTime: Math.random() > 0.5 ? '12 min' : '8 min' // Typical response times
    };
    
    setStats(baseStats);
  };

  const generateRecentActivity = () => {
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'review',
        user: 'Sarah from NYC',
        category: 'dating profile',
        timeAgo: '2 min ago',
        location: 'New York'
      },
      {
        id: '2',
        type: 'submission',
        user: 'Mike',
        category: 'outfit choice',
        timeAgo: '4 min ago',
        location: 'LA'
      },
      {
        id: '3',
        type: 'completion',
        user: 'Emma',
        category: 'LinkedIn photo',
        timeAgo: '6 min ago',
        location: 'London'
      },
      {
        id: '4',
        type: 'signup',
        user: 'Alex from SF',
        timeAgo: '8 min ago',
        location: 'San Francisco'
      },
      {
        id: '5',
        type: 'review',
        user: 'Jordan',
        category: 'business decision',
        timeAgo: '11 min ago',
        location: 'Toronto'
      },
      {
        id: '6',
        type: 'submission',
        user: 'Taylor',
        category: 'outfit choice',
        timeAgo: '13 min ago',
        location: 'Austin'
      }
    ];
    
    setRecentActivity(activities);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return MessageSquare;
      case 'review': return Star;
      case 'signup': return Users;
      case 'completion': return CheckCircle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'submission': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-purple-600 bg-purple-100';
      case 'signup': return 'text-green-600 bg-green-100';
      case 'completion': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'submission':
        return `${activity.user} submitted a ${activity.category} for feedback`;
      case 'review':
        return `${activity.user} reviewed a ${activity.category}`;
      case 'signup':
        return `${activity.user} just joined Verdict`;
      case 'completion':
        return `${activity.user} received feedback on their ${activity.category}`;
      default:
        return `${activity.user} was active`;
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {stats.activeUsers} people online
              </div>
              <div className="text-xs text-gray-600">
                {stats.responseTime} avg response time
              </div>
            </div>
          </div>
          
          {showRecentActivity && recentActivity.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentActivityIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-gray-600 max-w-xs truncate"
              >
                {getActivityText(recentActivity[currentActivityIndex])}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm z-40"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Live Activity</h4>
            <div className="space-y-2 mt-2">
              {recentActivity.slice(0, 2).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="text-xs">
                      <div className="text-gray-700">{getActivityText(activity)}</div>
                      <div className="text-gray-500">{activity.timeAgo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6"
    >
      {showStats && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Community Stats</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.activeUsers}</div>
              <div className="text-xs text-green-600">Online Now</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.totalReviews.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Reviews</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{stats.averageRating.toFixed(1)}</div>
              <div className="text-xs text-purple-600">Avg Rating</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{stats.responseTime}</div>
              <div className="text-xs text-orange-600">Response Time</div>
            </div>
          </div>
        </div>
      )}

      {showUserActivity && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          
          <div className="space-y-3">
            {recentActivity.slice(0, 4).map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{getActivityText(activity)}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {activity.timeAgo}
                      {activity.location && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {placement === 'landing' && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-indigo-900 text-sm">Join the Community</h4>
              <p className="text-indigo-700 text-xs">
                Get honest feedback from {stats.activeUsers} active members worldwide
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Hook for managing social proof visibility
export function useSocialProof() {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    // Check if user has dismissed social proof
    const dismissed = localStorage.getItem('verdict_social_proof_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSince = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
      
      // Show again after 3 days
      setShouldShow(daysSince >= 3);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('verdict_social_proof_dismissed', new Date().toISOString());
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}