'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import {
  Camera,
  FileText,
  Scale,
  RotateCcw,
  Users,
  Crown,
  Clock,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Upload,
  Type,
  Mic,
  Image as ImageIcon,
  Plus,
  Check,
  ArrowRight,
  Info,
  Zap,
  Award,
  Heart,
  MessageSquare,
  Eye,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { submitRequest } from '@/lib/verdicts-client';
import FeatureDiscovery from '@/components/discovery/FeatureDiscovery';
import { RippleButton, MagneticButton, PulseElement, AnimatedProgressRing, ConfettiBurst } from '@/components/ui/MicroInteractions';
import { useProgressiveProfile } from '@/hooks/useProgressiveProfile';
import { ProgressiveProfile } from '@/components/onboarding/ProgressiveProfile';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';
import { CommunityPathExplainer } from '@/components/ui/CommunityPathExplainer';
import { SmartJudgeRecruitment } from '@/components/judge/SmartJudgeRecruitment';
import { ErrorRecovery, useErrorRecovery } from '@/components/error/ErrorRecovery';
import { ProgressiveHints } from '@/components/onboarding/ProgressiveHints';
import { FeedbackPreview } from '@/components/feedback/FeedbackPreview';
// TODO: Re-enable after launch
// import { SmartCreditSuggestions, useSmartCreditSuggestions } from '@/components/credits/SmartCreditSuggestions';
// import { SocialProofWidget, useSocialProof } from '@/components/social-proof/SocialProofWidget';
// import { MobileCreateOptimizations } from '@/components/mobile/MobileCreateOptimizations';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type RequestType = 'verdict' | 'comparison' | 'split_test';
type MediaType = 'photo' | 'text' | 'audio';
type Category = 'appearance' | 'profile' | 'writing' | 'decision';
type Tier = 'community' | 'standard' | 'premium';

interface FormData {
  requestType: RequestType;
  mediaType: MediaType;
  category: Category;
  tier: Tier;
  context: string;
  textContent: string;
  mediaFiles: File[];
  targetVerdictCount: number;
  creditsToUse: number;
  specificQuestions: string[];
  demographicFilters: any;
}

const STEPS = [
  { id: 'content', title: 'Add Content', subtitle: 'What do you need feedback on?' },
  { id: 'details', title: 'Feedback Options', subtitle: 'Choose how many opinions you want' },
  { id: 'preview', title: 'Quality Preview', subtitle: 'See what feedback to expect' },
  { id: 'review', title: 'Review & Submit', subtitle: 'Confirm and launch your request' },
];

const REQUEST_TYPES = [
  {
    id: 'verdict' as RequestType,
    title: 'Standard Feedback',
    subtitle: 'Get expert opinions on your content',
    icon: MessageSquare,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Professional feedback', 'Multiple perspectives', 'Detailed analysis'],
    popular: true,
  },
  {
    id: 'comparison' as RequestType,
    title: 'A/B Comparison',
    subtitle: 'Compare two options side by side',
    icon: Scale,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Direct comparison', 'Clear winner', 'Preference reasons'],
    badge: 'Advanced',
  },
  {
    id: 'split_test' as RequestType,
    title: 'Split Test',
    subtitle: 'Test with different demographics',
    icon: RotateCcw,
    gradient: 'from-orange-500 to-red-500',
    features: ['Demographic targeting', 'Data insights', 'Statistical analysis'],
    badge: 'Pro',
  },
];

const MEDIA_TYPES = [
  {
    id: 'photo' as MediaType,
    title: 'Photo/Image',
    subtitle: 'Upload photos, screenshots, designs',
    icon: ImageIcon,
    accept: 'image/*',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'text' as MediaType,
    title: 'Text/Writing',
    subtitle: 'Paste or type your content',
    icon: Type,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'audio' as MediaType,
    title: 'Audio/Voice',
    subtitle: 'Upload voice recordings or audio',
    icon: Mic,
    accept: 'audio/*',
    gradient: 'from-purple-500 to-pink-500',
    badge: 'Beta',
  },
];

