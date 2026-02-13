'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Users,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  Award,
  Zap,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustItem {
  icon: typeof Shield;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: Shield,
    title: '100% Anonymous',
    description: 'Neither side sees any personal information',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    icon: Users,
    title: 'Real Humans',
    description: 'Every verdict comes from a verified person, not AI',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    icon: RefreshCw,
    title: 'Quality Guaranteed',
    description: '3 feedback reports or your money back',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    icon: Clock,
    title: 'Fast Delivery',
    description: 'Average response time under 2 hours',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
];

const SECURITY_BADGES = [
  { icon: Lock, text: 'Secure & Encrypted' },
  { icon: Eye, text: 'Privacy Protected' },
  { icon: Shield, text: 'GDPR Compliant' }
];

interface TrustIndicatorsProps {
  variant?: 'full' | 'compact' | 'inline' | 'badges';
  className?: string;
}

export function TrustIndicators({ variant = 'full', className }: TrustIndicatorsProps) {
  if (variant === 'badges') {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
        {SECURITY_BADGES.map((badge, index) => (
          <motion.div
            key={badge.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full"
          >
            <badge.icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{badge.text}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-6 text-sm", className)}>
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="w-4 h-4 text-green-500" />
          <span>100% Anonymous</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Real Humans, Not AI</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-4 h-4 text-purple-500" />
          <span>Money-Back Guarantee</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "bg-gray-50 rounded-xl p-4 border border-gray-200",
        className
      )}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((item, index) => (
            <div key={item.title} className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bgColor)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <section className={cn("py-16", className)}>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Built on trust
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your privacy and satisfaction are our top priorities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {TRUST_ITEMS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4",
              item.bgColor
            )}>
              <item.icon className={cn("w-7 h-7", item.color)} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Guarantee banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Satisfaction Guaranteed
            </h3>
            <p className="text-gray-600 mb-4">
              If you don't receive 3 quality feedback reports, we'll refund your purchase in full.
              No questions asked. We're that confident in our community of reviewers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">3 reports guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Full refund if unsatisfied</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Quality-verified reviewers</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {SECURITY_BADGES.map((badge, index) => (
          <div
            key={badge.text}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full"
          >
            <badge.icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Standalone component for displaying near CTA buttons
export function TrustBadgesNearCTA({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600", className)}>
      <div className="flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-green-500" />
        <span>Anonymous</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4 text-blue-500" />
        <span>Real humans</span>
      </div>
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-4 h-4 text-purple-500" />
        <span>Guaranteed</span>
      </div>
    </div>
  );
}

export default TrustIndicators;
