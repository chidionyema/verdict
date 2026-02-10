'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  userHistory: {
    mostUsedCategories: string[];
    averageRating: number;
    preferredTone: 'honest' | 'constructive' | 'encouraging';
    lastSubmissionTime: string | null;
  };
  deviceInfo: {
    isMobile: boolean;
    hasCamera: boolean;
  };
}

// Smart defaults hook for anticipating user needs
export function useSmartDefaults() {
  const [context, setContext] = useState<UserContext | null>(null);
  const router = useRouter();

  useEffect(() => {
    const detectContext = () => {
      const now = new Date();
      const hour = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      
      // Determine time of day
      let timeOfDay: UserContext['timeOfDay'] = 'morning';
      if (hour >= 6 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      // Get user history from localStorage (in real app, from API)
      const userHistory = {
        mostUsedCategories: JSON.parse(localStorage.getItem('user_categories') || '["appearance", "dating"]'),
        averageRating: parseFloat(localStorage.getItem('user_avg_rating') || '7'),
        preferredTone: (localStorage.getItem('user_preferred_tone') || 'constructive') as any,
        lastSubmissionTime: localStorage.getItem('last_submission_time')
      };

      // Detect device capabilities
      const deviceInfo = {
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
      };

      setContext({
        timeOfDay,
        dayOfWeek: isWeekend ? 'weekend' : 'weekday',
        userHistory,
        deviceInfo
      });
    };

    detectContext();
  }, []);

  // Smart suggestions based on context
  const getSmartSuggestions = () => {
    if (!context) return null;

    const suggestions: any = {
      quickActions: [],
      categoryDefaults: {},
      toneDefaults: {},
      messageDefaults: {}
    };

    // Time-based suggestions
    if (context.timeOfDay === 'morning' && context.dayOfWeek === 'weekday') {
      suggestions.quickActions.push({
        label: '📧 Work outfit check',
        action: () => router.push('/submit?category=appearance&subcategory=professional'),
        priority: 'high'
      });
    }

    if (context.timeOfDay === 'evening' && context.dayOfWeek === 'weekend') {
      suggestions.quickActions.push({
        label: '💕 Dating profile update',
        action: () => router.push('/submit?category=profile&subcategory=dating'),
        priority: 'high'
      });
    }

    // Device-based defaults
    if (context.deviceInfo.isMobile && context.deviceInfo.hasCamera) {
      suggestions.categoryDefaults.mediaType = 'photo';
      suggestions.messageDefaults.uploadHint = 'Tap to take a quick photo';
    } else {
      suggestions.categoryDefaults.mediaType = 'text';
      suggestions.messageDefaults.uploadHint = 'Describe your situation or upload an image';
    }

    // History-based defaults
    if (context.userHistory.mostUsedCategories.length > 0) {
      suggestions.categoryDefaults.category = context.userHistory.mostUsedCategories[0];
    }

    suggestions.toneDefaults.tone = context.userHistory.preferredTone;

    // Contextual messaging
    const timeSinceLastSubmission = context.userHistory.lastSubmissionTime 
      ? Date.now() - new Date(context.userHistory.lastSubmissionTime).getTime()
      : null;

    if (timeSinceLastSubmission && timeSinceLastSubmission < 24 * 60 * 60 * 1000) {
      suggestions.messageDefaults.welcomeMessage = 'Welcome back! Ready for more feedback?';
    } else if (timeSinceLastSubmission && timeSinceLastSubmission > 7 * 24 * 60 * 60 * 1000) {
      suggestions.messageDefaults.welcomeMessage = 'It\'s been a while! Let\'s get you some fresh perspective.';
    }

    return suggestions;
  };

  const recordUserAction = (action: string, data: any) => {
    // Record user actions for better predictions
    try {
      if (action === 'category_selected') {
        const categories = JSON.parse(localStorage.getItem('user_categories') || '[]');
        categories.unshift(data.category);
        localStorage.setItem('user_categories', JSON.stringify(categories.slice(0, 5)));
      }
      
      if (action === 'tone_selected') {
        localStorage.setItem('user_preferred_tone', data.tone);
      }
      
      if (action === 'rating_given') {
        const ratings = JSON.parse(localStorage.getItem('user_ratings') || '[]');
        ratings.push(data.rating);
        const avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
        localStorage.setItem('user_avg_rating', avgRating.toString());
        localStorage.setItem('user_ratings', JSON.stringify(ratings.slice(-10)));
      }

      if (action === 'submission_completed') {
        localStorage.setItem('last_submission_time', new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to record user action:', error);
    }
  };

  return {
    context,
    suggestions: getSmartSuggestions(),
    recordUserAction
  };
}

// Smart suggestions component
export function SmartSuggestions({ className = '' }: { className?: string }) {
  const { suggestions, context } = useSmartDefaults();

  if (!suggestions || !context) return null;

  const quickActions = suggestions.quickActions.filter((action: any) => action.priority === 'high');
  if (quickActions.length === 0) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 ${className}`}>
      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <span>🎯</span>
        Perfect timing for...
      </h3>
      <div className="space-y-2">
        {quickActions.map((action: any, index: number) => (
          <button
            key={index}
            onClick={action.action}
            className="w-full text-left bg-white rounded-lg p-3 hover:shadow-md transition-all duration-200 border border-blue-100 hover:border-blue-300"
          >
            <span className="text-sm font-medium text-gray-900">
              {action.label}
            </span>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-blue-700 mt-3">
        Based on {context.timeOfDay} patterns and your history
      </p>
    </div>
  );
}

// Smart form defaults hook
export function useSmartFormDefaults(formType: 'submission' | 'judging') {
  const { suggestions, recordUserAction } = useSmartDefaults();

  const getDefaults = () => {
    if (!suggestions) return {};

    const defaults: any = {};

    if (formType === 'submission') {
      if (suggestions.categoryDefaults.category) {
        defaults.category = suggestions.categoryDefaults.category;
      }
      if (suggestions.categoryDefaults.mediaType) {
        defaults.mediaType = suggestions.categoryDefaults.mediaType;
      }
    }

    if (formType === 'judging') {
      if (suggestions.toneDefaults.tone) {
        defaults.tone = suggestions.toneDefaults.tone;
      }
    }

    return defaults;
  };

  const getPlaceholders = () => {
    if (!suggestions) return {};

    const placeholders: any = {};

    if (formType === 'submission' && suggestions.messageDefaults.uploadHint) {
      placeholders.uploadHint = suggestions.messageDefaults.uploadHint;
    }

    return placeholders;
  };

  return {
    defaults: getDefaults(),
    placeholders: getPlaceholders(),
    recordAction: recordUserAction
  };
}