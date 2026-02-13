'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Star,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  id: string;
  icon: typeof MessageSquare;
  value: number;
  suffix?: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const STATS: StatItem[] = [
  {
    id: 'verdicts',
    icon: MessageSquare,
    value: 24847,
    label: 'Verdicts Delivered',
    description: 'Honest feedback given',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'users',
    icon: Users,
    value: 8291,
    label: 'Users Helped',
    description: 'Making better decisions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'rating',
    icon: Star,
    value: 4.8,
    suffix: '/5',
    label: 'Average Rating',
    description: 'User satisfaction',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 'time',
    icon: Clock,
    value: 47,
    suffix: ' min',
    label: 'Avg Response Time',
    description: 'For all 3 verdicts',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }
];

// Category-specific stats
const CATEGORY_STATS = [
  { category: 'Dating profiles optimized', count: '3,400+', icon: '💕' },
  { category: 'Career decisions helped', count: '2,100+', icon: '💼' },
  { category: 'Style checks completed', count: '1,800+', icon: '👔' },
  { category: 'Business ideas reviewed', count: '950+', icon: '💡' }
];

interface SocialProofStatsProps {
  variant?: 'full' | 'compact' | 'minimal';
  showCategories?: boolean;
  className?: string;
}

export function SocialProofStats({
  variant = 'full',
  showCategories = true,
  className
}: SocialProofStatsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (variant === 'minimal') {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-6 text-sm", className)}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">24,000+ verdicts delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-gray-600">4.8/5 user rating</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">~47 min response time</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div ref={ref} className={cn("py-8", className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                isInView={isInView}
                className="text-2xl font-bold text-gray-900"
              />
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <section ref={ref} className={cn("py-16", className)}>
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Live platform stats</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by thousands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real numbers from real feedback
          </p>
        </motion.div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
              stat.bgColor
            )}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>

            <AnimatedCounter
              value={stat.value}
              suffix={stat.suffix}
              isInView={isInView}
              className="text-4xl font-bold text-gray-900 mb-1"
            />

            <div className="text-sm font-medium text-gray-900">{stat.label}</div>
            <div className="text-xs text-gray-500">{stat.description}</div>
          </motion.div>
        ))}
      </div>

      {/* Category stats */}
      {showCategories && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Helping people across every decision
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORY_STATS.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{item.count}</div>
                <div className="text-sm text-gray-600">{item.category}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

// Animated counter component
function AnimatedCounter({
  value,
  suffix = '',
  isInView,
  className
}: {
  value: number;
  suffix?: string;
  isInView: boolean;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  const formattedValue = value >= 1000
    ? displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : displayValue.toFixed(value % 1 === 0 ? 0 : 1);

  return (
    <div className={className}>
      {formattedValue}{suffix}
    </div>
  );
}

export default SocialProofStats;
