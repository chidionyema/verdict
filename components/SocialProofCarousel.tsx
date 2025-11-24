'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, TrendingUp, Heart } from 'lucide-react';

interface SuccessStory {
  id: string;
  beforeImage?: string;
  afterImage?: string;
  category: string;
  improvement: string;
  rating: number;
  userQuote: string;
  userName: string;
  timeframe: string;
  metric?: string;
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    beforeImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    afterImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    category: 'appearance',
    improvement: 'Professional Confidence',
    rating: 5,
    userQuote: 'The styling feedback transformed how I present myself. Got promoted within 2 months!',
    userName: 'Sarah M.',
    timeframe: '2 weeks',
    metric: '+40% confidence'
  },
  {
    id: '2',
    category: 'profile',
    improvement: 'LinkedIn Optimization',
    rating: 5,
    userQuote: 'My LinkedIn got 5x more views after implementing the feedback. Dream job offer came in!',
    userName: 'Michael R.',
    timeframe: '1 week',
    metric: '+500% profile views'
  },
  {
    id: '3',
    category: 'writing',
    improvement: 'Email Communication',
    rating: 5,
    userQuote: 'My emails went from confusing to crystal clear. Clients actually respond now!',
    userName: 'Jennifer K.',
    timeframe: '3 days',
    metric: '+80% response rate'
  },
  {
    id: '4',
    beforeImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    afterImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b192?w=150&h=150&fit=crop&crop=face',
    category: 'appearance',
    improvement: 'Dating Success',
    rating: 5,
    userQuote: 'The photo feedback was spot-on. Went from 2 matches to 20+ per week!',
    userName: 'David L.',
    timeframe: '1 week',
    metric: '+900% matches'
  }
];

export default function SocialProofCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % successStories.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % successStories.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + successStories.length) % successStories.length);
    setAutoPlay(false);
  };

  const currentStory = successStories[currentIndex];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Real People, Real Results
        </h3>
        <p className="text-gray-600">
          Join thousands who've transformed their lives with expert feedback
        </p>
      </div>

      <div className="relative">
        <div className="bg-white rounded-lg p-6 shadow-sm border min-h-[280px]">
          {/* Before/After Images */}
          {currentStory.beforeImage && currentStory.afterImage && (
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <img 
                  src={currentStory.beforeImage} 
                  alt="Before"
                  className="w-20 h-20 rounded-full border-2 border-gray-200 mb-2"
                />
                <p className="text-xs text-gray-500">Before</p>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-center">
                <img 
                  src={currentStory.afterImage} 
                  alt="After"
                  className="w-20 h-20 rounded-full border-2 border-green-300 mb-2"
                />
                <p className="text-xs text-green-600 font-medium">After</p>
              </div>
            </div>
          )}

          {/* Category & Improvement */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm mb-2">
              <span className="capitalize">{currentStory.category}</span>
              <span>•</span>
              <span>{currentStory.improvement}</span>
            </div>
            
            {currentStory.metric && (
              <div className="text-2xl font-bold text-green-600 mb-2">
                {currentStory.metric}
              </div>
            )}
          </div>

          {/* Quote */}
          <blockquote className="text-center mb-4">
            <p className="text-gray-700 italic mb-3">
              "{currentStory.userQuote}"
            </p>
            <footer className="text-sm">
              <div className="flex justify-center items-center gap-2 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < currentStory.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <cite className="font-medium text-gray-900">
                {currentStory.userName}
              </cite>
              <span className="text-gray-500 ml-2">
                • Improved in {currentStory.timeframe}
              </span>
            </footer>
          </blockquote>
        </div>

        {/* Navigation */}
        <button 
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {successStories.map((_, index) => (
          <button
            key={index}
            onClick={() => {setCurrentIndex(index); setAutoPlay(false);}}
            className={`w-2 h-2 rounded-full transition ${
              index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Heart className="h-4 w-4 text-red-500" />
          <span>Loved by <strong>50,000+</strong> people worldwide</span>
        </div>
      </div>
    </div>
  );
}