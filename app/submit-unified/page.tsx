'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePrivatePrice } from '@/hooks/use-pricing';
import { 
  ArrowRight, 
  Upload, 
  Type, 
  CreditCard, 
  Users, 
  Lock, 
  Eye,
  Zap,
  CheckCircle,
  Flame,
  TrendingUp
} from 'lucide-react';

interface SubmissionStep {
  step: 'details' | 'mode' | 'payment' | 'processing' | 'success';
}

interface SubmissionData {
  category: string;
  question: string;
  context: string;
  mediaType: 'photo' | 'text';
  mediaUrl?: string;
  visibility?: 'public' | 'private';
  mode?: 'community' | 'private';
}

export default function UnifiedSubmitPage() {
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

  // Check user credits and handle payment returns on load
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const sessionId = urlParams.get('session_id');
      
      // Handle successful payment return
      if (success === 'true' && sessionId) {
        setStep('processing');
        setSubmissionData({ ...submissionData, mode: 'private' });
        
        // Process the submission now that payment is complete
        try {
          const response = await fetch('/api/submit/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });
          
          if (response.ok) {
            setStep('success');
          } else {
            console.error('Failed to process submission after payment');
            setStep('success'); // Still show success since payment went through
          }
        } catch (error) {
          console.error('Error processing submission:', error);
          setStep('success'); // Still show success since payment went through
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
    if (!submissionData.category || !submissionData.question || !submissionData.context) {
      return; // Add proper validation
    }
    setStep('mode');
  };

  const handleModeSelect = (mode: 'community' | 'private') => {
    setSubmissionData({ ...submissionData, mode });
    
    if (mode === 'community') {
      if (userCredits > 0) {
        // User has credits, submit directly
        submitCommunityRequest();
      } else {
        // Redirect to earn credits
        router.push('/feed?earn=true&return=/submit-unified');
      }
    } else {
      // Private mode, go to payment
      setStep('payment');
    }
  };

  const submitCommunityRequest = async () => {
    setStep('processing');
    // Submit community request logic here
    setTimeout(() => setStep('success'), 2000); // Simulate processing
  };

  const handlePayment = async () => {
    setStep('processing');
    
    try {
      const response = await fetch('/api/submit/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }
      
      if (data.demo) {
        // Demo mode - proceed directly to success
        setTimeout(() => setStep('success'), 1000);
      } else if (data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Handle error - could show error state
      setStep('payment'); // Return to payment step
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
              onPay={handlePayment}
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
    { id: 'appearance', name: 'Appearance', icon: '👔' },
    { id: 'dating', name: 'Dating Profile', icon: '💕' },
    { id: 'career', name: 'Career', icon: '💼' },
    { id: 'writing', name: 'Writing', icon: '✍️' },
    { id: 'decision', name: 'Life Decision', icon: '🤔' }
  ];

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">What would you like feedback on?</h2>
      <p className="text-gray-600 mb-8">Tell us about your situation and we'll get you honest opinions from real people.</p>
      
      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSubmissionData({ ...submissionData, category: category.id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                submissionData.category === category.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-medium text-sm">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
        <input
          type="text"
          value={submissionData.question}
          onChange={(e) => setSubmissionData({ ...submissionData, question: e.target.value })}
          placeholder="What specific question do you want answered?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      {/* Context */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Context</label>
        <textarea
          value={submissionData.context}
          onChange={(e) => setSubmissionData({ ...submissionData, context: e.target.value })}
          placeholder="Provide any relevant background information..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      {/* Media Type */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Submission Type</label>
        <div className="flex gap-4">
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'text' })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'text'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Type className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">Text Only</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'photo' })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'photo'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">With Photo</div>
          </button>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!submissionData.category || !submissionData.question || !submissionData.context}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        Continue
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function ModeSelectionStep({ userCredits, privatePrice, onSelect }: any) {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">How would you like to get feedback?</h2>
      <p className="text-gray-600 mb-8">Both paths give you 3 comprehensive feedback reports. Choose based on your preference.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Community Mode */}
        <div className="border-2 border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold">Community Path</h3>
              <p className="text-green-600">Free with credits</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{userCredits > 0 ? 'Use 1 credit' : 'Earn credits by judging others'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Appears in public feed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Get 3 feedback reports</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('community')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            {userCredits > 0 ? 'Use Credit (Free)' : 'Earn Credits First'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Private Mode */}
        <div className="border-2 border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-bold">Private Path</h3>
              <p className="text-purple-600">Pay {privatePrice}</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Skip judging requirement</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Completely private</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Get 3 feedback reports</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('private')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Pay {privatePrice}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ privatePrice, submissionData, onPay }: any) {
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

      <button
        onClick={onPay}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <CreditCard className="h-5 w-5" />
        Pay {privatePrice} with Stripe
      </button>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Secure payment powered by Stripe. Your card information is never stored on our servers.
      </p>
    </div>
  );
}

function ProcessingStep({ mode }: any) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Zap className="h-8 w-8 text-white animate-pulse" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {mode === 'community' ? 'Submitting to Community...' : 'Processing Payment...'}
      </h2>
      <p className="text-gray-600">
        {mode === 'community' 
          ? 'Your submission is being added to the community feed for review.'
          : 'Your payment is being processed and reviewers are being notified.'
        }
      </p>
    </div>
  );
}

function SuccessStep({ mode, submissionData }: any) {
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
        {isRoastMode ? 'Get Ready to Be Roasted! 🔥' : 'Success!'}
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
          onClick={() => window.location.href = '/my-requests'}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          View My Requests
        </button>
        <button
          onClick={() => window.location.href = '/feed'}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Browse Community
        </button>
      </div>
    </div>
  );
}