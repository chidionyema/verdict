'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Scale,
  DollarSign,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  Heart,
  MessageSquare,
  Eye,
  ThumbsUp,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface JudgeOnboardingWizardProps {
  onComplete: () => void;
  onSkipDemographics?: () => void;
}

type Step = 'intro' | 'guidelines' | 'quiz' | 'demographics' | 'complete';

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What makes feedback most valuable to someone seeking opinions?',
    options: [
      { id: 'harsh', label: 'Being brutally harsh to "help" them' },
      { id: 'honest_and_constructive', label: 'Being honest AND constructive' },
      { id: 'always_positive', label: 'Always being positive to be nice' },
      { id: 'short', label: 'Keeping it as short as possible' },
    ],
    correctAnswer: 'honest_and_constructive',
    explanation: 'Great feedback is honest but delivered constructively. It helps people improve without being harsh or falsely positive.',
  },
  {
    id: 'q2',
    question: 'If you see content that makes you uncomfortable, what should you do?',
    options: [
      { id: 'judge_anyway', label: 'Judge it anyway to earn credits' },
      { id: 'leave_negative', label: 'Leave a harsh negative review' },
      { id: 'professional_boundaries', label: 'Skip it and move to the next request' },
      { id: 'report_everything', label: 'Report every request you dislike' },
    ],
    correctAnswer: 'professional_boundaries',
    explanation: 'You can always skip requests that aren\'t a good fit. No pressure to judge everything!',
  },
  {
    id: 'q3',
    question: 'How quickly should you aim to complete judgments?',
    options: [
      { id: 'immediately', label: 'Within seconds (rush through)' },
      { id: 'within_24_hours', label: 'Within 24 hours (thoughtful pace)' },
      { id: 'whenever', label: 'Whenever you feel like it' },
      { id: 'weeks', label: 'Within a few weeks is fine' },
    ],
    correctAnswer: 'within_24_hours',
    explanation: 'People are waiting for feedback! Aim for 24 hours, but take enough time to give quality verdicts.',
  },
  {
    id: 'q4',
    question: 'What if you\'re unsure about a topic you\'re judging?',
    options: [
      { id: 'fake_expertise', label: 'Pretend you\'re an expert anyway' },
      { id: 'acknowledge_limits', label: 'Be honest about your perspective level' },
      { id: 'skip_all', label: 'Never judge anything you\'re unsure about' },
      { id: 'random', label: 'Just pick randomly to finish faster' },
    ],
    correctAnswer: 'acknowledge_limits',
    explanation: 'Honesty builds trust. Share your genuine perspective while being upfront about your expertise level.',
  },
];

