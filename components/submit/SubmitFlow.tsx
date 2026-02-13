'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertCircle, CloudOff, Cloud } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';

import {
  SubmissionData,
  SubmissionStep,
  SubmitFlowProps,
  createEmptySubmissionData,
  getRequiredCredits,
  DRAFT_STORAGE_KEY,
} from './types';

import { ContentStep } from './steps/ContentStep';
import { DetailsStep } from './steps/DetailsStep';
import { SubmitStep } from './steps/SubmitStep';
import { SubmitSuccess } from './SubmitSuccess';
import { useSubmissionDraft } from './hooks/useSubmissionDraft';
import { useSubmitGuard, useSubmitKeyboardShortcuts } from './hooks/useSubmitGuard';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';

const STEPS: { id: SubmissionStep; label: string }[] = [
  { id: 'content', label: 'Content' },
  { id: 'details', label: 'Details' },
  { id: 'submit', label: 'Submit' },
];

export function SubmitFlow({ initialStep, returnFrom }: SubmitFlowProps) {
  const router = useRouter();

  // Core state
  const [step, setStep] = useState<SubmissionStep>(initialStep ?? 'content');
  const [data, setData] = useState<SubmissionData>(createEmptySubmissionData);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);

  // User state
  const [user, setUser] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Draft save indicator
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { draft, saveDraft, clearDraft, wasMigrated } = useSubmissionDraft();
  const { isSubmitting, isOnline, canSubmit, startSubmit, endSubmit, resetSubmit } = useSubmitGuard();

  // Track if we've restored from draft
  const hasRestoredDraft = useRef(false);

  // Initialize: Load user and restore draft
  useEffect(() => {
    const initialize = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUser(user);

          // Fetch profile via API (ensures profile exists with initial credits)
          const res = await fetch('/api/profile');
          if (res.ok) {
            const { profile } = await res.json();
            setUserCredits(profile?.credits ?? 0);
          } else {
            // Fallback: try direct query (shouldn't happen)
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', user.id)
              .single();
            setUserCredits((profile as any)?.credits ?? 0);
          }
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Restore draft
  useEffect(() => {
    if (hasRestoredDraft.current || isLoading) return;

    if (draft && !isSuccess) {
      hasRestoredDraft.current = true;
      setData(draft.data);

      // If returning from earn/payment, go to submit step
      if (returnFrom || draft.returnFrom) {
        setStep('submit');
        toast.success('Welcome back! Your draft has been restored.');
      } else if (draft.step) {
        setStep(draft.step);
        if (wasMigrated) {
          toast.success('Your previous draft has been restored.');
        }
      }
    }
  }, [draft, isLoading, isSuccess, returnFrom, wasMigrated]);

  // Auto-save draft with visual indicator
  useEffect(() => {
    if (isLoading || isSuccess) return;

    // Show "saving" indicator
    setDraftSaveStatus('saving');

    const timer = setTimeout(() => {
      saveDraft(step, data);
      setDraftSaveStatus('saved');

      // Clear saved status after 2 seconds
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
      draftSaveTimeoutRef.current = setTimeout(() => {
        setDraftSaveStatus('idle');
      }, 2000);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [step, data, isLoading, isSuccess, saveDraft]);

  // Update data
  const updateData = useCallback((updates: Partial<SubmissionData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Navigation
  const goToStep = useCallback((newStep: SubmissionStep) => {
    setStep(newStep);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === step);
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1].id);
    }
  }, [step, goToStep]);

  const goBack = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === step);
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1].id);
    }
  }, [step, goToStep]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  }, []);

  // Earn credits
  const handleEarnCredits = useCallback(() => {
    // Save draft with return context
    saveDraft(step, data, 'earn');
    // Navigate to judge page
    router.push('/judge?return=/submit');
  }, [step, data, saveDraft, router]);

  // Buy credits
  const handleBuyCredits = useCallback(() => {
    setShowCreditsModal(true);
  }, []);

  // On purchase success
  const handlePurchaseSuccess = useCallback(async () => {
    setShowCreditsModal(false);

    // Refresh credits from profiles table
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user?.id)
        .single();

      setUserCredits((profile as any)?.credits ?? 0);
      toast.success('Credits added! Ready to submit.');
    } catch {
      // Reload page as fallback
      window.location.reload();
    }
  }, [user?.id]);

  // Submit request
  const handleSubmit = useCallback(async () => {
    if (!startSubmit()) return;

    try {
      const requiredCredits = getRequiredCredits(data.tier);

      // Build request body
      const body = {
        category: data.category,
        media_type: data.mediaType,
        media_url: data.mediaUrls[0] || null,
        text_content: data.mediaType === 'text' ? data.textContent : null,
        context: data.context,
        request_tier: data.tier,
        visibility: 'public',
        // For comparison/split test
        ...(data.requestType !== 'standard' && {
          comparison_urls: data.mediaUrls,
          demographic_filters: data.demographicFilters,
        }),
      };

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle insufficient credits
        if (response.status === 402) {
          toast.error('Not enough credits. Please earn or purchase more.');
          setShowCreditsModal(true);
          endSubmit();
          return;
        }

        throw new Error(result.error || 'Failed to submit request');
      }

      // Success!
      clearDraft();
      setRequestId(result.request?.id || result.requestId);
      setCreditsUsed(requiredCredits);
      setIsSuccess(true);

    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      // Provide user-friendly error based on what went wrong
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        toast.error('Unable to submit. Please check your internet connection and try again. Your draft has been saved.');
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('session')) {
        toast.error('Your session has expired. Please sign in again to submit your request.');
      } else if (errorMessage.includes('upload') || errorMessage.includes('file')) {
        toast.error('Failed to upload your content. Please try again or use a different file.');
      } else {
        toast.error('We couldn\'t submit your request. Please try again. Your draft has been saved.');
      }
      endSubmit();
    }
  }, [data, startSubmit, endSubmit, clearDraft]);

  // Keyboard shortcuts
  useSubmitKeyboardShortcuts({
    onSubmit: handleSubmit,
    onBack: step !== 'content' ? goBack : undefined,
    canSubmit: canSubmit && step === 'submit' && userCredits >= getRequiredCredits(data.tier),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to continue</h2>
          <p className="text-gray-600 mb-6">Create an account or sign in to submit your request.</p>
          <button
            onClick={() => router.push('/auth/login?redirect=/submit')}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess && requestId) {
    return (
      <SubmitSuccess
        requestId={requestId}
        data={data}
        creditsUsed={creditsUsed}
      />
    );
  }

  // Current step index
  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft save status indicator */}
      <div className="flex justify-end mb-2">
        <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${
          draftSaveStatus === 'idle' ? 'opacity-0' : 'opacity-100'
        }`}>
          {draftSaveStatus === 'saving' && (
            <>
              <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="text-gray-500">Saving draft...</span>
            </>
          )}
          {draftSaveStatus === 'saved' && (
            <>
              <Cloud className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Draft saved</span>
            </>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <nav aria-label="Submission progress" className="mb-8">
        <ol className="flex items-center justify-center">
          {STEPS.map((stepItem, index) => {
            const isCurrent = index === currentStepIndex;
            const isComplete = index < currentStepIndex;

            return (
              <li key={stepItem.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  isCurrent ? 'bg-indigo-100 text-indigo-700' : ''
                } ${isComplete ? 'text-green-600' : ''}`}>
                  {isComplete ? (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-sm font-medium hidden sm:block ${
                    !isCurrent && !isComplete ? 'text-gray-400' : ''
                  }`}>
                    {stepItem.label}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 ${
                    isComplete ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {step === 'content' && (
          <ContentStep
            data={data}
            onUpdate={updateData}
            onNext={goNext}
            userCredits={userCredits}
            isOnline={isOnline}
            onFileUpload={handleFileUpload}
          />
        )}

        {step === 'details' && (
          <DetailsStep
            data={data}
            onUpdate={updateData}
            onNext={goNext}
            onBack={goBack}
            userCredits={userCredits}
            isOnline={isOnline}
          />
        )}

        {step === 'submit' && (
          <SubmitStep
            data={data}
            onUpdate={updateData}
            onNext={goNext}
            onBack={goBack}
            userCredits={userCredits}
            isOnline={isOnline}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onEarnCredits={handleEarnCredits}
            onBuyCredits={handleBuyCredits}
          />
        )}
      </div>

      {/* Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={getRequiredCredits(data.tier)}
        currentCredits={userCredits}
        returnUrl="/submit"
        onPurchaseSuccess={handlePurchaseSuccess}
        onEarnCreditsClick={() => {
          setShowCreditsModal(false);
          handleEarnCredits();
        }}
      />
    </div>
  );
}
