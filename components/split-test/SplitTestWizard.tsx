'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Upload,
  Users,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  Loader2,
  ImagePlus,
  Target,
  Sparkles,
} from 'lucide-react';
import { SegmentBuilder, Segment } from './SegmentBuilder';

interface SplitTestWizardProps {
  onClose?: () => void;
  initialCredits?: number;
}

type Step = 'upload' | 'context' | 'segments' | 'review';

export function SplitTestWizard({ onClose, initialCredits = 0 }: SplitTestWizardProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [photoA, setPhotoA] = useState<File | null>(null);
  const [photoB, setPhotoB] = useState<File | null>(null);
  const [photoAPreview, setPhotoAPreview] = useState<string | null>(null);
  const [photoBPreview, setPhotoBPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus trap and ESC key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape' && onClose && !isSubmitting) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when modal opens
    closeButtonRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, isSubmitting]);

  const totalCredits = segments.reduce((sum, s) => sum + s.targetCount, 0);
  const hasEnoughCredits = totalCredits <= initialCredits;

  const handleFileSelect = useCallback((file: File, photo: 'A' | 'B') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (photo === 'A') {
        setPhotoA(file);
        setPhotoAPreview(reader.result as string);
      } else {
        setPhotoB(file);
        setPhotoBPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, photo: 'A' | 'B') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file, photo);
    }
  }, [handleFileSelect]);

  const canProceed = () => {
    switch (step) {
      case 'upload':
        return photoA !== null && photoB !== null;
      case 'context':
        return question.trim().length >= 10;
      case 'segments':
        return segments.length > 0 && segments.every(s => s.targetCount > 0);
      case 'review':
        return hasEnoughCredits;
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (step) {
      case 'upload':
        setStep('context');
        break;
      case 'context':
        setStep('segments');
        break;
      case 'segments':
        setStep('review');
        break;
      case 'review':
        handleSubmit();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'context':
        setStep('upload');
        break;
      case 'segments':
        setStep('context');
        break;
      case 'review':
        setStep('segments');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!photoA || !photoB || !hasEnoughCredits) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photos
      const formData = new FormData();
      formData.append('photoA', photoA);
      formData.append('photoB', photoB);
      formData.append('question', question);
      formData.append('context', context);
      formData.append('segments', JSON.stringify(segments));
      formData.append('totalCredits', totalCredits.toString());

      const response = await fetch('/api/split-tests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create split test');
      }

      const { id } = await response.json();
      router.push(`/split-tests/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Photos', icon: <Upload className="h-4 w-4" /> },
    { key: 'context', label: 'Context', icon: <Target className="h-4 w-4" /> },
    { key: 'segments', label: 'Audiences', icon: <Users className="h-4 w-4" /> },
    { key: 'review', label: 'Launch', icon: <Zap className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget && onClose && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="wizard-title" className="text-lg font-semibold text-gray-900">
                Create Split Test
              </h2>
              <p className="text-sm text-gray-500">Get targeted feedback from specific audiences</p>
            </div>
          </div>
          {onClose && (
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
              aria-label="Close wizard"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                    index === currentStepIndex
                      ? 'bg-purple-100 text-purple-700'
                      : index < currentStepIndex
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    s.icon
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload Photos */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Upload your photos</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Add the two photos you want to compare
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Photo A */}
                <div
                  onDrop={(e) => handleDrop(e, 'A')}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative aspect-square rounded-xl border-2 border-dashed transition-colors ${
                    photoAPreview
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-purple-300 bg-gray-50'
                  }`}
                >
                  {photoAPreview ? (
                    <>
                      <Image
                        src={photoAPreview}
                        alt="Photo A"
                        fill
                        className="object-cover rounded-xl"
                      />
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-lg">
                        A
                      </div>
                      <button
                        onClick={() => {
                          setPhotoA(null);
                          setPhotoAPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-gray-600 hover:bg-white shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                      <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium">Photo A</span>
                      <span className="text-xs text-gray-400 mt-1">Drop or click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file, 'A');
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Photo B */}
                <div
                  onDrop={(e) => handleDrop(e, 'B')}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative aspect-square rounded-xl border-2 border-dashed transition-colors ${
                    photoBPreview
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-purple-300 bg-gray-50'
                  }`}
                >
                  {photoBPreview ? (
                    <>
                      <Image
                        src={photoBPreview}
                        alt="Photo B"
                        fill
                        className="object-cover rounded-xl"
                      />
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg">
                        B
                      </div>
                      <button
                        onClick={() => {
                          setPhotoB(null);
                          setPhotoBPreview(null);
                        }}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 text-gray-600 hover:bg-white shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                      <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium">Photo B</span>
                      <span className="text-xs text-gray-400 mt-1">Drop or click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file, 'B');
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Context */}
          {step === 'context' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">What do you want to know?</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Help judges understand what you&apos;re looking for
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which profile photo looks more professional?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {question.length}/100 characters (min 10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., This is for my LinkedIn profile. I work in tech sales..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Pro tip</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Be specific about your use case. &ldquo;Dating app profile&rdquo; will get different
                      feedback than &ldquo;LinkedIn headshot.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Segments */}
          {step === 'segments' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Choose your audience segments</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Get feedback from specific demographic groups
                </p>
              </div>

              <SegmentBuilder
                segments={segments}
                onSegmentsChange={setSegments}
                maxSegments={5}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Review & Launch</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Confirm your split test details
                </p>
              </div>

              {/* Photos Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  {photoAPreview && (
                    <Image src={photoAPreview} alt="A" fill className="object-cover" />
                  )}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    A
                  </div>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  {photoBPreview && (
                    <Image src={photoBPreview} alt="B" fill className="object-cover" />
                  )}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    B
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Question</div>
                <div className="font-medium text-gray-900">{question}</div>
              </div>

              {/* Segments Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-500 mb-2">Audience Segments</div>
                <div className="space-y-2">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{segment.name}</span>
                      <span className="text-gray-500">{segment.targetCount} verdicts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-700">Total Cost</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {totalCredits} credits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-700">Your Balance</div>
                    <div className={`text-lg font-semibold ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}>
                      {initialCredits} credits
                    </div>
                  </div>
                </div>
                {!hasEnoughCredits && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Insufficient credits. Please add more or reduce segments.</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          {step !== 'upload' ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              canProceed() && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : step === 'review' ? (
              <>
                <Zap className="h-4 w-4" />
                Launch Split Test
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