const GUIDELINES = [
  {
    icon: Heart,
    title: 'Be Genuine',
    description: 'Share your real opinion. People want authentic feedback, not what you think they want to hear.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  {
    icon: MessageSquare,
    title: 'Explain Your Choice',
    description: 'Don\'t just pick A or B. Tell them WHY. "The lighting is better" beats "I like this one."',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Eye,
    title: 'Consider Context',
    description: 'A LinkedIn photo needs different qualities than a dating profile. Read what they\'re asking for.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: ThumbsUp,
    title: 'Be Constructive',
    description: 'Point out what works, not just what doesn\'t. Help them understand how to improve.',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Shield,
    title: 'Skip If Needed',
    description: 'Not comfortable with a request? Skip it. No penalties, no pressure. Your wellbeing matters.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Zap,
    title: 'Quality Over Speed',
    description: 'Take your time. Thoughtful feedback earns better ratings and unlocks higher-paying requests.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
];

export function JudgeOnboardingWizard({ onComplete }: JudgeOnboardingWizardProps) {
  const [step, setStep] = useState<Step>('intro');
  const [currentGuidelineIndex, setCurrentGuidelineIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Demographics state
  const [demographics, setDemographics] = useState({
    age_range: '',
    gender: '',
    location: '',
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing in form fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (step === 'intro' && e.key === 'Enter') {
        setStep('guidelines');
      } else if (step === 'guidelines') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          if (currentGuidelineIndex < GUIDELINES.length - 1) {
            setCurrentGuidelineIndex(currentGuidelineIndex + 1);
          } else {
            setStep('quiz');
          }
        } else if (e.key === 'ArrowLeft') {
          if (currentGuidelineIndex > 0) {
            setCurrentGuidelineIndex(currentGuidelineIndex - 1);
          }
        }
      } else if (step === 'quiz' && !showQuizResult) {
        // Number keys 1-4 for quick answer selection
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
          const option = currentQuestion.options[num - 1];
          if (option) {
            setQuizAnswers(prev => ({ ...prev, [currentQuestion.id]: option.id }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, currentGuidelineIndex, currentQuestionIndex, showQuizResult]);

  // Touch swipe handlers for guidelines
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (step === 'guidelines') {
      if (diff > threshold && currentGuidelineIndex < GUIDELINES.length - 1) {
        // Swipe left - go next
        setCurrentGuidelineIndex(currentGuidelineIndex + 1);
      } else if (diff < -threshold && currentGuidelineIndex > 0) {
        // Swipe right - go back
        setCurrentGuidelineIndex(currentGuidelineIndex - 1);
      }
    }

    touchStartX.current = null;
  };

  const handleQuizAnswer = (questionId: string, answerId: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const submitQuiz = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/judge/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: quizAnswers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      if (data.passed) {
        setQuizPassed(true);
        setShowQuizResult(true);
        // Auto-advance after showing success
        setTimeout(() => {
          setStep('demographics');
        }, 2000);
      } else {
        setShowQuizResult(true);
        setQuizPassed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [quizAnswers]);

  const submitDemographics = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demographics),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save demographics');
      }

      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [demographics, onComplete]);

  const skipDemographics = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length;
  const correctAnswers = QUIZ_QUESTIONS.filter(q => quizAnswers[q.id] === q.correctAnswer).length;

  // Progress percentage
  const getProgress = () => {
    switch (step) {
      case 'intro': return 0;
      case 'guidelines': return 25 + (currentGuidelineIndex / GUIDELINES.length) * 25;
      case 'quiz': return 50 + (currentQuestionIndex / QUIZ_QUESTIONS.length) * 25;
      case 'demographics': return 85;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Becoming a Judge</span>
          <span>{Math.round(getProgress())}% complete</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Step: Intro */}
      {step === 'intro' && (
        <div className="text-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
            <Scale className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Become a Judge
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Help people make better decisions and earn money doing it.
            Takes about 2 minutes to get started.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-green-50 rounded-xl">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">$0.60-$2</div>
              <div className="text-sm text-gray-500">per verdict</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">2-3 min</div>
              <div className="text-sm text-gray-500">per verdict</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">+50%</div>
              <div className="text-sm text-gray-500">as Expert</div>
            </div>
          </div>

          <button
            onClick={() => setStep('guidelines')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Let&apos;s Get Started
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step: Guidelines */}
      {step === 'guidelines' && (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Guidelines
            </h2>
            <p className="text-gray-600">
              {currentGuidelineIndex + 1} of {GUIDELINES.length}
            </p>
            {/* Keyboard hint - hidden on mobile */}
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">
              Use arrow keys or swipe to navigate
            </p>
          </div>

          {/* Guideline Card with touch support */}
          <div
            ref={containerRef}
            className="relative overflow-hidden touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              key={currentGuidelineIndex}
              className={`p-8 rounded-2xl border-2 ${GUIDELINES[currentGuidelineIndex].bgColor} border-gray-100 transition-all animate-in slide-in-from-right-5 duration-300`}
            >
              <div className="flex flex-col items-center text-center">
                {(() => {
                  const Icon = GUIDELINES[currentGuidelineIndex].icon;
                  return (
                    <div className="p-4 rounded-full bg-white shadow-sm mb-4 transform transition-transform hover:scale-105">
                      <Icon className={`h-8 w-8 ${GUIDELINES[currentGuidelineIndex].color}`} />
                    </div>
                  );
                })()}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {GUIDELINES[currentGuidelineIndex].title}
                </h3>
                <p className="text-gray-600 text-lg max-w-sm">
                  {GUIDELINES[currentGuidelineIndex].description}
                </p>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {GUIDELINES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentGuidelineIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentGuidelineIndex
                      ? 'w-6 bg-indigo-600'
                      : index < currentGuidelineIndex
                      ? 'bg-indigo-400'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => {
                if (currentGuidelineIndex > 0) {
                  setCurrentGuidelineIndex(currentGuidelineIndex - 1);
                } else {
                  setStep('intro');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            <button
              onClick={() => {
                if (currentGuidelineIndex < GUIDELINES.length - 1) {
                  setCurrentGuidelineIndex(currentGuidelineIndex + 1);
                } else {
                  setStep('quiz');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {currentGuidelineIndex < GUIDELINES.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  Start Quick Quiz
                  <Sparkles className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Quiz */}
      {step === 'quiz' && !showQuizResult && (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Check
            </h2>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
            </p>
            {/* Keyboard hint - hidden on mobile */}
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">
              Press 1-4 to select an answer
            </p>
          </div>

          {/* Question */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = quizAnswers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleQuizAnswer(currentQuestion.id, option.id)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Number badge for keyboard shortcut */}
                      <span
                        className={`hidden sm:flex w-6 h-6 rounded-md items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {optionIndex + 1}
                      </span>
                      <div
                        className={`sm:hidden w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-500 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else {
                  setStep('guidelines');
                  setCurrentGuidelineIndex(GUIDELINES.length - 1);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={!quizAnswers[currentQuestion.id]}
                className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors ${
                  quizAnswers[currentQuestion.id]
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={!allQuestionsAnswered || isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors ${
                  allQuestionsAnswered && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Submit Answers
                    <Check className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Result */}
      {step === 'quiz' && showQuizResult && (
        <div className="animate-in fade-in duration-500">
          {quizPassed ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You&apos;re In!
              </h2>
              <p className="text-gray-600 mb-4">
                {correctAnswers}/{QUIZ_QUESTIONS.length} correct. You&apos;re ready to start judging.
              </p>
              <div className="text-sm text-gray-500">
                Taking you to the next step...
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                <X className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Almost There!
              </h2>
              <p className="text-gray-600 mb-4">
                You got {correctAnswers}/{QUIZ_QUESTIONS.length}. You need all 4 correct to continue.
              </p>

              {/* Show correct answers toggle */}
              {!showCorrectAnswers ? (
                <button
                  onClick={() => setShowCorrectAnswers(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-6 underline"
                >
                  Review the correct answers
                </button>
              ) : (
                <div className="text-left bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
                  {QUIZ_QUESTIONS.map((q, idx) => {
                    const userAnswer = quizAnswers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const correctOption = q.options.find(o => o.id === q.correctAnswer);
                    return (
                      <div key={q.id} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-start gap-2">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">{q.question}</p>
                            {!isCorrect && (
                              <p className="text-sm text-green-700">
                                <span className="font-medium">Correct:</span> {correctOption?.label}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setCurrentQuestionIndex(0);
                    setShowQuizResult(false);
                    setShowCorrectAnswers(false);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Demographics */}
      {step === 'demographics' && (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              One Last Thing (Optional)
            </h2>
            <p className="text-gray-600">
              Help us match you with relevant requests. You can skip this.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <select
                value={demographics.age_range}
                onChange={(e) => setDemographics(prev => ({ ...prev, age_range: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select age range</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55-64">55-64</option>
                <option value="65+">65+</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={demographics.gender}
                onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={demographics.location}
                onChange={(e) => setDemographics(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 mt-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={skipDemographics}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Skip for now
            </button>

            <button
              onClick={submitDemographics}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="text-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, Judge!
          </h2>
          <p className="text-gray-600 mb-4">
            You&apos;re all set. Let&apos;s find you some requests to judge.
          </p>
          <div className="text-sm text-gray-500">
            Loading your queue...
          </div>
        </div>
      )}
    </div>
  );
}
