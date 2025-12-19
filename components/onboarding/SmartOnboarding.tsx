'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Camera,
  MessageSquare,
  Scale,
  RotateCcw,
  Users,
  Crown,
  Star,
  Target,
  Award,
  Zap,
  Eye,
  Heart,
  FileText,
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  ChevronRight,
  Play,
  Gift,
} from 'lucide-react';

interface OnboardingProps {
  userId: string;
  userProfile: any;
  onComplete: () => void;
}

type OnboardingStep = 
  | 'welcome'
  | 'value_prop'
  | 'categories'
  | 'request_types'
  | 'judge_opportunity'
  | 'first_request';

const ONBOARDING_STEPS: {
  id: OnboardingStep;
  title: string;
  subtitle: string;
}[] = [
  { id: 'welcome', title: 'Welcome to Verdict', subtitle: 'Get expert feedback in minutes' },
  { id: 'value_prop', title: 'How It Works', subtitle: 'Your journey to better decisions' },
  { id: 'categories', title: 'What Can You Improve?', subtitle: 'Discover feedback categories' },
  { id: 'request_types', title: 'Advanced Features', subtitle: 'Compare, test, and analyze' },
  { id: 'judge_opportunity', title: 'Earn While You Help', subtitle: 'Become a judge and earn credits' },
  { id: 'first_request', title: 'Create Your First Request', subtitle: 'Start your improvement journey' },
];

