'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Users, Zap, Star, Shield, Eye, Heart, Clock, ChevronDown } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  action?: {
    primary: { text: string; action: () => void };
    secondary?: { text: string; action: () => void };
  };
}

export function SmartOnboarding({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userIntent, setUserIntent] = useState<'explore' | 'submit' | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const steps: OnboardingStep[] = [
    // Step 1: Welcome & Value Prop
    {
      id: 'welcome',
      title: 'Welcome to Verdict',
      subtitle: 'Get honest feedback from real people',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto">
            <Star className="h-12 w-12 text-indigo-600" />
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Strangers tell the truth friends won't. Anonymous, structured, and proven to work.
            </p>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-center gap-3 text-sm font-medium">
                <span className="bg-white px-3 py-1 rounded-full text-green-800 border border-green-200">
                  15,000+ people
                </span>
                <span className="text-green-700">have made better decisions</span>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        primary: { 
          text: "Show me how it works", 
          action: () => setCurrentStep(1) 
        }
      }
    },

    // Step 2: How It Works (Interactive Demo)
    {
      id: 'demo',
      title: 'How Verdict Works',
      subtitle: 'Simple, honest feedback in 3 steps',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Step animations */}
            <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <p className="font-semibold">Submit your request</p>
                  <p className="text-sm text-gray-600">Photo, text, or voice note</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <p className="font-semibold text-gray-500">3 experts review it</p>
                  <p className="text-sm text-gray-400">Real humans, not AI</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <p className="font-semibold text-gray-500">Get honest feedback</p>
                  <p className="text-sm text-gray-400">Ratings + detailed explanations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Example feedback preview */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Example feedback:</div>
            <div className="bg-white rounded-lg p-3 text-sm">
              "8/10 - Great outfit choice! The colors work well together. Only suggestion: try a different belt - this one breaks up the silhouette. Otherwise perfect for the interview."
            </div>
          </div>
        </div>
      ),
      action: {
        primary: { 
          text: "I want to try this", 
          action: () => setCurrentStep(2) 
        },
        secondary: {
          text: "Tell me more",
          action: () => setShowDemo(true)
        }
      }
    },

    // Step 3: Intent Discovery
    {
      id: 'intent',
      title: 'What brings you here?',
      subtitle: 'Help us personalize your experience',
      content: (
        <div className="space-y-4">
          <div className="grid gap-4">
            <button
              onClick={() => setUserIntent('submit')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                userIntent === 'submit' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">I need feedback on something</h3>
                  <p className="text-sm text-gray-600">Dating photo, outfit, presentation, decision...</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setUserIntent('explore')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                userIntent === 'explore' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">I want to see how this works</h3>
                  <p className="text-sm text-gray-600">Browse examples, help others, earn credits...</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      ),
      action: userIntent ? {
        primary: { 
          text: userIntent === 'submit' ? "Get feedback now" : "Explore the community",
          action: () => setCurrentStep(3) 
        }
      } : undefined
    },

    // Step 4: Path Selection (Contextualized)
    {
      id: 'path',
      title: userIntent === 'submit' ? 'How urgent is this?' : 'Ready to dive in?',
      subtitle: userIntent === 'submit' 
        ? 'Choose based on your timeline' 
        : 'Start by helping others and earning credits',
      content: (
        <div className="space-y-6">
          {userIntent === 'submit' ? (
            // Submit-focused paths
            <div className="grid gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <h3 className="font-bold text-gray-900">I need this ASAP</h3>
                  <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-1 rounded-full">£3</span>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Pay £3, get feedback from 3 experts within 1 hour. Perfect for interviews, dates, or urgent decisions.
                </p>
                <TouchButton
                  onClick={() => router.push('/start-simple?path=express')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Get Feedback Now
                </TouchButton>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                  <h3 className="font-bold text-gray-900">I can wait a bit</h3>
                  <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full">FREE</span>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Help 3 people first (~20 min), earn 1 credit, then get your feedback for free.
                </p>
                <TouchButton
                  onClick={() => router.push('/judge')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Start by Helping Others
                </TouchButton>
              </div>
            </div>
          ) : (
            // Explore-focused path
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Start by helping others</h3>
              <p className="text-gray-700 mb-6">
                See real requests, give helpful feedback, and earn credits for your own submissions.
              </p>
              <TouchButton
                onClick={() => router.push('/judge')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Browse Community Requests
              </TouchButton>
            </div>
          )}
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Skip
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
            <div 
              className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {currentStepData.action && (
              <div className="flex gap-3">
                {currentStepData.action.secondary && (
                  <button
                    onClick={currentStepData.action.secondary.action}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    {currentStepData.action.secondary.text}
                  </button>
                )}
                <TouchButton
                  onClick={currentStepData.action.primary.action}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
                >
                  <span className="flex items-center gap-2">
                    {currentStepData.action.primary.text}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </TouchButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}