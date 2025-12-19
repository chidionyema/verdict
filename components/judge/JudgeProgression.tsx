'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy,
  Star,
  Award,
  Crown,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Lock,
  CheckCircle,
  Gift,
  Sparkles,
  Medal,
  Gem,
  Rocket,
  Heart,
  ThumbsUp,
  Users,
  BarChart3,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';

interface JudgeProgressionProps {
  userId: string;
  currentStats: {
    totalVerdicts: number;
    avgRating: number;
    helpfulnessScore: number;
    specializations: string[];
  };
}

interface Tier {
  id: string;
  name: string;
  icon: any;
  color: string;
  gradient: string;
  minVerdicts: number;
  perks: string[];
  badge: string;
  nextMilestone?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  target: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'verdicts' | 'quality' | 'specialization' | 'community';
}

interface Streak {
  current: number;
  longest: number;
  lastVerdictDate: string;
  multiplier: number;
}

const JUDGE_TIERS: Tier[] = [
  {
    id: 'novice',
    name: 'Novice Judge',
    icon: Shield,
    color: 'text-gray-600',
    gradient: 'from-gray-400 to-gray-600',
    minVerdicts: 0,
    badge: '🌱',
    perks: ['Basic judge access', 'Standard credit rewards'],
    nextMilestone: 10,
  },
  {
    id: 'bronze',
    name: 'Bronze Judge',
    icon: Medal,
    color: 'text-orange-600',
    gradient: 'from-orange-400 to-orange-600',
    minVerdicts: 10,
    badge: '🥉',
    perks: ['5% bonus credits', 'Priority queue access', 'Bronze badge'],
    nextMilestone: 25,
  },
  {
    id: 'silver',
    name: 'Silver Judge',
    icon: Star,
    color: 'text-gray-500',
    gradient: 'from-gray-400 to-gray-600',
    minVerdicts: 25,
    badge: '🥈',
    perks: ['10% bonus credits', 'Advanced filters', 'Silver badge', 'Specialization unlocked'],
    nextMilestone: 50,
  },
  {
    id: 'gold',
    name: 'Gold Judge',
    icon: Trophy,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    minVerdicts: 50,
    badge: '🥇',
    perks: ['15% bonus credits', 'Premium requests', 'Gold badge', 'Multiple specializations'],
    nextMilestone: 100,
  },
  {
    id: 'platinum',
    name: 'Platinum Judge',
    icon: Gem,
    color: 'text-purple-600',
    gradient: 'from-purple-400 to-purple-600',
    minVerdicts: 100,
    badge: '💎',
    perks: ['20% bonus credits', 'VIP access', 'Platinum badge', 'Mentor status'],
    nextMilestone: 250,
  },
  {
    id: 'master',
    name: 'Master Judge',
    icon: Crown,
    color: 'text-indigo-600',
    gradient: 'from-indigo-400 to-purple-600',
    minVerdicts: 250,
    badge: '👑',
    perks: ['25% bonus credits', 'Exclusive features', 'Master badge', 'Community leadership'],
  },
];

