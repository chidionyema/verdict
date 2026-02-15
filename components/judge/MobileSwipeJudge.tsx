'use client';

import { useState, useRef, TouchEvent, useCallback, useEffect, KeyboardEvent } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Equal, Star, Send, X, AlertCircle, Loader2 } from 'lucide-react';

interface MobileSwipeJudgeProps {
  photoAUrl: string;
  photoBUrl: string;
  question: string;
  onSubmit: (data: {
    chosenPhoto: 'A' | 'B';
    confidence: number;
    reasoning: string;
    photoARating: number;
    photoBRating: number;
    isTie?: boolean;
  }) => void;
  onSkip?: () => void;
  earnings: string;
}

const MIN_REASONING_LENGTH = 15;

export function MobileSwipeJudge({
  photoAUrl,
  photoBUrl,
  question,
  onSubmit,
  onSkip,
  earnings,
}: MobileSwipeJudgeProps) {
  const [step, setStep] = useState<'compare' | 'rate' | 'reason'>('compare');
  const [chosenPhoto, setChosenPhoto] = useState<'A' | 'B' | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [photoARating, setPhotoARating] = useState(5);
  const [photoBRating, setPhotoBRating] = useState(5);
  const [reasoning, setReasoning] = useState('');
  const [confidence, setConfidence] = useState(7);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const photoAButtonRef = useRef<HTMLButtonElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);

    if (delta > 50) {
      setSwipeDirection('right');
    } else if (delta < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 100) {
      if (touchDelta > 0) {
        // Swipe right = Photo B
        handleChoice('B');
      } else {
        // Swipe left = Photo A
        handleChoice('A');
      }
    }
    setTouchStart(null);
    setTouchDelta(0);
    setSwipeDirection(null);
  };

  const handleChoice = useCallback((photo: 'A' | 'B', tie = false) => {
    setChosenPhoto(photo);
    setIsTie(tie);
    setSubmitError(null);

    if (tie) {
      // For ties, set equal ratings
      setPhotoARating(5);
      setPhotoBRating(5);
    } else if (photo === 'A') {
      setPhotoARating(Math.max(photoARating, photoBRating + 1));
    } else {
      setPhotoBRating(Math.max(photoBRating, photoARating + 1));
    }
    setStep('rate');
  }, [photoARating, photoBRating]);

  // Keyboard navigation for compare step
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (step !== 'compare') return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      handleChoice('A');
    } else if (e.key === 'ArrowRight' || e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      handleChoice('B');
    } else if (e.key === 't' || e.key === 'T' || e.key === '=') {
      e.preventDefault();
      // For tie, randomly select but mark as tie
      handleChoice(Math.random() > 0.5 ? 'A' : 'B', true);
    } else if (e.key === 'Escape' && onSkip) {
      e.preventDefault();
      onSkip();
    }
  }, [step, handleChoice, onSkip]);

  // Focus management
  useEffect(() => {
    if (step === 'compare' && photoAButtonRef.current) {
      photoAButtonRef.current.focus();
    }
  }, [step]);

  const handleSubmitVerdict = async () => {
    if (!chosenPhoto) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        chosenPhoto,
        confidence,
        reasoning: reasoning.trim(),
        photoARating,
        photoBRating,
        isTie,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit verdict. Please try again.');
      setIsSubmitting(false);
    }
  };

  const canSubmit = reasoning.trim().length >= MIN_REASONING_LENGTH && chosenPhoto && !isSubmitting;

  return (
    <div
      className="fixed inset-0 bg-gray-900 flex flex-col"
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Photo comparison judge"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-gray-400 cursor-pointer hover:text-white transition-colors p-1 rounded"
            aria-label="Skip this comparison"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <div className="text-center flex-1">
          <div className="text-white font-medium truncate px-4">{question}</div>
        </div>
        <div className="text-green-400 font-semibold" aria-label={`Earning ${earnings} dollars`}>
          ${earnings}
        </div>
      </div>

      {/* Step 1: Compare */}
      {step === 'compare' && (
        <div
          className="flex-1 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe Indicator */}
          <div className="absolute inset-x-0 top-20 z-10 flex justify-between px-4 pointer-events-none">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-opacity ${
                swipeDirection === 'left' ? 'opacity-100 bg-green-500' : 'opacity-0'
              }`}
            >
              <ChevronLeft className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Photo A</span>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-opacity ${
                swipeDirection === 'right' ? 'opacity-100 bg-blue-500' : 'opacity-0'
              }`}
            >
              <span className="text-white font-semibold">Photo B</span>
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Photos */}
          <div
            className="flex-1 grid grid-cols-2 gap-1 p-1"
            style={{
              transform: `translateX(${touchDelta * 0.3}px)`,
              transition: touchStart === null ? 'transform 0.2s' : 'none',
            }}
          >
            <div className="relative">
              <Image
                src={photoAUrl}
                alt="Photo A"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                A
              </div>
            </div>
            <div className="relative">
              <Image
                src={photoBUrl}
                alt="Photo B"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                B
              </div>
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="p-4 bg-gray-800">
            <div className="text-center text-gray-400 text-sm mb-3">
              Swipe, tap, or use keyboard (A/B/T keys)
            </div>
            <div
              className="grid grid-cols-3 gap-3"
              role="group"
              aria-label="Choose your preferred photo"
            >
              <button
                ref={photoAButtonRef}
                onClick={() => handleChoice('A')}
                className="py-4 rounded-xl bg-green-600 text-white font-semibold flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
                aria-label="Choose Photo A"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                Photo A
              </button>
              <button
                onClick={() => {
                  // Tie - randomly pick but mark as tie for fair handling
                  handleChoice(Math.random() > 0.5 ? 'A' : 'B', true);
                }}
                className="py-4 rounded-xl bg-gray-600 text-white font-semibold flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
                aria-label="Mark as similar (tie)"
              >
                <Equal className="h-6 w-6" aria-hidden="true" />
                Similar
              </button>
              <button
                onClick={() => handleChoice('B')}
                className="py-4 rounded-xl bg-blue-600 text-white font-semibold flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
                aria-label="Choose Photo B"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
                Photo B
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Rate */}
      {step === 'rate' && (
        <div className="flex-1 flex flex-col p-4" role="form" aria-label="Rate the photos">
          <div className="text-center mb-6">
            <div className="text-white text-lg font-medium mb-1">
              {isTie ? 'They\'re similar' : `You chose Photo ${chosenPhoto}`}
            </div>
            <div className="text-gray-400 text-sm">
              {isTie ? 'Rate each photo to explain why' : 'Now rate each photo'}
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {/* Photo A Rating */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                  <Image src={photoAUrl} alt="A" fill className="object-cover" />
                </div>
                <div>
                  <div className="text-white font-medium">Photo A</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500 font-semibold">{photoARating}/10</span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={photoARating}
                onChange={(e) => setPhotoARating(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {/* Photo B Rating */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                  <Image src={photoBUrl} alt="B" fill className="object-cover" />
                </div>
                <div>
                  <div className="text-white font-medium">Photo B</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500 font-semibold">{photoBRating}/10</span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={photoBRating}
                onChange={(e) => setPhotoBRating(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Confidence */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">How confident?</span>
                <span className="text-white font-semibold">{confidence}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('reason')}
            className="w-full py-4 rounded-xl bg-purple-600 text-white font-semibold mt-4 active:scale-98 transition cursor-pointer"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Reason */}
      {step === 'reason' && (
        <div className="flex-1 flex flex-col p-4" role="form" aria-label="Explain your choice">
          <div className="text-center mb-4">
            <div className="text-white text-lg font-medium mb-1">
              {isTie ? 'Why are they similar?' : `Why Photo ${chosenPhoto}?`}
            </div>
            <div className="text-gray-400 text-sm">Help them understand your choice</div>
          </div>

          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder={
              isTie
                ? "Both photos have similar quality, the lighting and composition are comparable..."
                : "The lighting is better, the smile looks more natural, the background is less distracting..."
            }
            rows={5}
            className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            aria-label="Your reasoning"
            aria-describedby="reasoning-hint"
          />

          <div className="flex items-center justify-between text-sm mt-2 mb-4" id="reasoning-hint">
            <span className={reasoning.trim().length >= MIN_REASONING_LENGTH ? 'text-green-400' : 'text-gray-500'}>
              {reasoning.trim().length}/200 characters
            </span>
            {reasoning.trim().length < MIN_REASONING_LENGTH && (
              <span className="text-amber-400">
                {MIN_REASONING_LENGTH - reasoning.trim().length} more needed
              </span>
            )}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('rate')}
              className="flex-1 py-4 rounded-xl bg-gray-700 text-white font-semibold active:scale-98 transition cursor-pointer focus:ring-2 focus:ring-gray-500 focus:outline-none"
            >
              Back
            </button>
            <button
              onClick={handleSubmitVerdict}
              disabled={!canSubmit}
              className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition focus:ring-2 focus:ring-green-400 focus:outline-none ${
                canSubmit
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit {isTie ? '(Tie)' : ''} • ${earnings}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
