'use client';

import { useState } from 'react';
import { ArrowRight, X, Zap, Heart, Share2, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { SplitTestButton } from '@/components/features/SplitTestButton';

interface SmartFeatureCardProps {
  feature: 'split_test' | 'tipping' | 'sharing' | 'verification';
  context: {
    userLevel: 'new' | 'experienced' | 'power_user';
    hasUsedFeature: boolean;
    relevanceScore: number;
    triggerReason: string;
    estimatedValue: string;
  };
  onDismiss?: () => void;
  onInteract?: (action: string) => void;
  compact?: boolean;
}

const featureConfig = {
  split_test: {
    icon: Zap,
    title: "Split Test Photos",
    subtitle: "Compare 2 options, get a clear winner",
    gradient: "from-violet-500 to-purple-600",
    benefits: [
      "Side-by-side comparison",
      "Definitive winner declared", 
      "Detailed improvement tips"
    ],
    cta: "Start Split Test",
    estimatedTime: "Results in 30 min"
  },
  
  tipping: {
    icon: Heart,
    title: "Tip Great Reviewers",
    subtitle: "Show appreciation for exceptional feedback",
    gradient: "from-pink-500 to-rose-500",
    benefits: [
      "Support quality reviewers",
      "100% goes to reviewer",
      "Encourage better feedback"
    ],
    cta: "Send Tip",
    estimatedTime: "Takes 30 seconds"
  },
  
  sharing: {
    icon: Share2,
    title: "Share Your Results",
    subtitle: "Create viral social media content",
    gradient: "from-blue-500 to-indigo-600",
    benefits: [
      "Instagram-ready cards",
      "Engage your audience", 
      "Show your improvement"
    ],
    cta: "Create Share Card",
    estimatedTime: "Ready in 1 min"
  },
  
  verification: {
    icon: TrendingUp,
    title: "Get Verified",
    subtitle: "Unlock premium reviewer status",
    gradient: "from-emerald-500 to-teal-600",
    benefits: [
      "Higher tip potential",
      "Premium badge",
      "Priority in judge queue"
    ],
    cta: "Verify Profile",
    estimatedTime: "Verified in 24h"
  }
};

export function SmartFeatureCard({ 
  feature, 
  context, 
  onDismiss, 
  onInteract,
  compact = false 
}: SmartFeatureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const config = featureConfig[feature];
  const Icon = config.icon;

  if (isDismissed) return null;

  const handleInteract = (action: string) => {
    onInteract?.(action);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Compact version for in-flow suggestions
  if (compact) {
    return (
      <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 text-white relative group hover:shadow-lg transition-all`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{config.title}</h4>
            <p className="text-xs text-white/80">{context.triggerReason}</p>
          </div>
          
          <TouchButton
            onClick={() => handleInteract('primary_action')}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg border border-white/30"
          >
            Try It
            <ArrowRight className="h-3 w-3 ml-1" />
          </TouchButton>
        </div>
      </div>
    );
  }

  // Full feature card
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'shadow-xl scale-[1.02]' : 'hover:shadow-lg'
    }`}>
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative`}>
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-full p-3">
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">{config.title}</h3>
              {context.relevanceScore > 80 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  Perfect Match
                </span>
              )}
            </div>
            <p className="text-white/90">{config.subtitle}</p>
          </div>
        </div>

        {/* Context-aware messaging */}
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm text-white/90">
            💡 <strong>Why now?</strong> {context.triggerReason}
          </p>
          {context.estimatedValue && (
            <p className="text-xs text-white/70 mt-1">
              Potential value: {context.estimatedValue}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {config.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Estimated Time */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{config.estimatedTime}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {feature === 'split_test' ? (
            <SplitTestButton 
              category="general"
              variant="default"
              className="flex-1"
            />
          ) : (
            <TouchButton
              onClick={() => handleInteract('primary_action')}
              className={`flex-1 bg-gradient-to-r ${config.gradient} hover:shadow-lg text-white`}
            >
              {config.cta}
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchButton>
          )}
          
          <TouchButton
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            {isExpanded ? 'Less' : 'More'}
          </TouchButton>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                {feature === 'split_test' && (
                  <>
                    <li>1. Upload two photos you want to compare</li>
                    <li>2. Expert judges evaluate both side-by-side</li>
                    <li>3. Get clear winner + detailed feedback</li>
                  </>
                )}
                {feature === 'tipping' && (
                  <>
                    <li>1. Choose tip amount ($1-$50)</li>
                    <li>2. Add optional thank you message</li>
                    <li>3. 100% goes directly to reviewer</li>
                  </>
                )}
                {feature === 'sharing' && (
                  <>
                    <li>1. Select your best feedback results</li>
                    <li>2. Choose Instagram, Twitter, or LinkedIn format</li>
                    <li>3. Download ready-to-post image + caption</li>
                  </>
                )}
              </ol>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                {context.userLevel === 'new' && "New feature recommendation based on your activity"}
                {context.userLevel === 'experienced' && "Perfect timing - this feature complements your usage pattern"}
                {context.userLevel === 'power_user' && "Advanced feature unlock - you've earned access to premium tools"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}