export default function JudgeProgression({ userId, currentStats }: JudgeProgressionProps) {
  const [currentTier, setCurrentTier] = useState<Tier>(JUDGE_TIERS[0]);
  const [nextTier, setNextTier] = useState<Tier | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<Streak>({
    current: 0,
    longest: 0,
    lastVerdictDate: '',
    multiplier: 1,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'progress' | 'achievements' | 'leaderboard'>('progress');

  useEffect(() => {
    calculateProgression();
    fetchAchievements();
    fetchStreak();
  }, [currentStats]);

  const calculateProgression = () => {
    const verdicts = currentStats.totalVerdicts;
    
    // Find current tier
    let current = JUDGE_TIERS[0];
    let next = null;
    
    for (let i = JUDGE_TIERS.length - 1; i >= 0; i--) {
      if (verdicts >= JUDGE_TIERS[i].minVerdicts) {
        current = JUDGE_TIERS[i];
        next = i < JUDGE_TIERS.length - 1 ? JUDGE_TIERS[i + 1] : null;
        break;
      }
    }
    
    setCurrentTier(current);
    setNextTier(next);
  };

  const fetchAchievements = async () => {
    const totalVerdicts = currentStats.totalVerdicts;
    const avgRating = currentStats.avgRating;
    const specializations = currentStats.specializations;

    const allAchievements: Achievement[] = [
      // Verdict Milestones
      {
        id: 'first_verdict',
        name: 'First Steps',
        description: 'Complete your first verdict',
        icon: CheckCircle,
        unlocked: totalVerdicts >= 1,
        progress: Math.min(totalVerdicts, 1),
        target: 1,
        rarity: 'common',
        category: 'verdicts',
      },
      {
        id: 'verdict_10',
        name: 'Getting Started',
        description: 'Complete 10 verdicts',
        icon: Target,
        unlocked: totalVerdicts >= 10,
        progress: Math.min(totalVerdicts, 10),
        target: 10,
        rarity: 'common',
        category: 'verdicts',
      },
      {
        id: 'verdict_50',
        name: 'Experienced Judge',
        description: 'Complete 50 verdicts',
        icon: Award,
        unlocked: totalVerdicts >= 50,
        progress: Math.min(totalVerdicts, 50),
        target: 50,
        rarity: 'rare',
        category: 'verdicts',
      },
      {
        id: 'verdict_100',
        name: 'Century Club',
        description: 'Complete 100 verdicts',
        icon: Trophy,
        unlocked: totalVerdicts >= 100,
        progress: Math.min(totalVerdicts, 100),
        target: 100,
        rarity: 'epic',
        category: 'verdicts',
      },
      
      // Quality Achievements
      {
        id: 'high_quality',
        name: 'Quality First',
        description: 'Maintain 4.5+ average rating',
        icon: Star,
        unlocked: avgRating >= 4.5,
        progress: avgRating,
        target: 4.5,
        rarity: 'rare',
        category: 'quality',
      },
      {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Achieve 5.0 average rating',
        icon: Sparkles,
        unlocked: avgRating >= 5.0,
        progress: avgRating,
        target: 5.0,
        rarity: 'legendary',
        category: 'quality',
      },
      {
        id: 'helpful_judge',
        name: 'Most Helpful',
        description: 'Achieve 90% helpfulness score',
        icon: Heart,
        unlocked: currentStats.helpfulnessScore >= 90,
        progress: currentStats.helpfulnessScore,
        target: 90,
        rarity: 'epic',
        category: 'quality',
      },
      
      // Specialization Achievements
      {
        id: 'specialist',
        name: 'Domain Expert',
        description: 'Complete 20 verdicts in one category',
        icon: Medal,
        unlocked: specializations.length > 0,
        progress: specializations.length > 0 ? 20 : 0,
        target: 20,
        rarity: 'rare',
        category: 'specialization',
      },
      {
        id: 'multi_specialist',
        name: 'Renaissance Judge',
        description: 'Specialize in 3 categories',
        icon: Gem,
        unlocked: specializations.length >= 3,
        progress: specializations.length,
        target: 3,
        rarity: 'epic',
        category: 'specialization',
      },
      
      // Community Achievements
      {
        id: 'community_favorite',
        name: 'Community Favorite',
        description: 'Receive 50 helpful votes',
        icon: ThumbsUp,
        unlocked: false, // Would need to fetch from DB
        progress: 0,
        target: 50,
        rarity: 'rare',
        category: 'community',
      },
      {
        id: 'mentor',
        name: 'Mentor',
        description: 'Help train 5 new judges',
        icon: Users,
        unlocked: false, // Would need to fetch from DB
        progress: 0,
        target: 5,
        rarity: 'epic',
        category: 'community',
      },
    ];

    setAchievements(allAchievements);
  };

  const fetchStreak = async () => {
    try {
      const supabase = createClient();
      
      // Get recent verdicts to calculate streak
      const { data: recentVerdicts } = await supabase
        .from('verdict_responses')
        .select('created_at')
        .eq('judge_id', userId)
        .order('created_at', { ascending: false })
        .limit(30) as { data: { created_at: string }[] | null };

      if (recentVerdicts && recentVerdicts.length > 0) {
        // Calculate current streak
        let currentStreak = 0;
        let lastDate = new Date(recentVerdicts[0].created_at);
        const today = new Date();
        
        // If last verdict was today or yesterday, we have a streak
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = 1;
          
          // Check consecutive days
          for (let i = 1; i < recentVerdicts.length; i++) {
            const verdictDate = new Date(recentVerdicts[i].created_at);
            const prevDate = new Date(recentVerdicts[i - 1].created_at);
            const diff = Math.floor((prevDate.getTime() - verdictDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diff <= 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        // Calculate multiplier based on streak
        let multiplier = 1;
        if (currentStreak >= 7) multiplier = 1.5;
        if (currentStreak >= 14) multiplier = 2.0;
        if (currentStreak >= 30) multiplier = 2.5;

        setStreak({
          current: currentStreak,
          longest: Math.max(currentStreak, streak.longest),
          lastVerdictDate: recentVerdicts[0].created_at,
          multiplier,
        });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const getProgressPercentage = () => {
    if (!nextTier) return 100;
    
    const currentMilestone = currentTier.minVerdicts;
    const nextMilestone = nextTier.minVerdicts;
    const progress = currentStats.totalVerdicts - currentMilestone;
    const required = nextMilestone - currentMilestone;
    
    return Math.min((progress / required) * 100, 100);
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-600';
    }
  };

  const getStreakColor = () => {
    if (streak.current >= 30) return 'from-red-500 to-orange-500';
    if (streak.current >= 14) return 'from-purple-500 to-pink-500';
    if (streak.current >= 7) return 'from-blue-500 to-purple-500';
    if (streak.current >= 3) return 'from-green-500 to-blue-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <>
      {/* Compact Progress Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${currentTier.gradient} rounded-lg flex items-center justify-center`}>
              <span className="text-xl">{currentTier.badge}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{currentTier.name}</h3>
              <p className="text-sm text-gray-600">
                {currentStats.totalVerdicts} verdicts • {nextTier ? `${nextTier.minVerdicts - currentStats.totalVerdicts} to ${nextTier.name}` : 'Max tier reached!'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 group"
          >
            View Details
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${currentTier.gradient} transition-all duration-1000`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* Milestone Markers */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {JUDGE_TIERS.slice(0, -1).map((tier, index) => (
              <div
                key={tier.id}
                className={`w-2 h-2 rounded-full ${
                  currentStats.totalVerdicts >= tier.minVerdicts ? 'bg-white' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Streak & Multiplier */}
        {streak.current > 0 && (
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 bg-gradient-to-r ${getStreakColor()} text-white text-sm font-bold rounded-full flex items-center gap-1`}>
                <Zap className="h-3 w-3" />
                {streak.current} day streak
              </div>
              {streak.multiplier > 1 && (
                <span className="text-sm font-bold text-green-600">
                  {streak.multiplier}x credits
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Judge Progression</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: 'progress', label: 'Progress', icon: TrendingUp },
                  { id: 'achievements', label: 'Achievements', icon: Trophy },
                  { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all ${
                      selectedTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Progress Tab */}
              {selectedTab === 'progress' && (
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 bg-gradient-to-br ${currentTier.gradient} rounded-xl flex items-center justify-center`}>
                          <span className="text-4xl">{currentTier.badge}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{currentTier.name}</h3>
                          <p className="text-gray-600 mt-1">Level {JUDGE_TIERS.indexOf(currentTier) + 1} of {JUDGE_TIERS.length}</p>
                          
                          <div className="mt-3 space-y-1">
                            {currentTier.perks.map((perk, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {perk}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">{currentStats.totalVerdicts}</div>
                        <div className="text-sm text-gray-600">Total Verdicts</div>
                        
                        {nextTier && (
                          <div className="mt-2">
                            <div className="text-xl font-semibold text-indigo-600">
                              {nextTier.minVerdicts - currentStats.totalVerdicts}
                            </div>
                            <div className="text-sm text-gray-600">to next tier</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tier Progression */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Tier Progression</h4>
                    <div className="space-y-3">
                      {JUDGE_TIERS.map((tier, index) => {
                        const isUnlocked = currentStats.totalVerdicts >= tier.minVerdicts;
                        const isCurrent = tier.id === currentTier.id;
                        
                        return (
                          <div
                            key={tier.id}
                            className={`rounded-lg border-2 p-4 transition-all ${
                              isCurrent
                                ? 'border-indigo-300 bg-indigo-50'
                                : isUnlocked
                                ? 'border-gray-200 bg-white'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  isUnlocked ? `bg-gradient-to-br ${tier.gradient}` : 'bg-gray-300'
                                }`}>
                                  {isUnlocked ? (
                                    <span className="text-2xl">{tier.badge}</span>
                                  ) : (
                                    <Lock className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                                
                                <div>
                                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {tier.name}
                                    {isCurrent && (
                                      <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                                        CURRENT
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {tier.minVerdicts}+ verdicts required
                                  </p>
                                </div>
                              </div>
                              
                              {isUnlocked && !isCurrent && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            
                            {(isCurrent || (index === JUDGE_TIERS.indexOf(currentTier) + 1)) && (
                              <div className="mt-3 pl-15">
                                <div className="grid grid-cols-2 gap-2">
                                  {tier.perks.map((perk, perkIndex) => (
                                    <div key={perkIndex} className="text-sm text-gray-700 flex items-center gap-1">
                                      <Gift className="h-3 w-3 text-indigo-600" />
                                      {perk}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">{currentStats.avgRating.toFixed(1)}</div>
                      <div className="text-sm text-blue-600">Avg Rating</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">{currentStats.helpfulnessScore}%</div>
                      <div className="text-sm text-green-600">Helpful</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-700">{streak.current}</div>
                      <div className="text-sm text-purple-600">Day Streak</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-700">{currentStats.specializations.length}</div>
                      <div className="text-sm text-orange-600">Specializations</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements Tab */}
              {selectedTab === 'achievements' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Achievements</h3>
                    <p className="text-gray-600">
                      Unlocked {achievements.filter(a => a.unlocked).length} of {achievements.length} achievements
                    </p>
                  </div>

                  {['verdicts', 'quality', 'specialization', 'community'].map((category) => (
                    <div key={category} className="mb-8">
                      <h4 className="font-medium text-gray-900 mb-4 capitalize flex items-center gap-2">
                        {category === 'verdicts' && <Target className="h-4 w-4" />}
                        {category === 'quality' && <Star className="h-4 w-4" />}
                        {category === 'specialization' && <Medal className="h-4 w-4" />}
                        {category === 'community' && <Users className="h-4 w-4" />}
                        {category} Achievements
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements
                          .filter(a => a.category === category)
                          .map((achievement) => (
                            <div
                              key={achievement.id}
                              className={`rounded-lg border-2 p-4 transition-all ${
                                achievement.unlocked
                                  ? 'border-indigo-200 bg-white'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  achievement.unlocked
                                    ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                                    : 'bg-gray-300'
                                }`}>
                                  {achievement.unlocked ? (
                                    <achievement.icon className="h-6 w-6 text-white" />
                                  ) : (
                                    <Lock className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {achievement.name}
                                    {achievement.unlocked && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </h5>
                                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                  
                                  {!achievement.unlocked && (
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{achievement.progress}/{achievement.target}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leaderboard Tab */}
              {selectedTab === 'leaderboard' && (
                <div className="text-center py-12">
                  <Rocket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Leaderboard Coming Soon</h3>
                  <p className="text-gray-600">
                    Compare your progress with other judges and compete for the top spots!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}