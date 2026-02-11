'use client';

import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: string;
  action_url?: string;
  priority: 'high' | 'medium' | 'low';
}

interface InsightCardProps {
  insight: Insight;
  index?: number;
}

const typeConfig = {
  success: {
    icon: Award,
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    actionColor: 'text-green-700 hover:text-green-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    actionColor: 'text-amber-700 hover:text-amber-800',
  },
  info: {
    icon: Zap,
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    actionColor: 'text-blue-700 hover:text-blue-800',
  },
  tip: {
    icon: Lightbulb,
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-800',
    actionColor: 'text-purple-700 hover:text-purple-800',
  },
};

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`${config.bg} ${config.border} border rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl ${config.iconBg} shrink-0`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.titleColor} mb-1 leading-tight`}>
            {insight.title}
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {insight.description}
          </p>

          {insight.action && insight.action_url && (
            <Link
              href={insight.action_url}
              className={`inline-flex items-center gap-1.5 mt-3 text-sm font-medium ${config.actionColor} transition-colors group`}
            >
              {insight.action}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
