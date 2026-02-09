'use client';

import { useState } from 'react';
import { Heart, X, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

interface TrainingCard {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  correctAction: 'like' | 'dislike';
  explanation: string;
  goodFeedback: string;
  badFeedback: string;
}

const TRAINING_CARDS: TrainingCard[] = [
  {
    id: 'good-example',
    title: 'Does this haircut suit me?',
    content: 'I\'m thinking of keeping this style for my job interview next week. What do you think?',
    imageUrl: '/training/haircut-good.jpg',
    correctAction: 'like',
    explanation: 'This is a well-styled, professional haircut that would be appropriate for a job interview.',
    goodFeedback: 'Looks great! Very professional and well-styled. Perfect for an interview.',
    badFeedback: 'Bad hair'
  },
  {
    id: 'poor-photo',
    title: 'Rate my new profile picture',
    content: 'Just took this selfie in my car. Good for dating apps?',
    imageUrl: '/training/selfie-poor.jpg', 
    correctAction: 'dislike',
    explanation: 'Poor lighting, distracting background, and low-effort composition make this unsuitable for dating profiles.',
    goodFeedback: 'The lighting is quite dark and the car setting is distracting. Try taking photos in natural light with a clean background for better results.',
    badFeedback: 'Terrible pic'
  },
  {
    id: 'creative-work',
    title: 'Feedback on my logo design?',
    content: 'I\'m designing a logo for my coffee shop. Does this capture the cozy, artisan vibe I\'m going for?',
    imageUrl: '/training/logo-design.jpg',
    correctAction: 'like',
    explanation: 'This shows genuine creative effort and asks for specific feedback about brand alignment.',
    goodFeedback: 'I love the handcrafted typography! It definitely gives off that artisan coffee shop vibe. The earth tones work well too.',
    badFeedback: 'Looks fine'
  }
];

interface JudgeTrainingProps {
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

export function JudgeTraining({ onComplete, onSkip, className = '' }: JudgeTrainingProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());

  const currentCard = TRAINING_CARDS[currentCardIndex];
  const isLastCard = currentCardIndex === TRAINING_CARDS.length - 1;
  const allCardsCompleted = completedCards.size === TRAINING_CARDS.length;

  const handleJudgment = (action: 'like' | 'dislike') => {
    setUserAction(action);
    const correct = action === currentCard.correctAction;
    setIsCorrect(correct);
    setShowExplanation(true);
    
    if (correct) {
      setCompletedCards(prev => new Set([...prev, currentCard.id]));
    }
  };

  const handleNext = () => {
    if (isLastCard && allCardsCompleted) {
      onComplete();
      return;
    }

    // Move to next card
    const nextIndex = (currentCardIndex + 1) % TRAINING_CARDS.length;
    setCurrentCardIndex(nextIndex);
    setUserAction(null);
    setShowExplanation(false);
    setIsCorrect(null);
  };

  const handleRetry = () => {
    setUserAction(null);
    setShowExplanation(false);
    setIsCorrect(null);
  };

  return (
    <div className={`max-w-lg mx-auto ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-bold text-lg">Judge Training</h3>
              <p className="text-indigo-100 text-sm">
                Learn to give quality feedback
              </p>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="text-right">
                <div className="text-sm opacity-80">
                  {currentCardIndex + 1} of {TRAINING_CARDS.length}
                </div>
                <div className="flex gap-1 mt-1">
                  {TRAINING_CARDS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= currentCardIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close training"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{currentCard.title}</h4>
              <p className="text-gray-600">{currentCard.content}</p>
            </div>

            {/* Visual representation of the submission */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center border border-gray-200">
              <div className="text-center p-6">
                {currentCard.id === 'good-example' && (
                  <>
                    <div className="text-5xl mb-3">💇</div>
                    <p className="text-gray-600 text-sm font-medium">Professional haircut photo</p>
                    <p className="text-gray-400 text-xs mt-1">Well-lit, clean background, neat styling</p>
                  </>
                )}
                {currentCard.id === 'poor-photo' && (
                  <>
                    <div className="text-5xl mb-3">🚗</div>
                    <p className="text-gray-600 text-sm font-medium">Car selfie photo</p>
                    <p className="text-gray-400 text-xs mt-1">Dark lighting, messy background</p>
                  </>
                )}
                {currentCard.id === 'creative-work' && (
                  <>
                    <div className="text-5xl mb-3">☕</div>
                    <p className="text-gray-600 text-sm font-medium">Coffee shop logo design</p>
                    <p className="text-gray-400 text-xs mt-1">Handcrafted typography, earthy tones</p>
                  </>
                )}
              </div>
            </div>

            {/* Training Actions */}
            {!showExplanation && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  How would you judge this?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleJudgment('like')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition"
                  >
                    <Heart className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">Good</span>
                  </button>
                  <button
                    onClick={() => handleJudgment('dislike')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition"
                  >
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-700">Not Good</span>
                  </button>
                </div>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="space-y-4">
                {/* Result */}
                <div className={`p-4 rounded-xl border-2 ${
                  isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isCorrect ? 'Correct!' : 'Not quite right'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {currentCard.explanation}
                  </p>
                </div>

                {/* Good vs Bad Feedback Examples */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Example feedback:
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Good feedback</span>
                    </div>
                    <p className="text-sm text-gray-700">"{currentCard.goodFeedback}"</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Poor feedback</span>
                    </div>
                    <p className="text-sm text-gray-700">"{currentCard.badFeedback}"</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {isCorrect ? (
                    <button
                      onClick={handleNext}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                    >
                      <span>{isLastCard && allCardsCompleted ? 'Complete Training' : 'Next Example'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                      >
                        Continue
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with progress and skip option */}
        <div className="bg-gray-50 px-6 py-4 border-t flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare className="h-3 w-3" />
              <span>
                {completedCards.size} of {TRAINING_CARDS.length} examples completed
              </span>
            </div>
          </div>

          {/* Skip option with soft warning */}
          {onSkip && (
            <div className="border-t border-gray-200 pt-3">
              <button
                onClick={onSkip}
                className="w-full py-2.5 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium min-h-[44px]"
              >
                Skip for now
              </button>
              <p className="text-xs text-gray-400 text-center mt-1.5">
                Training helps you earn higher reputation and give better feedback
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}