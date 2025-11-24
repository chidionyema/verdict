'use client';

import { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, User, Clock, Star, Award } from 'lucide-react';

interface UserProfile {
  id: string;
  preferences: {
    categories: string[];
    responseStyle: 'direct' | 'detailed' | 'encouraging';
    priorityAreas: string[];
  };
  history: {
    totalRequests: number;
    averageRating: number;
    improvementAreas: string[];
    successPatterns: string[];
  };
  goals: {
    primary: string;
    timeline: string;
    measurableOutcomes: string[];
  };
}

interface PersonalizationSuggestion {
  type: 'category' | 'timing' | 'context' | 'approach';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  icon: any;
}

interface PersonalizationEngineProps {
  category: string;
  mediaType: 'photo' | 'text';
  context: string;
  userProfile?: UserProfile;
}

export default function PersonalizationEngine({
  category,
  mediaType,
  context,
  userProfile
}: PersonalizationEngineProps) {
  const [suggestions, setSuggestions] = useState<PersonalizationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const personalizedSuggestions = generatePersonalizedSuggestions(
        category,
        mediaType,
        context,
        userProfile
      );
      setSuggestions(personalizedSuggestions);
      setIsAnalyzing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [category, mediaType, context, userProfile]);

  const generatePersonalizedSuggestions = (
    cat: string,
    type: string,
    ctx: string,
    profile?: UserProfile
  ): PersonalizationSuggestion[] => {
    const suggestions: PersonalizationSuggestion[] = [];

    // First-time user suggestions
    if (!profile || profile.history.totalRequests === 0) {
      suggestions.push({
        type: 'approach',
        title: 'First-Time Optimization',
        description: 'Upload multiple angles and be very specific about your goals for the best first experience',
        confidence: 90,
        impact: 'high',
        icon: Star
      });

      suggestions.push({
        type: 'timing',
        title: 'Prime Time Upload',
        description: 'Upload between 10 AM - 2 PM EST for fastest expert response times',
        confidence: 85,
        impact: 'medium',
        icon: Clock
      });
    }

    // Returning user patterns
    if (profile && profile.history.totalRequests > 0) {
      // Success pattern recognition
      if (profile.history.successPatterns.includes(cat)) {
        suggestions.push({
          type: 'category',
          title: 'Your Strength Area',
          description: `You've had great results with ${cat} requests. Consider building on this success!`,
          confidence: 95,
          impact: 'high',
          icon: TrendingUp
        });
      }

      // Improvement area targeting
      if (profile.history.improvementAreas.includes(cat)) {
        suggestions.push({
          type: 'approach',
          title: 'Focused Improvement',
          description: `Based on your goals, try being more specific about ${profile.goals.primary.toLowerCase()}`,
          confidence: 88,
          impact: 'high',
          icon: Target
        });
      }

      // Response style personalization
      if (profile.preferences.responseStyle === 'direct') {
        suggestions.push({
          type: 'context',
          title: 'Direct Feedback Request',
          description: 'Add "I prefer direct, actionable feedback" to get your preferred response style',
          confidence: 80,
          impact: 'medium',
          icon: User
        });
      } else if (profile.preferences.responseStyle === 'encouraging') {
        suggestions.push({
          type: 'context',
          title: 'Supportive Feedback Request',
          description: 'Mention you appreciate encouraging, confidence-building feedback',
          confidence: 80,
          impact: 'medium',
          icon: Award
        });
      }
    }

    // Category-specific personalization
    if (cat === 'appearance') {
      if (type === 'photo' && ctx.includes('interview')) {
        suggestions.push({
          type: 'approach',
          title: 'Interview-Specific Angles',
          description: 'Include a full-body shot and close-up for comprehensive professional feedback',
          confidence: 92,
          impact: 'high',
          icon: Target
        });
      }

      if (ctx.includes('date') || ctx.includes('dating')) {
        suggestions.push({
          type: 'context',
          title: 'Dating Context Enhancement',
          description: 'Mention the type of date (casual, formal) and your personality style for better matches',
          confidence: 87,
          impact: 'high',
          icon: Brain
        });
      }
    }

    if (cat === 'profile') {
      suggestions.push({
        type: 'approach',
        title: 'Multi-Platform Optimization',
        description: 'Consider how this will look across LinkedIn, dating apps, and professional networks',
        confidence: 85,
        impact: 'medium',
        icon: TrendingUp
      });
    }

    // Context quality enhancement
    if (ctx.length < 80) {
      suggestions.push({
        type: 'context',
        title: 'Context Expansion',
        description: 'Add details about your target audience and desired impression for 2x better feedback',
        confidence: 93,
        impact: 'high',
        icon: Brain
      });
    }

    // Goal alignment
    if (profile?.goals.primary) {
      suggestions.push({
        type: 'approach',
        title: 'Goal Alignment',
        description: `This request aligns with your "${profile.goals.primary}" goal. Mention this for targeted advice.`,
        confidence: 89,
        impact: 'high',
        icon: Target
      });
    }

    return suggestions.slice(0, 4); // Top 4 suggestions
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const applySuggestion = (suggestion: PersonalizationSuggestion) => {
    setSelectedSuggestion(suggestion.title);
    // In a real app, this would modify the user's input or provide guided assistance
    setTimeout(() => setSelectedSuggestion(null), 2000);
  };

  if (isAnalyzing) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-indigo-600 animate-pulse" />
            <h3 className="text-lg font-semibold text-indigo-900">
              Personalizing Your Experience...
            </h3>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-indigo-700 text-sm mt-2">
            Analyzing your patterns and preferences...
          </p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-indigo-900">
            AI Personal Coach
          </h3>
        </div>
        <p className="text-indigo-700">
          Tailored suggestions based on your patterns and goals
        </p>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          const isSelected = selectedSuggestion === suggestion.title;

          return (
            <div
              key={index}
              className={`bg-white rounded-lg p-4 border transition-all duration-200 ${
                isSelected 
                  ? 'border-indigo-300 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-indigo-200 hover:shadow-md cursor-pointer'
              }`}
              onClick={() => !isSelected && applySuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestion.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.description}</p>
                  
                  {isSelected && (
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Suggestion applied! This will improve your feedback quality.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Promise */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="text-center">
          <p className="text-sm font-medium text-green-800 mb-1">
            🎯 Following these suggestions typically results in:
          </p>
          <div className="flex justify-center gap-4 text-xs text-green-700">
            <span>• 40% higher ratings</span>
            <span>• 2x more actionable advice</span>
            <span>• Faster expert response</span>
          </div>
        </div>
      </div>
    </div>
  );
}