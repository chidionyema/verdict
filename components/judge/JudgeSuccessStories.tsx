'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  avatar: string;
  monthlyEarnings: string;
  joinDate: string;
  totalVerdicts: number;
  story: string;
  highlight: string;
  rating: number;
  specialization: string;
}

interface JudgeSuccessStoriesProps {
  compact?: boolean;
}

export function JudgeSuccessStories({ compact = false }: JudgeSuccessStoriesProps) {
  const [currentStory, setCurrentStory] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const stories: SuccessStory[] = [
    {
      id: '1',
      name: 'Sarah Martinez',
      role: 'Marketing Professional & Judge',
      avatar: '👩‍💼',
      monthlyEarnings: '$1,847',
      joinDate: 'March 2024',
      totalVerdicts: 892,
      story: "I started judging during my lunch breaks at work. What began as a way to earn coffee money has turned into a substantial side income. The flexibility is incredible - I judge whenever I have 10-15 minutes free.",
      highlight: "Earned enough to cover my car payment every month",
      rating: 4.9,
      specialization: 'Profile & Dating'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      role: 'College Student & Weekend Judge',
      avatar: '👨‍🎓',
      monthlyEarnings: '$620',
      joinDate: 'August 2024',
      totalVerdicts: 341,
      story: "As a college student, this is perfect for my schedule. I mainly judge on weekends when I'm watching Netflix anyway. The money goes straight to my textbook fund and helps with groceries.",
      highlight: "Paid for entire semester's textbooks through judging",
      rating: 4.8,
      specialization: 'Appearance & Style'
    },
    {
      id: '3',
      name: 'Emma Thompson',
      role: 'Remote Worker & Top Judge',
      avatar: '👩‍⚖️',
      monthlyEarnings: '$2,400',
      joinDate: 'January 2024',
      totalVerdicts: 1547,
      story: "I work remotely and love helping people make better decisions. The quality of submissions keeps improving, and I've built genuine expertise in career advice. It's rewarding both financially and personally.",
      highlight: "Became a top judge in 3 months",
      rating: 5.0,
      specialization: 'Writing & Decisions'
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'Designer & Creative Judge',
      avatar: '👨‍🎨',
      monthlyEarnings: '$950',
      joinDate: 'June 2024',
      totalVerdicts: 478,
      story: "My design background gives me a unique perspective on visual content. I enjoy seeing different creative approaches and helping people improve their presentations and profiles.",
      highlight: "Leveraged design expertise for higher-paying reviews",
      rating: 4.9,
      specialization: 'Visual & Creative'
    }
  ];

  // Auto-rotate stories
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStory(prev => (prev + 1) % stories.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, stories.length]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentStory(prev => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentStory(prev => (prev + 1) % stories.length);
  };

  const currentStoryData = stories[currentStory];

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Judge Success Story</h3>
        <div className="flex items-start gap-4">
          <div className="text-3xl">{currentStoryData.avatar}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{currentStoryData.name}</h4>
              <span className="text-lg font-bold text-green-600">{currentStoryData.monthlyEarnings}/mo</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">"{currentStoryData.highlight}"</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{currentStoryData.totalVerdicts} verdicts</span>
              <span>⭐ {currentStoryData.rating}</span>
              <span>{currentStoryData.specialization}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Judge Success Stories</h3>
            <p className="text-indigo-100">Real judges, real earnings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Judge Profile */}
            <div className="flex items-start gap-6 mb-6">
              <div className="text-6xl">{currentStoryData.avatar}</div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-1">{currentStoryData.name}</h4>
                <p className="text-gray-600 mb-2">{currentStoryData.role}</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{currentStoryData.monthlyEarnings}</div>
                    <div className="text-xs text-green-700">Monthly avg</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{currentStoryData.totalVerdicts}</div>
                    <div className="text-xs text-blue-700">Total verdicts</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600">{currentStoryData.rating}</div>
                    <div className="text-xs text-yellow-700">Avg rating</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{currentStoryData.joinDate.split(' ')[0]}</div>
                    <div className="text-xs text-purple-700">Since {currentStoryData.joinDate.split(' ')[1]}</div>
                  </div>
                </div>

                {/* Specialization Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                  <Award className="h-4 w-4" />
                  <span>{currentStoryData.specialization} Specialist</span>
                </div>
              </div>
            </div>

            {/* Story Quote */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
              <p className="text-gray-800 italic text-lg leading-relaxed mb-4">
                "{currentStoryData.story}"
              </p>
              
              {/* Highlight */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Key Achievement</span>
                </div>
                <p className="text-green-700">{currentStoryData.highlight}</p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-gray-900">Quality Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${currentStoryData.rating * 20}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{currentStoryData.rating}/5.0</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-gray-900">Response Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">3.2 min</p>
                <p className="text-xs text-gray-600">Average per verdict</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold text-gray-900">Judge Level</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">Expert</p>
                <p className="text-xs text-gray-600">Tier 3 of 5</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Story Navigation */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-2">
          {stories.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentStory(index);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStory 
                  ? 'bg-indigo-600 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}