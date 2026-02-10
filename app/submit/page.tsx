'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePrivatePrice } from '@/hooks/use-pricing';
import { toast } from '@/components/ui/toast';
import { EmbeddedStripePayment } from '@/components/payment/EmbeddedStripePayment';
import {
  ArrowRight,
  Upload,
  Type,
  Lock,
  Eye,
  Zap,
  CheckCircle,
  Flame,
  TrendingUp,
  Scale
} from 'lucide-react';
import { ComparisonButton } from '@/components/comparison/ComparisonButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { X, Clock, Coins } from 'lucide-react';

interface SubmissionStep {
  step: 'details' | 'mode' | 'payment' | 'processing' | 'success';
}

interface SubmissionData {
  category: string;
  question: string;
  context: string;
  mediaType: 'photo' | 'text' | 'split_test' | 'comparison';
  mediaUrl?: string;
  visibility?: 'public' | 'private';
  mode?: 'community' | 'private';
}

export default function SubmitPage() {
  const router = useRouter();
  const privatePrice = usePrivatePrice();
  const [step, setStep] = useState<SubmissionStep['step']>('details');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    category: '',
    question: '',
    context: '',
    mediaType: 'text'
  });
  const [isProcessingPaymentReturn, setIsProcessingPaymentReturn] = useState(false);
  const [showZeroCreditsModal, setShowZeroCreditsModal] = useState(false);
  const [showCreditDeduction, setShowCreditDeduction] = useState(false);

  // Check user credits and handle payment returns on load
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const sessionId = urlParams.get('session_id');

      // Handle successful payment return
      if (success === 'true' && sessionId) {
        setIsProcessingPaymentReturn(true);
        setStep('processing');
        setSubmissionData({ ...submissionData, mode: 'private' });

        // Process the submission now that payment is complete
        try {
          const response = await fetch('/api/submit/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });

          const data = await response.json().catch(() => ({ error: 'Unknown error' }));

          if (response.ok && data.success) {
            setIsProcessingPaymentReturn(false);
            if (data.idempotent) {
              toast.success('Your submission was already created!');
            }
            setStep('success');
          } else if (data.refunded) {
            setIsProcessingPaymentReturn(false);
            toast.error('Submission failed. Your payment has been refunded automatically.');
            setStep('mode');
          } else {
            setIsProcessingPaymentReturn(false);
            console.error('Failed to process submission after payment:', data);
            const supportId = data.support_id ? ` (Support ID: ${data.support_id})` : '';
            toast.error(`Submission failed. Please contact support.${supportId}`);
            setStep('details');
          }
        } catch (error) {
          console.error('Error processing submission:', error);
          toast.error('Connection issue. Retrying...');

          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            const retryResponse = await fetch('/api/submit/process-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId })
            });
            const retryData = await retryResponse.json().catch(() => ({ error: 'Unknown error' }));

            if (retryResponse.ok && retryData.success) {
              setIsProcessingPaymentReturn(false);
              setStep('success');
            } else {
              setIsProcessingPaymentReturn(false);
              toast.error('Please contact support with session ID: ' + sessionId);
              setStep('details');
            }
          } catch (retryError) {
            setIsProcessingPaymentReturn(false);
            toast.error('Please contact support with session ID: ' + sessionId);
            setStep('details');
          }
        }
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (profile && 'credits' in profile) {
          setUserCredits((profile as any).credits || 0);
        }
      }
      setLoading(false);
    }

    initialize();
  }, []);

  const handleDetailsSubmit = () => {
    if (!submissionData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!submissionData.question || submissionData.question.trim().length < 10) {
      toast.error('Please enter a question (at least 10 characters)');
      return;
    }

    if (!submissionData.context || submissionData.context.trim().length < 20) {
      toast.error('Please provide more context (at least 20 characters)');
      return;
    }

    if (submissionData.mediaType === 'comparison') {
      return;
    }

    setStep('mode');
  };

  const handleModeSelect = (mode: 'community' | 'private') => {
    setSubmissionData({ ...submissionData, mode });

    if (mode === 'community') {
      if (userCredits > 0) {
        submitCommunityRequest();
      } else {
        setShowZeroCreditsModal(true);
      }
    } else {
      setStep('payment');
    }
  };

  const handleEarnCredits = () => {
    setShowZeroCreditsModal(false);
    router.push('/feed?earn=true&return=/submit');
  };

  const handlePayInstead = () => {
    setShowZeroCreditsModal(false);
    setSubmissionData({ ...submissionData, mode: 'private' });
    setStep('payment');
  };

  const submitCommunityRequest = async () => {
    setStep('processing');

    try {
      const validationErrors: string[] = [];
      if (!submissionData.category) validationErrors.push('category');
      if (!submissionData.mediaType) validationErrors.push('content type');
      if (!submissionData.context || submissionData.context.trim().length < 20) {
        validationErrors.push('context (20+ characters required)');
      }
      if (submissionData.mediaType === 'photo' && !submissionData.mediaUrl) {
        validationErrors.push('photo upload');
      }

      if (validationErrors.length > 0) {
        toast.error(`Please complete: ${validationErrors.join(', ')}`);
        setStep('details');
        return;
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: submissionData.category,
          media_type: submissionData.mediaType === 'split_test' || submissionData.mediaType === 'comparison'
            ? 'photo'
            : submissionData.mediaType,
          media_url: submissionData.mediaUrl || null,
          text_content: submissionData.mediaType === 'text' ? submissionData.question : null,
          context: submissionData.context,
          visibility: 'public',
          request_tier: 'community',
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error('Not enough credits. Earn credits by judging others!');
          router.push('/feed?earn=true&return=/submit');
          return;
        }
        throw new Error(data.error || 'Failed to create request');
      }

      setShowCreditDeduction(true);
      setUserCredits(prev => Math.max(0, prev - 1));

      setTimeout(() => {
        setShowCreditDeduction(false);
        toast.success('Your request has been submitted to the community!');
        setStep('success');
      }, 1500);

    } catch (error) {
      console.error('Community submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
      setStep('mode');
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setStep('processing');

    try {
      const response = await fetch('/api/submit/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentData.id,
          submissionData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process submission');
      }

      setTimeout(() => setStep('success'), 1000);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment successful but submission failed. Please contact support.');
      setStep('payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <LoadingOverlay
        isVisible={isProcessingPaymentReturn}
        title="Completing Your Payment..."
        description="Your payment was successful! We're creating your request now."
      />

      {/* Zero Credits Modal */}
      {showZeroCreditsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">You Need 1 Credit</h3>
                <button
                  onClick={() => setShowZeroCreditsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Community submissions require 1 credit. Choose how you'd like to proceed:
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleEarnCredits}
                  className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Earn 1 Credit Free</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Review 3 submissions from others (~15 minutes). Help the community and get your credit!
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handlePayInstead}
                  className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <Coins className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Pay {privatePrice} Instead</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Skip earning credits. Your submission stays private and gets priority feedback.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                You can always earn more credits later by helping others with their decisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Deduction Animation */}
      {showCreditDeduction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-in zoom-in duration-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Coins className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg animate-ping">
                -1
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Credit Used!</h3>
            <p className="text-gray-600 mb-4">
              1 credit has been deducted from your balance.
            </p>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
              <p className="text-amber-800 font-medium">
                Remaining: {userCredits} credit{userCredits !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              <span>Submitting to community...</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['details', 'mode', 'payment', 'success'].map((stepName, index) => {
              const stepIndex = ['details', 'mode', 'payment', 'processing', 'success'].indexOf(step);
              const isActive = index <= stepIndex;
              const isCurrent = index === stepIndex;

              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-indigo-200' : ''}`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 ${
                      isActive ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">

          {step === 'details' && (
            <DetailsStep
              submissionData={submissionData}
              setSubmissionData={setSubmissionData}
              onNext={handleDetailsSubmit}
            />
          )}

          {step === 'mode' && (
            <ModeSelectionStep
              userCredits={userCredits}
              privatePrice={privatePrice}
              onSelect={handleModeSelect}
            />
          )}

          {step === 'payment' && (
            <PaymentStep
              privatePrice={privatePrice}
              submissionData={submissionData}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

          {step === 'processing' && (
            <ProcessingStep mode={submissionData.mode} />
          )}

          {step === 'success' && (
            <SuccessStep mode={submissionData.mode} submissionData={submissionData} />
          )}

        </div>
      </div>
    </div>
  );
}

// Step Components
function DetailsStep({ submissionData, setSubmissionData, onNext }: any) {
  const categories = [
    {
      id: 'appearance',
      name: 'Style & Appearance',
      icon: '👔',
      description: 'Outfits, hair, photos, looks',
      gradient: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    {
      id: 'dating',
      name: 'Dating & Relationships',
      icon: '💕',
      description: 'Dating profiles, texts, advice',
      gradient: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      id: 'career',
      name: 'Career & Professional',
      icon: '💼',
      description: 'Resume, LinkedIn, workplace',
      gradient: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'writing',
      name: 'Creative & Writing',
      icon: '✍️',
      description: 'Content, copy, creative work',
      gradient: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      id: 'decision',
      name: 'Life Decisions',
      icon: '🤔',
      description: 'Important choices, dilemmas',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">What would you like feedback on?</h2>
      <p className="text-gray-600 mb-8">Tell us about your situation and we'll get you honest opinions from real people.</p>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSubmissionData({ ...submissionData, category: category.id })}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                submissionData.category === category.id
                  ? `border-transparent shadow-xl scale-105 ${category.bgColor}`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white'
              }`}
            >
              {submissionData.category === category.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-5`} />
              )}

              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${
                submissionData.category === category.id
                  ? `bg-gradient-to-br ${category.gradient} shadow-lg`
                  : 'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                <span className={`text-xl ${
                  submissionData.category === category.id ? 'text-white' : 'text-gray-600'
                }`}>
                  {category.icon}
                </span>
              </div>

              <div className="relative">
                <h3 className={`font-bold text-lg mb-2 transition-colors ${
                  submissionData.category === category.id
                    ? category.iconColor
                    : 'text-gray-900 group-hover:text-gray-700'
                }`}>
                  {category.name}
                </h3>
                <p className={`text-sm transition-colors ${
                  submissionData.category === category.id
                    ? 'text-gray-700'
                    : 'text-gray-500 group-hover:text-gray-600'
                }`}>
                  {category.description}
                </p>
              </div>

              {submissionData.category === category.id && (
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Question *</label>
        <input
          type="text"
          value={submissionData.question}
          onChange={(e) => setSubmissionData({ ...submissionData, question: e.target.value })}
          placeholder="What specific question do you want answered?"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
            submissionData.question && submissionData.question.trim().length < 10
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${
            submissionData.question && submissionData.question.trim().length < 10
              ? 'text-amber-600'
              : 'text-gray-500'
          }`}>
            {submissionData.question.trim().length < 10
              ? `${10 - submissionData.question.trim().length} more characters needed`
              : '✓ Good length'}
          </span>
          <span className="text-xs text-gray-400">
            {submissionData.question.length}/200
          </span>
        </div>
      </div>

      {/* Context */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Context *</label>
        <textarea
          value={submissionData.context}
          onChange={(e) => setSubmissionData({ ...submissionData, context: e.target.value })}
          placeholder="Provide any relevant background information..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
            submissionData.context && submissionData.context.trim().length < 20
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${
            submissionData.context && submissionData.context.trim().length < 20
              ? 'text-amber-600'
              : 'text-gray-500'
          }`}>
            {submissionData.context.trim().length < 20
              ? `${20 - submissionData.context.trim().length} more characters needed`
              : '✓ Good length'}
          </span>
          <span className="text-xs text-gray-400">
            {submissionData.context.length}/1000
          </span>
        </div>
      </div>

      {/* Media Type */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Submission Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'text' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'text'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Type className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">Text Only</div>
            <div className="text-xs text-gray-500 mt-1">Written content</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'photo' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'photo'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">Single Photo</div>
            <div className="text-xs text-gray-500 mt-1">One image to review</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'split_test' })}
            className={`p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
              submissionData.mediaType === 'split_test'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {submissionData.mediaType !== 'split_test' && (
              <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                NEW
              </div>
            )}
            <Zap className={`h-6 w-6 mx-auto mb-2 ${
              submissionData.mediaType === 'split_test' ? 'text-purple-600' : 'text-indigo-600'
            }`} />
            <div className="font-medium">Split Test</div>
            <div className="text-xs text-gray-500 mt-1">Compare 2 photos</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'comparison' })}
            className={`p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
              submissionData.mediaType === 'comparison'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {submissionData.mediaType !== 'comparison' && (
              <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                PRO
              </div>
            )}
            <Scale className={`h-6 w-6 mx-auto mb-2 ${
              submissionData.mediaType === 'comparison' ? 'text-indigo-600' : 'text-gray-600'
            }`} />
            <div className="font-medium">Decision Comparison</div>
            <div className="text-xs text-gray-500 mt-1">A/B decision analysis</div>
          </button>
        </div>
      </div>

      {submissionData.mediaType === 'comparison' ? (
        <ComparisonButton
          category={submissionData.category}
          variant="default"
          className="w-full py-4 text-lg"
        />
      ) : (
        <div className="space-y-2">
          <button
            onClick={onNext}
            disabled={!submissionData.category || !submissionData.question.trim() || submissionData.question.trim().length < 10 || !submissionData.context.trim() || submissionData.context.trim().length < 20}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </button>
          {(!submissionData.category || !submissionData.question.trim() || submissionData.question.trim().length < 10 || !submissionData.context.trim() || submissionData.context.trim().length < 20) && (
            <p className="text-xs text-amber-600 text-center">
              {!submissionData.category
                ? 'Select a category above to continue'
                : submissionData.question.trim().length < 10
                ? 'Your question needs at least 10 characters'
                : submissionData.context.trim().length < 20
                ? 'Please add more context (at least 20 characters)'
                : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ModeSelectionStep({ userCredits, privatePrice, onSelect }: any) {
  const hasCredits = userCredits > 0;

  return (
    <div className="p-8">
      {/* Credits Banner - Prominent for users with credits */}
      {hasCredits && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">You have {userCredits} free submission{userCredits !== 1 ? 's' : ''}!</h3>
                <p className="text-amber-700">Each credit = 1 submission with 3 feedback reports</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-600">{userCredits}</div>
              <div className="text-xs text-amber-600 font-medium">CREDITS</div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {hasCredits ? 'Use your credit or pay instead?' : 'How would you like to get feedback?'}
      </h2>
      <p className="text-gray-600 mb-8">Both options get you 3 detailed feedback reports from real people.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Use Credit Option */}
        <div className={`border-2 rounded-2xl p-6 hover:shadow-lg transition-all relative ${
          hasCredits
            ? 'border-green-400 bg-green-50/50 ring-2 ring-green-200'
            : 'border-gray-200'
        }`}>
          {hasCredits && (
            <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              hasCredits ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Coins className={`h-6 w-6 ${hasCredits ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {hasCredits ? 'Use 1 Credit' : 'Use Credits'}
              </h3>
              <p className={hasCredits ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {hasCredits ? 'Free - no payment needed' : 'Earn credits first'}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{hasCredits ? `Uses 1 of your ${userCredits} credits` : 'Judge 3 submissions to earn 1 credit'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Get 3 honest feedback reports</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>Visible in community feed</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('community')}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              hasCredits
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {hasCredits ? (
              <>
                Use My Credit
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Earn Credits First
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {hasCredits && (
            <p className="text-center text-xs text-green-600 mt-3 font-medium">
              You'll have {userCredits - 1} credit{userCredits - 1 !== 1 ? 's' : ''} left after this
            </p>
          )}
        </div>

        {/* Pay Option */}
        <div className="border-2 border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pay {privatePrice}</h3>
              <p className="text-purple-600">Private & priority</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Completely private submission</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Get 3 honest feedback reports</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Priority queue - faster results</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('private')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Pay {privatePrice}
            <ArrowRight className="h-4 w-4" />
          </button>

          {hasCredits && (
            <p className="text-center text-xs text-gray-500 mt-3">
              Save your credits for later
            </p>
          )}
        </div>
      </div>

      {/* Explainer for new users */}
      {hasCredits && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-medium">How credits work:</span> You got {userCredits} credits when you signed up.
            Each credit = 1 free submission. Earn more by helping others with their decisions.
          </p>
        </div>
      )}
    </div>
  );
}

function PaymentStep({ privatePrice, submissionData, onPaymentSuccess }: any) {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
      <p className="text-gray-600 mb-8">Pay {privatePrice} for private, instant feedback on your submission.</p>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-2">Your Submission</h3>
        <p className="text-gray-700 mb-2">{submissionData.question}</p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Category:</span> {submissionData.category || 'General'}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Private feedback (3 reports)</span>
            <span className="font-bold">{privatePrice}</span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Completely confidential</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Results in under 1 hour</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No reviewing required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">100% Satisfaction Guarantee</h4>
            <p className="text-sm text-green-700 mt-1">
              Get 3 quality feedback reports within 24 hours or receive a <strong>full refund</strong>.
              Most requests complete in under 2 hours.
            </p>
          </div>
        </div>
      </div>

      <EmbeddedStripePayment
        amount={Math.round(parseFloat(privatePrice.replace(/[£$]/g, '')) * 100)}
        currency="gbp"
        description={`Private feedback: ${submissionData.question?.substring(0, 50)}...`}
        onSuccess={onPaymentSuccess}
        onError={(error: string) => toast.error(`Payment failed: ${error}`)}
        className="mt-6"
      />
    </div>
  );
}

function ProcessingStep({ mode }: any) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <Zap className="h-8 w-8 text-white animate-pulse" />
        <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {mode === 'community' ? 'Submitting to Community...' : 'Processing Payment...'}
      </h2>
      <p className="text-gray-600 mb-4">
        {mode === 'community'
          ? 'Your submission is being added to the community feed for review.'
          : 'Your payment is being securely processed. This takes 5-10 seconds.'
        }
      </p>

      <div className="max-w-xs mx-auto space-y-3 text-left">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
          <span className="text-gray-700">
            {mode === 'community' ? 'Credit verified' : 'Payment authorized'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="text-gray-700">Creating your request...</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <span>Notifying reviewers</span>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800 font-medium">
          Please do not close this window
        </p>
      </div>
    </div>
  );
}

function SuccessStep({ mode, submissionData }: any) {
  const router = useRouter();
  const isRoastMode = submissionData?.roastMode || submissionData?.category === 'roast';

  return (
    <div className="p-8 text-center">
      <div className={`w-16 h-16 ${isRoastMode ? 'bg-red-600' : 'bg-green-600'} rounded-full flex items-center justify-center mx-auto mb-6`}>
        {isRoastMode ? (
          <Flame className="h-8 w-8 text-white" />
        ) : (
          <CheckCircle className="h-8 w-8 text-white" />
        )}
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {isRoastMode ? 'Get Ready to Be Roasted!' : 'Success!'}
      </h2>

      <p className="text-gray-600 mb-6">
        {isRoastMode ? (
          <>
            Your roast request is live! Prepare for some brutal honesty from strangers.
            You'll get 3 savage feedback reports within{' '}
            <strong>{mode === 'community' ? '2-4 hours' : '30 minutes'}</strong>.
          </>
        ) : (
          <>
            Your submission has been received. You'll get 3 feedback reports within{' '}
            {mode === 'community' ? '2-4 hours' : '30 minutes'}.
          </>
        )}
      </p>

      {isRoastMode && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-red-700 font-semibold mb-2">
            <TrendingUp className="h-5 w-5" />
            Viral Potential: HIGH
          </div>
          <p className="text-red-600 text-sm">
            Roast content gets 3x more engagement! When your results come in,
            you'll get a viral-ready share template to post on social media.
          </p>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push('/my-requests')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          View My Requests
        </button>
        <button
          onClick={() => router.push('/feed')}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Browse Community
        </button>
      </div>
    </div>
  );
}
