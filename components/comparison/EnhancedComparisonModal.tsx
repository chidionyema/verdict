'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Zap, CheckCircle, ArrowRight, RotateCcw, 
  Brain, Scale, Target, Star, TrendingUp, MessageSquare,
  Shield, Clock, Users, Lightbulb, Award, Crown
} from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { PricingTiers, type RequestTier } from '@/components/pricing/PricingTiers';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';
import { toast } from '@/components/ui/toast';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface EnhancedComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

interface ComparisonOption {
  id: 'A' | 'B';
  title: string;
  description: string;
  image?: {
    file: File;
    preview: string;
  };
  pros?: string[];
  cons?: string[];
}

interface DecisionContext {
  timeframe: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  budget?: string;
  goals: string[];
}

const comparisonTemplates = {
  career: {
    title: 'Career Decision Comparison',
    description: 'Compare job offers, career paths, or professional opportunities',
    placeholder: 'Job Offer A vs Job Offer B',
    suggestions: [
      'Startup vs Corporate position',
      'Remote vs In-office role', 
      'Different companies/roles',
      'Career change vs staying'
    ],
    contextPrompts: {
      timeframe: 'When do you need to decide?',
      importance: 'How critical is this decision?',
      goals: 'What are your main career goals?'
    }
  },
  lifestyle: {
    title: 'Lifestyle Choice Comparison',
    description: 'Compare living situations, relationships, or life changes',
    placeholder: 'City A vs City B',
    suggestions: [
      'Different cities/neighborhoods',
      'Apartment/house options',
      'Relationship decisions',
      'Lifestyle changes'
    ],
    contextPrompts: {
      timeframe: 'Timeline for this decision?',
      importance: 'How much will this impact your life?',
      goals: 'What matters most to you?'
    }
  },
  business: {
    title: 'Business Decision Comparison',
    description: 'Compare business strategies, investments, or opportunities',
    placeholder: 'Strategy A vs Strategy B',
    suggestions: [
      'Investment opportunities',
      'Business models',
      'Partnership options',
      'Product directions'
    ],
    contextPrompts: {
      timeframe: 'Decision deadline?',
      importance: 'Financial impact level?',
      budget: 'Budget considerations?',
      goals: 'Business objectives?'
    }
  },
  appearance: {
    title: 'Style & Appearance Comparison',
    description: 'Compare photos, outfits, or style choices',
    placeholder: 'Photo A vs Photo B',
    suggestions: [
      'Dating profile photos',
      'Professional headshots',
      'Outfit choices',
      'Styling options'
    ],
    contextPrompts: {
      timeframe: 'When do you need this for?',
      importance: 'How important is this?',
      goals: 'What impression do you want to make?'
    }
  }
};

