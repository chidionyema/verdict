'use client';

import { useState, useEffect } from 'react';
import { Star, Users, TrendingUp, MessageSquare, Clock, CheckCircle, Quote, Shield, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Testimonial Component
interface Testimonial {
  id: string;
  quote: string;
  category: string;
  rating: number;
  helpfulCount?: number;
  displayId?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function TestimonialCard({
  testimonial,
  variant = 'default',
  className = '',
}: TestimonialCardProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-700 line-clamp-3">&quot;{testimonial.quote}&quot;</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{testimonial.category}</span>
          {testimonial.displayId && <span>User #{testimonial.displayId}</span>}
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 ${className}`}>
        <Quote className="h-8 w-8 text-indigo-300 mb-4" />
        <p className="text-lg text-gray-800 mb-4 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">Verified User</span>
          </div>
          <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700">
            {testimonial.category}
          </span>
        </div>
        {testimonial.helpfulCount && testimonial.helpfulCount > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {testimonial.helpfulCount} found this helpful
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition ${className}`}>
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">{testimonial.rating}/5</span>
      </div>
      <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
          {testimonial.category}
        </span>
        {testimonial.displayId && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Verified #{testimonial.displayId}
          </span>
        )}
      </div>
    </div>
  );
}

// Testimonial Carousel
interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 5000,
  className = '',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <TestimonialCard testimonial={testimonials[currentIndex]} variant="featured" />
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Trusted By Counter
interface TrustedByCounterProps {
  count: number;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function TrustedByCounter({
  count,
  label = 'users trust AskVerdict',
  animated = true,
  className = '',
}: TrustedByCounterProps) {
  const [displayCount, setDisplayCount] = useState(animated ? 0 : count);

  useEffect(() => {
    if (!animated) {
      setDisplayCount(count);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const increment = count / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count, animated]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(displayCount)}+</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Recent Activity Feed (Anonymized)
interface RecentActivity {
  id: string;
  type: 'verdict' | 'submission' | 'completion';
  category: string;
  timeAgo: string;
}

interface RecentActivityFeedProps {
  activities?: RecentActivity[];
  maxItems?: number;
  className?: string;
}

export function RecentActivityFeed({
  activities: propActivities,
  maxItems = 5,
  className = '',
}: RecentActivityFeedProps) {
  // Default activities if none provided
  const defaultActivities: RecentActivity[] = [
    { id: '1', type: 'verdict', category: 'Career', timeAgo: '2m ago' },
    { id: '2', type: 'submission', category: 'Dating Profile', timeAgo: '5m ago' },
    { id: '3', type: 'completion', category: 'Style', timeAgo: '8m ago' },
    { id: '4', type: 'verdict', category: 'Writing', timeAgo: '12m ago' },
    { id: '5', type: 'submission', category: 'Decision', timeAgo: '15m ago' },
  ];

  const activities = (propActivities || defaultActivities).slice(0, maxItems);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'verdict':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'submission':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'verdict':
        return `New verdict in ${activity.category}`;
      case 'submission':
        return `New ${activity.category} submission`;
      case 'completion':
        return `${activity.category} request completed`;
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <div className="relative">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
        Live Activity
      </h3>
      <ul className="space-y-3">
        {activities.map((activity, index) => (
          <motion.li
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 text-sm"
          >
            {getActivityIcon(activity.type)}
            <span className="flex-1 text-gray-600">{getActivityText(activity)}</span>
            <span className="text-xs text-gray-400">{activity.timeAgo}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// Category Success Stories
interface SuccessStory {
  category: string;
  icon: string;
  stat: string;
  description: string;
}

interface CategorySuccessStoriesProps {
  stories?: SuccessStory[];
  className?: string;
}

export function CategorySuccessStories({
  stories: propStories,
  className = '',
}: CategorySuccessStoriesProps) {
  const defaultStories: SuccessStory[] = [
    {
      category: 'Dating Profiles',
      icon: '💕',
      stat: '3x more matches',
      description: 'Users report significantly more matches after implementing feedback',
    },
    {
      category: 'Career Decisions',
      icon: '💼',
      stat: '85% confidence boost',
      description: 'Feel more confident about major career choices',
    },
    {
      category: 'Style Choices',
      icon: '👔',
      stat: '92% satisfaction',
      description: 'Users happy with their final style decisions',
    },
  ];

  const stories = propStories || defaultStories;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {stories.map((story, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition"
        >
          <span className="text-3xl mb-3 block">{story.icon}</span>
          <h4 className="font-semibold text-gray-900 mb-1">{story.category}</h4>
          <p className="text-2xl font-bold text-indigo-600 mb-2">{story.stat}</p>
          <p className="text-sm text-gray-600">{story.description}</p>
        </div>
      ))}
    </div>
  );
}

// Platform Statistics Bar
interface PlatformStatsBarProps {
  stats?: {
    totalUsers?: number;
    totalVerdicts?: number;
    avgResponseTime?: string;
    satisfactionRate?: number;
  };
  className?: string;
}

export function PlatformStatsBar({
  stats = {},
  className = '',
}: PlatformStatsBarProps) {
  const {
    totalUsers = 5000,
    totalVerdicts = 25000,
    avgResponseTime = '<2 hours',
    satisfactionRate = 94,
  } = stats;

  const statItems = [
    { icon: Users, value: `${(totalUsers / 1000).toFixed(1)}K+`, label: 'Users' },
    { icon: MessageSquare, value: `${(totalVerdicts / 1000).toFixed(0)}K+`, label: 'Verdicts' },
    { icon: Clock, value: avgResponseTime, label: 'Avg Response' },
    { icon: Star, value: `${satisfactionRate}%`, label: 'Satisfaction' },
  ];

  return (
    <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 ${className}`}>
      <div className="grid grid-cols-4 gap-4 text-center text-white">
        {statItems.map((stat, index) => (
          <div key={index}>
            <stat.icon className="h-5 w-5 mx-auto mb-1 opacity-80" />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
