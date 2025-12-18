'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Inbox, 
  Search, 
  Plus, 
  ArrowRight, 
  Star, 
  Users, 
  Clock, 
  Zap,
  Eye,
  Heart,
  Sparkles,
  TrendingUp,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';

interface EmptyStateProps {
  variant: 'no-requests' | 'no-results' | 'no-feedback' | 'no-credits' | 'first-time' | 'error' | 'loading';
  title?: string;
  description?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  context?: {
    searchTerm?: string;
    filterType?: string;
    userType?: 'new' | 'returning' | 'expert';
  };
  className?: string;
}

export function EmptyState({ 
  variant, 
  title, 
  description, 
  actions = [], 
  context = {},
  className = '' 
}: EmptyStateProps) {
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(true);

  const getEmptyStateConfig = () => {
    switch (variant) {
      case 'no-requests':
        return {
          icon: Inbox,
          title: title || 'No requests yet',
          description: description || 'Your queue is empty. Time to help others make better decisions!',
          illustration: '📥',
          defaultActions: [
            {
              label: 'Browse Community Requests',
              action: () => router.push('/judge'),
              variant: 'primary' as const,
              icon: Users
            },
            {
              label: 'Submit Your Own',
              action: () => router.push('/start'),
              variant: 'secondary' as const,
              icon: Plus
            }
          ]
        };

      case 'no-results':
        return {
          icon: Search,
          title: title || `No results for "${context.searchTerm}"`,
          description: description || 'Try adjusting your search or browse popular categories instead.',
          illustration: '🔍',
          defaultActions: [
            {
              label: 'Clear Filters',
              action: () => window.location.reload(),
              variant: 'secondary' as const
            },
            {
              label: 'Browse All',
              action: () => router.push('/feed'),
              variant: 'primary' as const,
              icon: Eye
            }
          ]
        };

      case 'no-feedback':
        return {
          icon: MessageSquare,
          title: title || 'No feedback yet',
          description: description || 'Your request is being reviewed by experts. You\'ll get notified when feedback arrives!',
          illustration: '⏳',
          defaultActions: [
            {
              label: 'Check Status',
              action: () => router.push('/my-requests'),
              variant: 'secondary' as const,
              icon: Clock
            },
            {
              label: 'Submit Another',
              action: () => router.push('/start'),
              variant: 'primary' as const,
              icon: Plus
            }
          ]
        };

      case 'no-credits':
        return {
          icon: Star,
          title: title || 'No credits available',
          description: description || 'Help others get feedback to earn credits for your own submissions. Each 3 reviews = 1 credit!',
          illustration: '⭐',
          defaultActions: [
            {
              label: 'Start Reviewing',
              action: () => router.push('/judge'),
              variant: 'primary' as const,
              icon: Heart
            },
            {
              label: 'Pay £3 Instead',
              action: () => router.push('/start-simple?path=express'),
              variant: 'secondary' as const,
              icon: Zap
            }
          ]
        };

      case 'first-time':
        return {
          icon: Sparkles,
          title: title || 'Welcome to Verdict!',
          description: description || 'You\'re about to get honest feedback from real people. Here\'s how to get started.',
          illustration: '🎉',
          defaultActions: [
            {
              label: 'Take the Tour',
              action: () => {/* Would trigger onboarding */},
              variant: 'secondary' as const,
              icon: Eye
            },
            {
              label: 'Submit First Request',
              action: () => router.push('/start'),
              variant: 'primary' as const,
              icon: Plus
            }
          ]
        };

      case 'error':
        return {
          icon: AlertTriangle,
          title: title || 'Something went wrong',
          description: description || 'We couldn\'t load your content. Please try again.',
          illustration: '⚠️',
          defaultActions: [
            {
              label: 'Try Again',
              action: () => window.location.reload(),
              variant: 'primary' as const
            },
            {
              label: 'Go Home',
              action: () => router.push('/'),
              variant: 'secondary' as const
            }
          ]
        };

      default:
        return {
          icon: Inbox,
          title: title || 'Nothing here yet',
          description: description || 'This area is empty, but you can change that!',
          illustration: '📭',
          defaultActions: []
        };
    }
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;
  const finalActions = actions.length > 0 ? actions : config.defaultActions;

  return (
    <div className={`text-center py-16 px-8 ${className}`}>
      {/* Animated illustration */}
      <div className={`mb-8 ${isAnimated ? 'animate-bounce-gentle' : ''}`}>
        <div className="relative inline-block">
          {/* Background circle with subtle animation */}
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            <Icon className="w-12 h-12 text-gray-400" />
          </div>
          
          {/* Floating emoji */}
          <div className="text-4xl absolute -top-2 -right-2 animate-float">
            {config.illustration}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {config.title}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Actions */}
      {finalActions.length > 0 && (
        <div className="space-y-3 max-w-xs mx-auto">
          {finalActions.map((action, index) => (
            <TouchButton
              key={index}
              onClick={action.action}
              className={`w-full flex items-center justify-center gap-2 ${
                action.variant === 'primary' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {(action as any).icon && React.createElement((action as any).icon, { className: "w-4 h-4" })}
              {action.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </TouchButton>
          ))}
        </div>
      )}

      {/* Contextual help or tips */}
      {variant === 'no-credits' && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 text-sm">Quick tip</h3>
              <p className="text-blue-800 text-xs mt-1">
                Reviewing takes ~5 minutes per request. You'll learn a lot by seeing what others submit!
              </p>
            </div>
          </div>
        </div>
      )}

      {variant === 'first-time' && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: '📸', title: 'Upload anything', desc: 'Photos, text, or voice notes' },
            { icon: '⚡', title: 'Get 3 opinions', desc: 'Real humans, not AI' },
            { icon: '🎯', title: 'Make better decisions', desc: 'Honest, structured feedback' }
          ].map((item, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
              <p className="text-gray-600 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Specific empty states for common scenarios
export function NoRequestsEmptyState({ userType = 'returning' }: { userType?: 'new' | 'returning' | 'expert' }) {
  const router = useRouter();
  
  const getContextualMessage = () => {
    switch (userType) {
      case 'new':
        return {
          title: 'Ready to start judging?',
          description: 'Help others make better decisions and earn credits for your own requests. It\'s surprisingly addictive!'
        };
      case 'expert':
        return {
          title: 'Queue cleared! 🎉',
          description: 'You\'ve helped everyone in your queue. More requests will appear soon, or you can browse the global feed.'
        };
      default:
        return {
          title: 'No requests in your queue',
          description: 'Your personalized queue is empty. Check the global feed or wait for new requests to arrive.'
        };
    }
  };

  const { title, description } = getContextualMessage();

  return (
    <EmptyState
      variant="no-requests"
      title={title}
      description={description}
      context={{ userType }}
      actions={[
        {
          label: userType === 'new' ? 'Start Your First Review' : 'Browse All Requests',
          action: () => router.push('/judge'),
          variant: 'primary',
          icon: Users
        },
        {
          label: 'Submit Your Own',
          action: () => router.push('/start'),
          variant: 'secondary',
          icon: Plus
        }
      ]}
    />
  );
}

export function SearchEmptyState({ 
  searchTerm, 
  category,
  onClearSearch,
  onTryCategory 
}: {
  searchTerm: string;
  category?: string;
  onClearSearch: () => void;
  onTryCategory: (cat: string) => void;
}) {
  const popularCategories = [
    { name: 'Dating Photos', emoji: '💕', category: 'dating' },
    { name: 'Work Outfits', emoji: '👔', category: 'professional' },
    { name: 'Career Advice', emoji: '🚀', category: 'career' }
  ];

  return (
    <div className="text-center py-16 px-8">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-8 h-8 text-gray-400" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-3">
        No results for "{searchTerm}"
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Try a different search term or browse our popular categories instead.
      </p>

      {/* Popular categories */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Try these popular categories:</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {popularCategories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => onTryCategory(cat.category)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <span>{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-xs mx-auto">
        <TouchButton
          onClick={onClearSearch}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Clear Search & Browse All
        </TouchButton>
      </div>
    </div>
  );
}

// Animation styles
export function EmptyStateStyles() {
  return (
    <style jsx global>{`
      @keyframes bounce-gentle {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }
      
      .animate-bounce-gentle {
        animation: bounce-gentle 2s ease-in-out infinite;
      }
      
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
    `}</style>
  );
}