const CATEGORIES = [
  {
    id: 'appearance' as Category,
    title: 'Appearance & Style',
    subtitle: 'Photos, outfits, looks, selfies',
    icon: Eye,
    emoji: '👔',
    examples: ['Profile photos', 'Outfit choices', 'Hairstyles', 'Makeup looks'],
  },
  {
    id: 'profile' as Category,
    title: 'Profile & Dating',
    subtitle: 'Dating profiles, bios, presentations',
    icon: Heart,
    emoji: '💼',
    examples: ['Dating profiles', 'LinkedIn photos', 'Bios', 'Presentations'],
  },
  {
    id: 'writing' as Category,
    title: 'Writing & Content',
    subtitle: 'Copy, essays, messages, scripts',
    icon: FileText,
    emoji: '✍️',
    examples: ['Essays', 'Marketing copy', 'Messages', 'Social posts'],
  },
  {
    id: 'decision' as Category,
    title: 'Decisions & Choices',
    subtitle: 'Life choices, career moves, purchases',
    icon: Lightbulb,
    emoji: '🤔',
    examples: ['Career moves', 'Purchase decisions', 'Life choices', 'Strategies'],
  },
];

const TIERS = [
  {
    id: 'community' as Tier,
    title: 'Community',
    subtitle: '3 verdicts from community',
    price: '1 credit',
    verdictCount: 3,
    credits: 1,
    icon: Users,
    features: ['Community judges', 'Quick feedback', 'Basic analysis'],
    turnaround: '30 minutes',
    gradient: 'from-gray-500 to-slate-500',
  },
  {
    id: 'standard' as Tier,
    title: 'Standard',
    subtitle: '5 verdicts from verified judges',
    price: '2 credits',
    verdictCount: 5,
    credits: 2,
    icon: Star,
    features: ['Verified judges', 'Detailed feedback', 'Quality guaranteed'],
    turnaround: '2 hours',
    gradient: 'from-blue-500 to-indigo-500',
    popular: true,
  },
  {
    id: 'premium' as Tier,
    title: 'Premium',
    subtitle: '10 verdicts from expert judges',
    price: '4 credits',
    verdictCount: 10,
    credits: 4,
    icon: Crown,
    features: ['Expert judges', 'Comprehensive analysis', 'Priority support'],
    turnaround: '1 hour',
    gradient: 'from-purple-500 to-pink-500',
    badge: 'Best Value',
  },
];

