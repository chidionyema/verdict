'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Heart, Share2, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { SplitTestButton } from '@/components/features/SplitTestButton';

interface ContextualFeatureIntroProps {
  trigger: 'first_submission' | 'after_feedback' | 'multiple_photos' | 'high_engagement';
  onDismiss: () => void;
  onComplete?: () => void;
}

const featureIntros = {
  first_submission: {
    title: "Welcome to Verdict! 🎯",
    subtitle: "Here's what makes us different",
    features: [
      {
        icon: Heart,
        name: "No AI Reviews",
        description: "100% human feedback from real people",
        highlight: "Unlike other platforms, every review is written by a human"
      },
      {
        icon: TrendingUp,
        name: "Quality Reviewers",
        description: "Verified experts in their fields",
        highlight: "LinkedIn-verified professionals give better insights"
      },
      {
        icon: Share2,
        name: "Share Your Results",
        description: "Create viral-ready social media cards",
        highlight: "Turn feedback into engaging social content"
      }
    ],
    primaryAction: "Get Started",
    dismissible: true
  },
  
  after_feedback: {
    title: "Love the feedback? 💝",
    subtitle: "Support great reviewers",
    features: [
      {
        icon: Heart,
        name: "Tip Your Reviewer",
        description: "Send $1-$50 to show appreciation",
        highlight: "100% goes to the reviewer - no platform fees"
      }
    ],
    primaryAction: "Tip Now",
    dismissible: true
  },

  multiple_photos: {
    title: "Can't decide between photos? ⚡",
    subtitle: "Try our new Split Test feature",
    features: [
      {
        icon: Zap,
        name: "A/B Photo Comparison",
        description: "Upload 2 photos, get a clear winner",
        highlight: "Judges compare side-by-side and declare the best option"
      }
    ],
    primaryAction: "Start Split Test",
    dismissible: true,
    component: 'split_test'
  },

  high_engagement: {
    title: "Your feedback is popular! 🔥",
    subtitle: "Time to share it with the world",
    features: [
      {
        icon: Share2,
        name: "Viral Verdict Cards",
        description: "Create shareable social media images",
        highlight: "Perfect for Instagram, Twitter, and LinkedIn stories"
      }
    ],
    primaryAction: "Create Share Card",
    dismissible: true
  }
};

export function ContextualFeatureIntro({ trigger, onDismiss, onComplete }: ContextualFeatureIntroProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const intro = featureIntros[trigger];

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePrimaryAction = () => {
    if ((intro as any).component === 'split_test') {
      // SplitTestButton will handle the modal
      return;
    }
    
    onComplete?.();
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const nextFeature = () => {
    if (currentFeature < intro.features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      handlePrimaryAction();
    }
  };

  const skipToAction = () => {
    setCurrentFeature(intro.features.length - 1);
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white rounded-t-3xl">
          {intro.dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <h2 className="text-xl font-bold mb-2">{intro.title}</h2>
          <p className="text-indigo-100">{intro.subtitle}</p>

          {/* Progress dots */}
          {intro.features.length > 1 && (
            <div className="flex gap-2 mt-4">
              {intro.features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentFeature ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Feature Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            {React.createElement(intro.features[currentFeature].icon, {
              className: "h-12 w-12 text-indigo-600 mx-auto mb-4"
            })}
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {intro.features[currentFeature].name}
            </h3>
            
            <p className="text-gray-600 mb-3">
              {intro.features[currentFeature].description}
            </p>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm text-indigo-800 font-medium">
                💡 {intro.features[currentFeature].highlight}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {(intro as any).component === 'split_test' && currentFeature === intro.features.length - 1 ? (
              <SplitTestButton
                category="general"
                variant="default"
                className="w-full py-3"
              />
            ) : (
              <TouchButton
                onClick={nextFeature}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3"
              >
                {currentFeature < intro.features.length - 1 ? (
                  <>
                    Next Feature
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {intro.primaryAction}
                  </>
                )}
              </TouchButton>
            )}

            {/* Skip option for multi-feature intros */}
            {intro.features.length > 1 && currentFeature < intro.features.length - 1 && (
              <button
                onClick={skipToAction}
                className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
              >
                Skip to {intro.primaryAction}
              </button>
            )}

            {/* Dismiss option */}
            {intro.dismissible && (
              <button
                onClick={handleDismiss}
                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}