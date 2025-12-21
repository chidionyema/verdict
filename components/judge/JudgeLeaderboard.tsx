'use client';

import { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, TrendingUp, Award, Users, Zap, Target, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Judge {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  totalVerdicts: number;
  weeklyVerdicts: number;
  avgRating: number;
  totalEarnings: string;
  weeklyEarnings: string;
  streak: number;
  badges: string[];
  level: 'Novice' | 'Intermediate' | 'Expert' | 'Master' | 'Legend';
  specialty: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export function JudgeLeaderboard() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'quality' | 'speed' | 'earnings'>('overall');

  const judges: Judge[] = [
    {
      id: '1',
      name: 'Emma Thompson',
      avatar: '👩‍⚖️',
      rank: 1,
      totalVerdicts: 1547,
      weeklyVerdicts: 89,
      avgRating: 4.98,
      totalEarnings: '$3,247',
      weeklyEarnings: '$412',
      streak: 23,
      badges: ['Speed Demon', 'Quality Master', 'Helpful Judge'],
      level: 'Legend',
      specialty: 'Career & Decisions'
    },
    {
      id: '2',
      name: 'Michael Chen',
      avatar: '👨‍💼',
      rank: 2,
      totalVerdicts: 1203,
      weeklyVerdicts: 67,
      avgRating: 4.95,
      totalEarnings: '$2,891',
      weeklyEarnings: '$347',
      streak: 18,
      badges: ['Top Performer', 'Consistent Judge'],
      level: 'Master',
      specialty: 'Dating & Profile'
    },
    {
      id: '3',
      name: 'Sarah Martinez',
      avatar: '👩‍💼',
      rank: 3,
      totalVerdicts: 892,
      weeklyVerdicts: 54,
      avgRating: 4.92,
      totalEarnings: '$2,156',
      weeklyEarnings: '$289',
      streak: 12,
      badges: ['Rising Star', 'Quality Judge'],
      level: 'Expert',
      specialty: 'Appearance & Style'
    },
    {
      id: '4',
      name: 'David Rodriguez',
      avatar: '👨‍🎨',
      rank: 4,
      totalVerdicts: 743,
      weeklyVerdicts: 41,
      avgRating: 4.89,
      totalEarnings: '$1,847',
      weeklyEarnings: '$234',
      streak: 8,
      badges: ['Creative Eye', 'Detail Oriented'],
      level: 'Expert',
      specialty: 'Creative & Visual'
    },
    {
      id: '5',
      name: 'Lisa Park',
      avatar: '👩‍💻',
      rank: 5,
      totalVerdicts: 621,
      weeklyVerdicts: 38,
      avgRating: 4.87,
      totalEarnings: '$1,543',
      weeklyEarnings: '$198',
      streak: 15,
      badges: ['Night Owl', 'Efficient Judge'],
      level: 'Intermediate',
      specialty: 'Writing & Content'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'first_100',
      title: 'Century Club',
      description: 'Complete 100 verdicts',
      icon: <Trophy className="h-5 w-5" />,
      color: 'from-yellow-500 to-orange-500',
      rarity: 'Common'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Average response time under 2 minutes',
      icon: <Zap className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
      rarity: 'Rare'
    },
    {
      id: 'quality_master',
      title: 'Quality Master',
      description: 'Maintain 4.9+ rating over 100 verdicts',
      icon: <Star className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-500',
      rarity: 'Epic'
    },
    {
      id: 'streak_king',
      title: 'Streak King',
      description: '30-day judging streak',
      icon: <Target className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
      rarity: 'Epic'
    },
    {
      id: 'legend',
      title: 'Verdict Legend',
      description: 'Complete 1000+ verdicts with 4.95+ rating',
      icon: <Crown className="h-5 w-5" />,
      color: 'from-indigo-500 to-purple-500',
      rarity: 'Legendary'
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getLevelColor = (level: Judge['level']) => {
    switch (level) {
      case 'Novice':
        return 'bg-gray-100 text-gray-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Expert':
        return 'bg-purple-100 text-purple-800';
      case 'Master':
        return 'bg-orange-100 text-orange-800';
      case 'Legend':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'Common':
        return 'border-gray-300 bg-gray-50';
      case 'Rare':
        return 'border-blue-300 bg-blue-50';
      case 'Epic':
        return 'border-purple-300 bg-purple-50';
      case 'Legendary':
        return 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Judge Leaderboard</h2>
          <p className="text-indigo-100">See how you rank among our top performers</p>
        </div>

        {/* Time Period Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'weekly', label: 'This Week', icon: Calendar },
              { id: 'monthly', label: 'This Month', icon: TrendingUp },
              { id: 'alltime', label: 'All Time', icon: Trophy }
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overall', label: 'Overall', icon: Trophy },
              { id: 'quality', label: 'Quality', icon: Star },
              { id: 'speed', label: 'Speed', icon: Zap },
              { id: 'earnings', label: 'Earnings', icon: TrendingUp }
            ].map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <category.icon className="h-4 w-4 inline mr-2" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-6">
          <div className="space-y-4">
            {judges.map((judge, index) => (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                  judge.rank <= 3
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getRankIcon(judge.rank)}
                  </div>
                  <div className="text-4xl">{judge.avatar}</div>
                </div>

                {/* Judge Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{judge.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(judge.level)}`}>
                      {judge.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{judge.specialty}</p>
                  
                  {/* Badges */}
                  <div className="flex gap-1">
                    {judge.badges.slice(0, 2).map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{judge.weeklyVerdicts}</div>
                    <div className="text-xs text-gray-600">This Week</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{judge.avgRating}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{judge.weeklyEarnings}</div>
                    <div className="text-xs text-gray-600">Earned</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{judge.streak}</div>
                    <div className="text-xs text-gray-600">Streak</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Judge Achievements</h3>
        <p className="text-gray-600 mb-6">Unlock badges and achievements as you grow your judging career</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getRarityColor(achievement.rarity)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${achievement.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    achievement.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                    achievement.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                    achievement.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-300" />
        <h3 className="text-2xl font-bold mb-2">Ready to Join the Leaderboard?</h3>
        <p className="text-indigo-100 mb-6">Start judging today and compete with our top performers</p>
        <button className="bg-white text-purple-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
          Start Your Judge Journey
        </button>
      </div>
    </div>
  );
}