export default function CreateRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
    requestType: 'verdict',
    mediaType: 'photo',
    category: 'appearance',
    tier: 'standard',
    context: '',
    textContent: '',
    mediaFiles: [],
    targetVerdictCount: 5,
    creditsToUse: 2,
    specificQuestions: [],
    demographicFilters: {},
  });

  const [draftSaved, setDraftSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [showCommunityPathExplainer, setShowCommunityPathExplainer] = useState(false);
  const [usingCommunityPath, setUsingCommunityPath] = useState(false);
  
  // Progressive profiling
  const { shouldShow: showProgressiveProfile, triggerType, dismiss: dismissProgressiveProfile, checkTrigger } = useProgressiveProfile();
  
  // Error recovery system
  const { error, isRetrying, handleError, retry, clearError } = useErrorRecovery();
  
  // TODO: Re-enable after launch
  // const shouldShowCreditSuggestions = useSmartCreditSuggestions(profile);
  // const { shouldShow: shouldShowSocialProof } = useSocialProof();

  useEffect(() => {
    const initializeUser = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          
          // Get profile with credits
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);

          // Load draft and/or initialize from querystring
          let nextFormData: FormData = { ...formData };

          // Draft from localStorage (if any)
          const savedDraft = localStorage.getItem('verdict_request_draft');
          if (savedDraft) {
            try {
              const draft = JSON.parse(savedDraft);
              nextFormData = { ...nextFormData, ...draft };
              setDraftSaved(true);
            } catch (e) {
              console.error('Failed to load draft:', e);
            }
          }

          // Request type from querystring (?type=verdict|comparison|split_test)
          try {
            const params = new URLSearchParams(window.location.search);
            const typeParam = params.get('type') as RequestType | null;
            const validTypes: RequestType[] = ['verdict', 'comparison', 'split_test'];

            if (typeParam && validTypes.includes(typeParam)) {
              nextFormData = {
                ...nextFormData,
                requestType: typeParam,
              };
            }
          } catch (e) {
            console.error('Failed to read type from querystring:', e);
          }

          setFormData(nextFormData);
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        localStorage.setItem('verdict_request_draft', JSON.stringify(formData));
        setDraftSaved(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formData, loading, user]);

  // Update tier-dependent values
  useEffect(() => {
    const tier = TIERS.find(t => t.id === formData.tier);
    if (tier) {
      setFormData(prev => ({
        ...prev,
        targetVerdictCount: tier.verdictCount,
        creditsToUse: tier.credits,
      }));
    }
  }, [formData.tier]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setDraftSaved(false);
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0: // Content upload
        if (formData.mediaType === 'text') {
          return formData.textContent.trim().length > 10 && formData.context.trim().length > 10;
        } else {
          return formData.mediaFiles.length > 0 && formData.context.trim().length > 10;
        }
      case 1: // Details
        return true;
      case 2: // Preview
        return true;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canContinue() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    try {
      const newFiles = Array.from(files);
      
      // Validate file types
      const invalidFiles = newFiles.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        return !isImage && !isAudio;
      });
      
      if (invalidFiles.length > 0) {
        handleError('file_format', `File format not supported: ${invalidFiles[0].name}`, { files: newFiles });
        return;
      }
      
      // Validate file sizes
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024); // 10MB
      if (oversizedFiles.length > 0) {
        handleError('upload', `File too large: ${oversizedFiles[0].name} (max 10MB)`, { files: newFiles });
        return;
      }
      
      // Validate count for comparison requests
      if (formData.requestType === 'comparison' || formData.requestType === 'split_test') {
        if (formData.mediaFiles.length + newFiles.length > 2) {
          handleError('upload', 'Maximum 2 files allowed for comparison requests', { files: newFiles });
          return;
        }
      }
      
      updateFormData({
        mediaFiles: [...formData.mediaFiles, ...newFiles],
      });
      
    } catch (err) {
      handleError('upload', 'Failed to process files. Please try again.', { files });
    }
  };

  const removeFile = (index: number) => {
    updateFormData({
      mediaFiles: formData.mediaFiles.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!canContinue()) return;
    
    setSubmitting(true);
    try {
      // Check credits before submission
      if (!usingCommunityPath && (profile?.credits || 0) < formData.creditsToUse) {
        handleError('quota', `You need ${formData.creditsToUse} credits but only have ${profile?.credits || 0}`, formData);
        setSubmitting(false);
        return;
      }
      
      const result = await submitRequest({
        requestType: formData.requestType,
        category: formData.category,
        context: formData.context,
        textContent: formData.textContent,
        mediaType: formData.mediaType,
        targetVerdictCount: formData.targetVerdictCount,
        creditsToUse: usingCommunityPath ? 0 : formData.creditsToUse,
        files: formData.mediaFiles,
        specificQuestions: formData.specificQuestions,
        demographicFilters: formData.demographicFilters,
      });

      if (result.success) {
        // Clear draft
        localStorage.removeItem('verdict_request_draft');
        
        // Trigger confetti
        setShowConfetti(true);
        
        // Check if we should show progressive profiling
        checkTrigger('first_submit');
        
        toast.success('Request created successfully! 🎉');
        
        // Small delay to show confetti before navigation
        setTimeout(() => {
          router.push(`/requests/${result.requestId}`);
        }, 1000);
      } else {
        // Handle specific error types
        if (result.error?.includes('authentication') || result.error?.includes('unauthorized')) {
          handleError('auth', 'Please log in to submit your request', formData);
        } else if (result.error?.includes('credits') || result.error?.includes('insufficient')) {
          handleError('quota', 'You don\'t have enough credits for this request', formData);
        } else if (result.error?.includes('network') || result.error?.includes('connection')) {
          handleError('network', 'Connection failed. Please check your internet and try again.', formData);
        } else {
          handleError('submission', result.error || 'Failed to create request', formData);
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      
      // Handle network errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        handleError('network', 'Connection problem. Please check your internet and try again.', formData);
      } else if (error.message?.includes('auth') || error.message?.includes('401')) {
        handleError('auth', 'Your session expired. Please log in again.', formData);
      } else {
        handleError('submission', 'Something went wrong. Please try again.', formData);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Request</h2>
          <p className="text-gray-600 mb-8">Please log in to create a new feedback request</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const insufficientCredits = (profile?.credits || 0) < formData.creditsToUse;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      <ConfettiBurst trigger={showConfetti} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* TODO: Add smart credit suggestions after launch */}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            Create New Request
          </h1>
          <p className="text-gray-600">
            Get expert feedback in minutes • {profile?.credits || 0} credits available
          </p>
          {draftSaved && (
            <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
              <Check className="h-4 w-4" />
              Draft saved automatically
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    index <= currentStep
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 w-20 mx-2 transition-all ${
                      index < currentStep
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-gray-900">{STEPS[currentStep].title}</h2>
            <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
          </div>
        </div>

        {/* Progressive Hints */}
        <ProgressiveHints 
          currentStep={currentStep}
          formData={formData}
          onHintAction={(action) => {
            // Handle hint actions
            if (action === 'show_examples') {
              // Examples are handled within the component
            }
          }}
        />

        {/* TODO: Add mobile optimizations after launch */}

        {/* Step Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8 mb-8">
          {/* Step 0: Combined Content Upload */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">What do you need feedback on?</h3>
                <p className="text-gray-600">Upload your content and tell us what you want to know</p>
              </div>

              {/* Simple Media Type Selection */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose content type:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MEDIA_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => updateFormData({ mediaType: type.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg hover:-translate-y-1 ${
                        formData.mediaType === type.id
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${type.gradient} flex items-center justify-center mb-2`}>
                        <type.icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-600">{type.subtitle}</p>
                      {type.badge && (
                        <span className="inline-block mt-2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                          {type.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              {formData.mediaType !== 'text' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload {formData.mediaType === 'photo' ? 'Images' : 'Audio Files'}
                    {(formData.requestType === 'comparison' || formData.requestType === 'split_test') && ' (2 files max)'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                    <input
                      type="file"
                      multiple={formData.requestType === 'verdict'}
                      accept={MEDIA_TYPES.find(t => t.id === formData.mediaType)?.accept}
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.mediaType === 'photo' ? 'JPG, PNG, GIF up to 10MB' : 'MP3, WAV up to 25MB'}
                      </p>
                    </label>
                  </div>

                  {/* File List */}
                  {formData.mediaFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              {formData.mediaType === 'text' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Text Content
                  </label>
                  <textarea
                    value={formData.textContent}
                    onChange={(e) => updateFormData({ textContent: e.target.value })}
                    placeholder="Paste or type your text here..."
                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.textContent.length}/5000 characters
                  </p>
                </div>
              )}

              {/* Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context & Questions
                </label>
                <textarea
                  value={formData.context}
                  onChange={(e) => updateFormData({ context: e.target.value })}
                  placeholder="Provide context and specific questions you'd like answered..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about what feedback you're looking for
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose your feedback level</h3>
                <p className="text-gray-600">Select the quality and quantity of feedback you need</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => updateFormData({ tier: tier.id })}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 ${
                      formData.tier === tier.id
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {tier.badge && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {tier.badge}
                      </div>
                    )}
                    {tier.popular && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Recommended
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tier.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <tier.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{tier.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{tier.subtitle}</p>
                    <p className="text-2xl font-bold text-indigo-600 mb-4">{tier.price}</p>
                    
                    <div className="space-y-2 mb-4">
                      {tier.features.map((feature) => (
                        <div key={feature} className="text-sm text-gray-700 flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Typical turnaround: {tier.turnaround}
                    </div>
                  </button>
                ))}
              </div>

              {insufficientCredits && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-orange-700 mb-3">
                    <Info className="h-5 w-5" />
                    <span className="font-medium">Need More Credits</span>
                  </div>
                  <p className="text-orange-600 text-sm mb-4">
                    You need {formData.creditsToUse} credits but only have {profile?.credits || 0}.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowCommunityPathExplainer(true)}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      Community Path (Free)
                    </button>
                    
                    <button 
                      onClick={() => setShowInsufficientCreditsModal(true)}
                      className="bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Buy Credits
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    💚 Community: Judge {formData.creditsToUse} others, get free feedback
                    <span className="mx-2">•</span>
                    ⚡ Instant: Pay and get results in 2 hours
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Feedback Preview */}
          {currentStep === 2 && (
            <FeedbackPreview
              formData={formData}
              onContinue={handleNext}
              onEdit={() => setCurrentStep(0)}
            />
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h3>
                <p className="text-gray-600">Double-check everything looks good</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{REQUEST_TYPES.find(t => t.id === formData.requestType)?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{CATEGORIES.find(c => c.id === formData.category)?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Media:</span>
                      <span className="font-medium">{MEDIA_TYPES.find(m => m.id === formData.mediaType)?.title}</span>
                    </div>
                    {formData.mediaFiles.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Files:</span>
                        <span className="font-medium">{formData.mediaFiles.length} uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Feedback Plan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <span className="font-medium">{TIERS.find(t => t.id === formData.tier)?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verdicts:</span>
                      <span className="font-medium">{formData.targetVerdictCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost:</span>
                      <span className="font-medium">{formData.creditsToUse} credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">{(profile?.credits || 0) - formData.creditsToUse} credits</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Preview */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Your Message to Judges</h4>
                <p className="text-gray-700 italic">"{formData.context || 'No additional context provided.'}"</p>
              </div>

              {/* Terms reminder */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Before you submit:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Your request will be reviewed by real people</li>
                      <li>• Feedback typically arrives within 2 hours</li>
                      <li>• Credits are charged when judges start reviewing</li>
                      <li>• You'll get email notifications for new verdicts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-white/80 border border-gray-300'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            {currentStep < STEPS.length - 1 && currentStep !== 2 ? (
              <button
                onClick={handleNext}
                disabled={!canContinue()}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  canContinue()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!canContinue() || (insufficientCredits && !usingCommunityPath) || submitting}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  canContinue() && (currentStep < 2 || !insufficientCredits || usingCommunityPath) && !submitting
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {usingCommunityPath ? 'Submit (Community Path)' : 'Submit Request'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Progressive Profile Modal */}
      {showProgressiveProfile && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProgressiveProfile
            user={user}
            trigger={triggerType}
            onComplete={dismissProgressiveProfile}
          />
        </div>
      )}

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        requiredCredits={formData.creditsToUse}
        currentCredits={profile?.credits || 0}
        onPurchaseSuccess={() => {
          setShowInsufficientCreditsModal(false);
          // Optionally refresh profile credits here
        }}
      />

      {/* Community Path Explainer */}
      <CommunityPathExplainer
        isOpen={showCommunityPathExplainer}
        onClose={() => setShowCommunityPathExplainer(false)}
        creditsNeeded={formData.creditsToUse}
        onChoosePath={(path) => {
          setShowCommunityPathExplainer(false);
          setUsingCommunityPath(true);
          
          if (path === 'judge_first') {
            // Redirect to feed to start judging
            router.push('/feed?from=create');
          } else {
            // Submit first, judge later - continue with current flow
            toast.success('Great! Submit your request and judge others when ready to see results.');
          }
        }}
      />

      {/* Smart Judge Recruitment */}
      <SmartJudgeRecruitment userId={user?.id} />

      {/* TODO: Add social proof after launch */}

      {/* Error Recovery Modal */}
      {error && (
        <ErrorRecovery
          error={error}
          onRetry={() => retry(handleSubmit)}
          onAlternative={() => {
            clearError();
            // Handle specific alternatives based on error type
            switch (error.type) {
              case 'quota':
                setShowInsufficientCreditsModal(true);
                break;
              case 'auth':
                router.push('/auth/login');
                break;
              default:
                // Generic alternative - go back to editing
                break;
            }
          }}
          onSupport={() => {
            clearError();
            // Implement support modal or redirect
            window.open('mailto:support@askverdict.com?subject=Upload Error&body=Error: ' + error.message);
          }}
          isRetrying={isRetrying}
        />
      )}
    </div>
  );
}