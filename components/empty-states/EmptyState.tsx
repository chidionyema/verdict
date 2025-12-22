'use client';

import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Camera, 
  Sparkles, 
  ArrowRight, 
  Play,
  Heart,
  Target,
  Clock,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'dashboard' | 'requests' | 'reviews' | 'credits' | 'notifications';
  userProfile?: {
    credits: number;
    total_submissions: number;
    total_reviews: number;
    name?: string;
  };
}

const EMPTY_STATES = {
  dashboard: {
    icon: Sparkles,
    title: "Welcome! Let's get your first feedback",
    subtitle: "Join thousands getting honest opinions from real people",
    description: "Upload a photo, share some text, or ask for advice on any decision. Get 3 detailed responses in minutes.",
    action: {
      primary: { label: "Get Your First Feedback", href: "/create", icon: Plus },
      secondary: { label: "See Examples", href: "/explore", icon: Play }
    },
    illustration: "🎯",
    color: "indigo"
  },
  requests: {
    icon: MessageSquare,
    title: "No requests yet",
    subtitle: "Ready to get honest feedback?",
    description: "Create your first request and see what real people think. Whether it's photos, text, or tough decisions - we've got you covered.",
    action: {
      primary: { label: "Create First Request", href: "/create", icon: Plus },
      secondary: { label: "Browse Community", href: "/explore", icon: Users }
    },
    illustration: "💬",
    color: "blue"
  },
  reviews: {
    icon: Users,
    title: "Start earning credits by helping others",
    subtitle: "Review others' submissions to earn free credits",
    description: "Help people make better decisions and earn credits for your own requests. Each review takes 3-5 minutes.",
    action: {
      primary: { label: "Start Judging", href: "/judge", icon: Heart },
      secondary: { label: "Learn More", href: "/become-a-judge", icon: Target }
    },
    illustration: "🤝",
    color: "green"
  },
  credits: {
    icon: Sparkles,
    title: "You're out of credits",
    subtitle: "Get more credits to submit requests",
    description: "Earn credits by reviewing others' submissions (free) or purchase credits for instant access.",
    action: {
      primary: { label: "Earn Free Credits", href: "/judge", icon: Heart },
      secondary: { label: "Buy Credits", href: "/credits/buy", icon: Sparkles }
    },
    illustration: "⭐",
    color: "orange"
  },
  notifications: {
    icon: Clock,
    title: "No notifications yet",
    subtitle: "You'll get notified when you receive feedback",
    description: "Once you submit a request, you'll get notifications as people respond with their opinions.",
    action: {
      primary: { label: "Create Request", href: "/create", icon: Plus },
      secondary: { label: "Judge Others", href: "/judge", icon: Users }
    },
    illustration: "🔔",
    color: "purple"
  }
};

export function EmptyState({ type, userProfile }: EmptyStateProps) {
  const state = EMPTY_STATES[type];
  
  // Personalization based on user state
  const getPersonalizedContent = () => {
    if (type === 'dashboard' && userProfile) {
      if (userProfile.total_submissions === 0) {
        return {
          ...state,
          title: `${userProfile.name ? `Hey ${userProfile.name}! ` : ''}Ready for honest feedback?`,
          subtitle: `You have ${userProfile.credits} free credits to get started`
        };
      }
    }
    return state;
  };

  const content = getPersonalizedContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-8"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <div className={`w-24 h-24 mx-auto mb-4 bg-gradient-to-br ${
          content.color === 'indigo' ? 'from-indigo-500 to-purple-600' :
          content.color === 'blue' ? 'from-blue-500 to-cyan-600' :
          content.color === 'green' ? 'from-green-500 to-emerald-600' :
          content.color === 'orange' ? 'from-orange-500 to-amber-600' :
          'from-purple-500 to-pink-600'
        } rounded-2xl flex items-center justify-center shadow-xl`}>
          <content.icon className="h-12 w-12 text-white" />
        </div>
        <div className="text-6xl mb-4">{content.illustration}</div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-md mx-auto mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </h2>
        <p className="text-gray-600 mb-4">
          {content.subtitle}
        </p>
        <p className="text-sm text-gray-500">
          {content.description}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {/* Primary Action */}
        <Link
          href={content.action.primary.href}
          className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${
            content.color === 'indigo' ? 'from-indigo-600 to-purple-600' :
            content.color === 'blue' ? 'from-blue-600 to-cyan-600' :
            content.color === 'green' ? 'from-green-600 to-emerald-600' :
            content.color === 'orange' ? 'from-orange-600 to-amber-600' :
            'from-purple-600 to-pink-600'
          } text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5`}
        >
          <content.action.primary.icon className="h-5 w-5" />
          {content.action.primary.label}
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Secondary Action */}
        <div>
          <Link
            href={content.action.secondary.href}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <content.action.secondary.icon className="h-4 w-4" />
            {content.action.secondary.label}
          </Link>
        </div>
      </motion.div>

      {/* Additional Context */}
      {type === 'dashboard' && userProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-700">{userProfile.credits}</div>
              <div className="text-xs text-blue-600">Credits</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-700">{userProfile.total_reviews}</div>
              <div className="text-xs text-green-600">Reviews</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-700">{userProfile.total_submissions}</div>
              <div className="text-xs text-purple-600">Requests</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      {type === 'requests' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 max-w-lg mx-auto"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">💡 Popular request types:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <Camera className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">Dating photos</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Outfit choices</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-gray-700">Life decisions</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-gray-700">Business ideas</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}