export function EnhancedComparisonModal({ 
  isOpen, 
  onClose, 
  category = 'career' 
}: EnhancedComparisonModalProps) {
  const [options, setOptions] = useState<{ A: ComparisonOption; B: ComparisonOption }>({
    A: { id: 'A', title: '', description: '' },
    B: { id: 'B', title: '', description: '' }
  });
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState<DecisionContext>({
    timeframe: '',
    importance: 'medium',
    goals: ['']
  });
  const [selectedTier, setSelectedTier] = useState<RequestTier>('standard');
  const [userCredits, setUserCredits] = useState(0);
  const [currentStep, setCurrentStep] = useState<'setup' | 'options' | 'context' | 'tier' | 'review'>('setup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(3);

  const fileInputRefs = {
    A: useRef<HTMLInputElement>(null),
    B: useRef<HTMLInputElement>(null)
  };

  const template = comparisonTemplates[category as keyof typeof comparisonTemplates] || comparisonTemplates.career;

  useEffect(() => {
    if (isOpen) {
      fetchUserCredits();
    }
  }, [isOpen]);

  const fetchUserCredits = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        setUserCredits((data as any)?.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  const handleImageUpload = (side: 'A' | 'B', file: File) => {
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setOptions(prev => ({
        ...prev,
        [side]: {
          ...prev[side],
          image: { file, preview }
        }
      }));
    }
  };

  const updateOption = (side: 'A' | 'B', field: keyof ComparisonOption, value: any) => {
    setOptions(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [field]: value
      }
    }));
  };

  const addGoal = () => {
    setContext(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const updateGoal = (index: number, value: string) => {
    setContext(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const removeGoal = (index: number) => {
    setContext(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const canProceedFromStep = (step: string): boolean => {
    switch (step) {
      case 'setup':
        return question.trim().length > 10;
      case 'options':
        return options.A.title.trim().length > 0 && options.B.title.trim().length > 0;
      case 'context':
        return context.timeframe.trim().length > 0 && context.goals.some(g => g.trim().length > 0);
      case 'tier':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedFromStep('review')) return;

    setIsSubmitting(true);
    
    try {
      const requestData = {
        question: question.trim(),
        category,
        optionA: {
          title: options.A.title,
          description: options.A.description,
          image: options.A.image ? {
            name: options.A.image.file.name,
            type: options.A.image.file.type,
            size: options.A.image.file.size,
            data: await convertFileToBase64(options.A.image.file),
          } : undefined
        },
        optionB: {
          title: options.B.title,
          description: options.B.description,
          image: options.B.image ? {
            name: options.B.image.file.name,
            type: options.B.image.file.type,
            size: options.B.image.file.size,
            data: await convertFileToBase64(options.B.image.file),
          } : undefined
        },
        context: {
          timeframe: context.timeframe,
          importance: context.importance,
          budget: context.budget,
          goals: context.goals.filter(g => g.trim())
        },
        requestTier: selectedTier,
        visibility: 'private'
      };

      const response = await fetch('/api/comparisons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient credits specifically
        if (response.status === 402) {
          const tierCredits: Record<string, number> = {
            'community': 1,
            'standard': 3,
            'pro': 5,
          };
          setRequiredCredits(errorData.required_credits || tierCredits[selectedTier] || 3);
          setShowCreditsModal(true);
          setIsSubmitting(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to create comparison');
      }

      const { comparisonId, estimatedCompletion } = await response.json();
      
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        // Redirect to the comparison results page
        window.location.href = `/comparisons/${comparisonId}`;
      }, 3000);
      
    } catch (error) {
      console.error('Comparison submission failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create comparison. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const resetModal = () => {
    setOptions({
      A: { id: 'A', title: '', description: '' },
      B: { id: 'B', title: '', description: '' }
    });
    setQuestion('');
    setContext({
      timeframe: '',
      importance: 'medium',
      goals: ['']
    });
    setSelectedTier('standard');
    setCurrentStep('setup');
    setShowSuccess(false);
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {['setup', 'options', 'context', 'tier', 'review'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
            currentStep === step 
              ? 'bg-purple-600 text-white' 
              : index < ['setup', 'options', 'context', 'tier', 'review'].indexOf(currentStep)
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-600'
          }`}>
            {index < ['setup', 'options', 'context', 'tier', 'review'].indexOf(currentStep) ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 4 && (
            <div className={`w-12 h-0.5 mx-2 transition-all ${
              index < ['setup', 'options', 'context', 'tier', 'review'].indexOf(currentStep)
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={requiredCredits}
        currentCredits={userCredits}
        onPurchaseSuccess={() => {
          fetchUserCredits();
          setShowCreditsModal(false);
        }}
      />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6" />
              {template.title}
            </h2>
            <button 
              onClick={resetModal} 
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close comparison modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-purple-100 mt-2">{template.description}</p>
        </div>

        <div className="p-6">
          {!showSuccess ? (
            <div className="space-y-6">
              {renderStepIndicator()}

              {/* Step 1: Setup */}
              {currentStep === 'setup' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-2">
                      What decision are you trying to make?
                    </label>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={template.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    />
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-medium text-purple-900 mb-2">💡 Perfect for comparing:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {template.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-purple-700">
                          <Target className="w-4 h-4" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>

                  <TouchButton
                    onClick={() => setCurrentStep('options')}
                    disabled={!canProceedFromStep('setup')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  >
                    Continue to Options <ArrowRight className="w-4 h-4 ml-2" />
                  </TouchButton>
                </div>
              )}

              {/* Step 2: Options */}
              {currentStep === 'options' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Define Your Options</h3>
                    <p className="text-gray-600">
                      {category === 'appearance'
                        ? 'Add photos and descriptions for each option'
                        : 'Paste your text content or describe each option'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(['A', 'B'] as const).map((side) => (
                      <div key={side} className={`space-y-4 border-2 rounded-xl p-6 ${
                        options[side].title ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                            {side}
                          </div>
                          <span className="font-semibold text-gray-900 text-lg">Option {side}</span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title / Label
                          </label>
                          <input
                            type="text"
                            value={options[side].title}
                            onChange={(e) => updateOption(side, 'title', e.target.value)}
                            placeholder={category === 'appearance' ? `Photo ${side} name` : `e.g., "Version ${side}" or "Option ${side}"`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {category === 'appearance'
                              ? 'Description / Context'
                              : 'Text Content (paste your text here)'
                            }
                          </label>
                          <textarea
                            value={options[side].description}
                            onChange={(e) => updateOption(side, 'description', e.target.value)}
                            placeholder={
                              category === 'appearance'
                                ? 'Where/when was this taken? Any context?'
                                : `Paste or type the full text for Option ${side} here...\n\nFor example: email copy, bio text, message draft, etc.`
                            }
                            rows={category === 'appearance' ? 3 : 6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base resize-y min-h-[100px]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {options[side].description.length} characters
                          </p>
                        </div>

                        {/* Image upload - available for ALL categories */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {category === 'appearance' ? 'Photo' : 'Image (Optional)'}
                            {category !== 'appearance' && (
                              <span className="text-gray-400 font-normal ml-1">- add visuals if relevant</span>
                            )}
                          </label>
                          {options[side].image ? (
                            <div className="relative border border-gray-300 rounded-lg overflow-hidden group">
                              <Image
                                src={options[side].image!.preview}
                                alt={`Option ${side}`}
                                width={200}
                                height={200}
                                className="w-full h-40 object-cover"
                              />
                              <button
                                onClick={() => updateOption(side, 'image', undefined)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRefs[side].current?.click()}
                              className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                            >
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 font-medium">
                                  {category === 'appearance' ? 'Upload photo' : 'Add image'}
                                </p>
                                <p className="text-xs text-gray-400">Click or drag</p>
                              </div>
                            </div>
                          )}
                          <input
                            ref={fileInputRefs[side]}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(side, file);
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <TouchButton
                      onClick={() => setCurrentStep('setup')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </TouchButton>
                    <TouchButton
                      onClick={() => setCurrentStep('context')}
                      disabled={!canProceedFromStep('options')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Continue to Context <ArrowRight className="w-4 h-4 ml-2" />
                    </TouchButton>
                  </div>
                </div>
              )}

              {/* Step 3: Context */}
              {currentStep === 'context' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Decision Context</h3>
                    <p className="text-gray-600">Help experts understand your situation better</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {template.contextPrompts.timeframe}
                      </label>
                      <input
                        type="text"
                        value={context.timeframe}
                        onChange={(e) => setContext(prev => ({ ...prev, timeframe: e.target.value }))}
                        placeholder="e.g., Next 2 weeks, By end of month"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {template.contextPrompts.importance}
                      </label>
                      <select
                        value={context.importance}
                        onChange={(e) => setContext(prev => ({ ...prev, importance: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Low impact</option>
                        <option value="medium">Medium impact</option>
                        <option value="high">High impact</option>
                        <option value="critical">Critical decision</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {template.contextPrompts.goals}
                    </label>
                    {context.goals.map((goal, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => updateGoal(index, e.target.value)}
                          placeholder="Enter a goal or priority..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        {context.goals.length > 1 && (
                          <TouchButton onClick={() => removeGoal(index)} variant="outline">
                            <X className="w-4 h-4" />
                          </TouchButton>
                        )}
                      </div>
                    ))}
                    <TouchButton onClick={addGoal} variant="outline" className="mt-2">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Add another goal
                    </TouchButton>
                  </div>

                  <div className="flex gap-4">
                    <TouchButton
                      onClick={() => setCurrentStep('options')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </TouchButton>
                    <TouchButton
                      onClick={() => setCurrentStep('tier')}
                      disabled={!canProceedFromStep('context')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Choose Quality Level <ArrowRight className="w-4 h-4 ml-2" />
                    </TouchButton>
                  </div>
                </div>
              )}

              {/* Step 4: Tier Selection */}
              {currentStep === 'tier' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Review Level</h3>
                    <p className="text-gray-600">Higher tiers get expert consensus analysis and faster results</p>
                  </div>

                  <PricingTiers
                    selectedTier={selectedTier}
                    onSelectTier={setSelectedTier}
                    userCredits={userCredits}
                    showRecommended={true}
                    compact={false}
                  />

                  {selectedTier === 'pro' && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Pro Tier Exclusive</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span>AI consensus analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span>Decision scoring matrix</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span>Expert-only reviewers</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <TouchButton
                      onClick={() => setCurrentStep('context')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </TouchButton>
                    <TouchButton
                      onClick={() => setCurrentStep('review')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Review & Submit <ArrowRight className="w-4 h-4 ml-2" />
                    </TouchButton>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Your Comparison</h3>
                    <p className="text-gray-600">Everything look correct?</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {(['A', 'B'] as const).map((side) => (
                        <div key={side} className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {side}
                            </div>
                            <span className="font-semibold">{options[side].title}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{options[side].description}</p>
                          {options[side].image && (
                            <Image
                              src={options[side].image!.preview}
                              alt={`Option ${side}`}
                              width={100}
                              height={100}
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Your Context:</h4>
                    <div className="text-sm text-purple-800 space-y-1">
                      <p><strong>Timeline:</strong> {context.timeframe}</p>
                      <p><strong>Importance:</strong> {context.importance} impact</p>
                      <p><strong>Goals:</strong> {context.goals.filter(g => g.trim()).join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <TouchButton
                      onClick={() => setCurrentStep('tier')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </TouchButton>
                    <TouchButton
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Creating Comparison...
                        </>
                      ) : (
                        <>
                          <Scale className="w-5 h-5 mr-2" />
                          Get Expert Comparison
                        </>
                      )}
                    </TouchButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Comparison Created!</h3>
              <p className="text-gray-600 mb-6">
                Your A/B comparison is being analyzed by {selectedTier === 'pro' ? 'verified experts' : 'experienced reviewers'}. 
                You'll receive detailed feedback on both options within {selectedTier === 'pro' ? '15 minutes' : '30 minutes'}.
              </p>
              {selectedTier === 'pro' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    🧠 <strong>Pro Analysis:</strong> You'll also receive an AI-powered decision matrix 
                    comparing the pros and cons of each option with confidence scores.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}