export default function SmartOnboarding({ userId, userProfile, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<string | null>(null);
  const [interestedInJudging, setInterestedInJudging] = useState<boolean | null>(null);

  useEffect(() => {
    const shouldShowOnboarding = checkShouldShowOnboarding();
    if (shouldShowOnboarding) {
      setIsVisible(true);
    }
  }, [userId]);

  const checkShouldShowOnboarding = () => {
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${userId}`);
    const hasActiveRequests = userProfile?.total_requests > 0;
    
    return !hasCompletedOnboarding && !hasActiveRequests;
  };

  const markOnboardingComplete = async () => {
    localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    
    try {
      const supabase = createClient();
      await supabase.from('user_onboarding').upsert({
        user_id: userId,
        completed_at: new Date().toISOString(),
        selected_category: selectedCategory,
        selected_request_type: selectedRequestType,
        interested_in_judging: interestedInJudging,
      } as any);
    } catch (error) {
      console.error('Error tracking onboarding completion:', error);
    }
    
    setIsVisible(false);
    onComplete();
  };

  const handleNext = () => {
    const currentIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1].id);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setTimeout(handleNext, 800);
  };

  const handleRequestTypeSelect = (type: string) => {
    setSelectedRequestType(type);
    setTimeout(handleNext, 800);
  };

  const handleJudgeInterest = (interested: boolean) => {
    setInterestedInJudging(interested);
    setTimeout(handleNext, 800);
  };

  if (!isVisible) return null;

  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-2 bg-gray-200 rounded-t-2xl">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-tl-2xl transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="h-12 w-12 text-white animate-pulse" />
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome to Verdict
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Get expert feedback on anything in minutes. Join thousands who've improved their decisions,
                appearance, writing, and more with real human insights.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Fast Results</h3>
                  <p className="text-sm text-gray-600">Get feedback within 2 hours from verified experts</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Verified Judges</h3>
                  <p className="text-sm text-gray-600">Quality feedback from qualified reviewers</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3 Free Requests</h3>
                  <p className="text-sm text-gray-600">Start immediately with no upfront cost</p>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all font-semibold text-lg group"
              >
                Let's Get Started
                <ArrowRight className="h-5 w-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Value Proposition Step */}
          {currentStep === 'value_prop' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">How Verdict Works</h2>
              <p className="text-gray-600 mb-8">Your journey to better decisions in 3 simple steps</p>

              <div className="space-y-8 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Your Request</h3>
                    <p className="text-gray-600">Upload photos, share writing, or describe your decision. Add context about what feedback you need.</p>
                  </div>
                  <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Review</h3>
                    <p className="text-gray-600">Verified judges review your content and provide detailed, honest feedback with ratings and suggestions.</p>
                  </div>
                  <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Results</h3>
                    <p className="text-gray-600">Receive detailed feedback, ratings, and actionable insights to improve and make better decisions.</p>
                  </div>
                  <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Categories Step */}
          {currentStep === 'categories' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What Can You Improve?</h2>
              <p className="text-gray-600 mb-8">Choose a category that interests you most</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    id: 'appearance',
                    title: 'Appearance & Style',
                    subtitle: 'Photos, outfits, looks, selfies',
                    icon: Eye,
                    emoji: '👔',
                    gradient: 'from-pink-500 to-rose-500',
                    examples: ['Profile photos', 'Outfit choices', 'Hairstyles', 'Makeup looks'],
                  },
                  {
                    id: 'profile',
                    title: 'Profile & Dating',
                    subtitle: 'Dating profiles, bios, presentations',
                    icon: Heart,
                    emoji: '💼',
                    gradient: 'from-red-500 to-pink-500',
                    examples: ['Dating profiles', 'LinkedIn photos', 'Bios', 'Personal brands'],
                  },
                  {
                    id: 'writing',
                    title: 'Writing & Content',
                    subtitle: 'Copy, essays, messages, scripts',
                    icon: FileText,
                    emoji: '✍️',
                    gradient: 'from-blue-500 to-cyan-500',
                    examples: ['Essays', 'Marketing copy', 'Social posts', 'Creative writing'],
                  },
                  {
                    id: 'decision',
                    title: 'Decisions & Choices',
                    subtitle: 'Life choices, career moves, purchases',
                    icon: Lightbulb,
                    emoji: '🤔',
                    gradient: 'from-green-500 to-emerald-500',
                    examples: ['Career moves', 'Purchase decisions', 'Life choices', 'Strategies'],
                  },
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 ${
                      selectedCategory === category.id
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg transform -translate-y-1'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {selectedCategory === category.id && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="text-3xl">{category.emoji}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{category.subtitle}</p>
                    
                    <div className="text-xs text-gray-500">
                      Examples: {category.examples.slice(0, 2).join(', ')}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {selectedCategory && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Request Types Step */}
          {currentStep === 'request_types' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced Features</h2>
              <p className="text-gray-600 mb-8">Discover powerful ways to get feedback</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    id: 'verdict',
                    title: 'Standard Feedback',
                    subtitle: 'Get expert opinions on your content',
                    icon: MessageSquare,
                    gradient: 'from-blue-500 to-cyan-500',
                    features: ['Professional feedback', 'Multiple perspectives', 'Detailed analysis'],
                    badge: 'Most Popular',
                    badgeColor: 'bg-green-500',
                  },
                  {
                    id: 'comparison',
                    title: 'A/B Comparison',
                    subtitle: 'Compare two options side by side',
                    icon: Scale,
                    gradient: 'from-purple-500 to-pink-500',
                    features: ['Direct comparison', 'Clear winner', 'Preference reasons'],
                    badge: 'Advanced',
                    badgeColor: 'bg-purple-500',
                  },
                  {
                    id: 'split_test',
                    title: 'Split Test',
                    subtitle: 'Test with different demographics',
                    icon: RotateCcw,
                    gradient: 'from-orange-500 to-red-500',
                    features: ['Demographic targeting', 'Data insights', 'Statistical analysis'],
                    badge: 'Pro',
                    badgeColor: 'bg-orange-500',
                  },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleRequestTypeSelect(type.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 ${
                      selectedRequestType === type.id
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg transform -translate-y-1'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`absolute top-3 right-3 ${type.badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                      {type.badge}
                    </div>
                    
                    {selectedRequestType === type.id && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <type.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{type.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{type.subtitle}</p>
                    
                    <ul className="space-y-1">
                      {type.features.map((feature) => (
                        <li key={feature} className="text-sm text-gray-700 flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {selectedRequestType && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Judge Opportunity Step */}
          {currentStep === 'judge_opportunity' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Earn While You Help</h2>
              <p className="text-gray-600 mb-8">Become a judge and earn credits by reviewing others' requests</p>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crown className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">Judge Benefits</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Earn Credits</h4>
                    <p className="text-sm text-gray-600">Get 1 credit for every 2 verdicts</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Help Others</h4>
                    <p className="text-sm text-gray-600">Share your expertise and insights</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Build Reputation</h4>
                    <p className="text-sm text-gray-600">Gain status as a trusted judge</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Judging is easy - review requests in categories you know well and provide helpful feedback. 
                  You'll earn credits to use for your own requests while helping others improve.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleJudgeInterest(true)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-center group hover:shadow-lg ${
                    interestedInJudging === true
                      ? 'border-green-300 bg-green-50 shadow-lg'
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  }`}
                >
                  {interestedInJudging === true && (
                    <div className="flex justify-center mb-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Yes, I'm Interested!</h3>
                  <p className="text-gray-600 text-sm">I'd like to become a judge and earn credits</p>
                </button>

                <button
                  onClick={() => handleJudgeInterest(false)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-center group hover:shadow-lg ${
                    interestedInJudging === false
                      ? 'border-gray-400 bg-gray-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  {interestedInJudging === false && (
                    <div className="flex justify-center mb-3">
                      <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Maybe Later</h3>
                  <p className="text-gray-600 text-sm">I just want to submit requests for now</p>
                </button>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {interestedInJudging !== null && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* First Request Step */}
          {currentStep === 'first_request' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your First Request</h2>
              <p className="text-gray-600 mb-8">Ready to get expert feedback? Let's start your improvement journey!</p>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Gift className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">3 Free Credits</h4>
                    <p className="text-sm text-gray-600">Start with no cost</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Fast Feedback</h4>
                    <p className="text-sm text-gray-600">Results in 2 hours</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Quality Guaranteed</h4>
                    <p className="text-sm text-gray-600">Verified judges only</p>
                  </div>
                </div>

                {selectedCategory && (
                  <div className="text-center mb-6">
                    <p className="text-gray-700">
                      Based on your interest in <strong>{selectedCategory}</strong>
                      {selectedRequestType && selectedRequestType !== 'verdict' && (
                        <> and <strong>{selectedRequestType === 'comparison' ? 'A/B comparisons' : 'split testing'}</strong></>
                      )}, we'll help you create the perfect first request.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/create"
                  onClick={markOnboardingComplete}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all font-bold text-lg group"
                >
                  <Play className="h-5 w-5" />
                  Create My First Request
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/workspace"
                  onClick={markOnboardingComplete}
                  className="inline-flex items-center gap-3 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all font-medium text-lg"
                >
                  Go to Workspace
                </Link>
              </div>

              <button
                onClick={handlePrevious}
                className="mt-6 flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}