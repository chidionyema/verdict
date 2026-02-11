'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import { ModeIndicator } from '@/components/mode/ModeIndicator';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import type { User } from '@supabase/supabase-js';
import type { Mode } from '@/lib/mode-colors';
import type { RequestTier } from '@/components/pricing/PricingTiers';

import {
  SuccessScreen,
  StepProgressHeader,
  AttachedMediaPreview,
  MediaUploadStep,
  CategoryStep,
  ContextStep,
} from './start';

export function SimplifiedStart() {
  const router = useRouter();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [userTier, setUserTier] = useState<'community' | 'standard' | 'pro'>('community');

  // Form state
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'photo' | 'text'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textContentTouched, setTextContentTouched] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [context, setContext] = useState('');
  const [requestedTone, setRequestedTone] = useState<'encouraging' | 'honest' | 'brutally_honest'>('honest');
  const [selectedTier, setSelectedTier] = useState<RequestTier>('community');
  const [judgePreferences, setJudgePreferences] = useState<{ type: string; category: string } | null>(null);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<Mode | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(1);

  // Track unsaved changes
  const hasUnsavedData = Boolean(textContent.trim() || category || context.trim() || previewUrl);
  useUnsavedChanges(hasUnsavedData && !showSuccess, {
    message: 'You have unsaved content. Are you sure you want to leave?'
  });

  // Focus management
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepHeadingRef.current) {
        stepHeadingRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Initialize user and load draft
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        Promise.all([
          supabase.from('user_credits').select('balance').eq('user_id', user.id).single(),
          supabase.from('profiles').select('pricing_tier').eq('id', user.id).single()
        ]).then(([creditsRes, profileRes]) => {
          setUserCredits((creditsRes.data as any)?.balance || 0);
          setUserTier((profileRes.data as any)?.pricing_tier || 'community');
        });
      }
    });

    // Check URL params for visibility mode
    const params = new URLSearchParams(window.location.search);
    const visibility = params.get('visibility');
    if (visibility === 'public') setSubmissionMode('community');
    else if (visibility === 'private') setSubmissionMode('private');
  }, []);

  // Restore draft from signup/login flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('draftRequest');
      if (!raw) return;
      const draft = JSON.parse(raw);

      if (draft.mediaType && (draft.mediaType === 'photo' || draft.mediaType === 'text')) {
        setMediaType(draft.mediaType);
      }
      if (typeof draft.textContent === 'string') setTextContent(draft.textContent);
      if (typeof draft.category === 'string') setCategory(draft.category);
      if (typeof draft.subcategory === 'string') setSubcategory(draft.subcategory);
      if (typeof draft.context === 'string') setContext(draft.context);
      if (draft.requestedTone && ['encouraging', 'honest', 'brutally_honest'].includes(draft.requestedTone)) {
        setRequestedTone(draft.requestedTone);
      }

      if (draft.context && draft.context.length >= 20) setStep(3);
      else if (draft.category) setStep(2);
      else if (draft.mediaType && (draft.textContent || (window as any).pendingFile)) setStep(2);
    } catch {
      // Fail silently
    }
  }, []);

  // Handlers
  const handleFileUpload = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    (window as any).pendingFile = file;
    setTimeout(() => setStep(2), 500);
  };

  const handleTextSubmit = () => {
    if (textContent.length < 50) {
      setError('Please write at least 50 characters');
      return;
    }
    setError('');
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async () => {
    if (!context || context.length < 20) {
      setError('Please provide context (at least 20 characters)');
      return;
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('draftRequest', JSON.stringify({
          mediaType,
          textContent: mediaType === 'text' ? textContent : null,
          category,
          subcategory,
          context,
          requestedTone,
        }));
      }
      router.push('/auth/signup?redirect=/submit');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let mediaUrl = null;

      if (mediaType === 'photo') {
        const file = (window as any).pendingFile;
        if (!file) {
          setError('Please upload an image');
          setSubmitting(false);
          return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Upload failed');
        }

        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.url;
        setUploading(false);
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: subcategory || null,
          media_type: mediaType,
          media_url: mediaUrl,
          text_content: mediaType === 'text' ? textContent : null,
          context,
          judge_preferences: judgePreferences,
          requested_tone: requestedTone,
          request_tier: selectedTier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 402) {
          setRequiredCredits(data.required_credits || 1);
          setShowCreditsModal(true);
          setSubmitting(false);
          return;
        }
        throw new Error(data.details || data.error || 'Failed to create request');
      }

      setShowSuccess(true);
      setTimeout(() => router.push('/my-requests'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleTierUpgrade = async (tierId: 'standard' | 'pro') => {
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_id: tierId }),
      });

      const data = await res.json();
      if (data.demo) {
        setUserTier(data.tier);
        setError(`Upgraded to ${data.tier} tier (demo mode)`);
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch {
      setError('Failed to upgrade tier. Please try again.');
    }
  };

  const refreshCredits = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).single();
    setUserCredits((data as any)?.balance || 0);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Share what you'd like feedback on";
      case 2: return "Tell us what you need and who should review it";
      case 3: return "Add context for personalized insights";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Upload a photo or paste your text to get started";
      case 2: return "Choose the area you want help with and how we should match your judges";
      case 3: return "Help experts understand your specific situation";
      default: return "";
    }
  };

  const getStepProgressLabel = () => {
    const labels: Record<number, string> = {
      1: 'Step 1 of 3 - Upload',
      2: 'Step 2 of 3 - Topic & judges',
      3: 'Step 3 of 3 - Context',
    };
    return labels[step] ?? '';
  };

  // Render success screen
  if (showSuccess) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={requiredCredits}
        currentCredits={userCredits}
        onPurchaseSuccess={() => {
          refreshCredits();
          setShowCreditsModal(false);
        }}
      />

      <StepProgressHeader step={step} getStepProgressLabel={getStepProgressLabel} />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          {submissionMode && (
            <div className="mb-6 flex justify-center">
              <ModeIndicator mode={submissionMode} />
            </div>
          )}
          <h1
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-900 to-gray-600 bg-clip-text text-transparent mb-4 focus:outline-none"
          >
            {getStepTitle()}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {getStepSubtitle()}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 animate-in slide-in-from-top duration-300">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Attached media preview */}
        {step > 1 && (
          <AttachedMediaPreview
            mediaType={mediaType}
            previewUrl={previewUrl}
            textContent={textContent}
            onChangeUpload={() => setStep(1)}
          />
        )}

        {/* Step 1: Media Upload */}
        {step === 1 && (
          <MediaUploadStep
            mediaType={mediaType}
            setMediaType={setMediaType}
            previewUrl={previewUrl}
            textContent={textContent}
            setTextContent={setTextContent}
            textContentTouched={textContentTouched}
            setTextContentTouched={setTextContentTouched}
            dragActive={dragActive}
            setDragActive={setDragActive}
            error={error}
            setError={setError}
            onFileUpload={handleFileUpload}
            onTextSubmit={handleTextSubmit}
          />
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <CategoryStep
            category={category}
            setCategory={setCategory}
            setJudgePreferences={setJudgePreferences}
            onContinue={() => setTimeout(() => setStep(3), 400)}
          />
        )}

        {/* Step 3: Context */}
        {step === 3 && (
          <ContextStep
            category={category}
            subcategory={subcategory}
            setSubcategory={setSubcategory}
            context={context}
            setContext={setContext}
            requestedTone={requestedTone}
            setRequestedTone={setRequestedTone}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            userCredits={userCredits}
            userTier={userTier}
            onUpgrade={handleTierUpgrade}
            onSubmit={handleSubmit}
            submitting={submitting}
            uploading={uploading}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
