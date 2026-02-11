'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

// Force dynamic rendering to avoid Supabase client issues during build
export const dynamic = 'force-dynamic';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Users,
  Star,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { BackButton } from '@/components/ui/BackButton';
import { DemographicCollection } from '@/components/judge/demographic-collection';

interface QualificationStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  completed: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question: 'What is the most important aspect of providing quality feedback?',
    options: [
      'Being brutally honest without consideration',
      'Always being positive and encouraging',
      'Being honest while remaining constructive and respectful',
      'Focusing only on negative aspects'
    ],
    correctAnswer: 2,
    explanation: 'Quality feedback balances honesty with constructiveness and respect for the person receiving it.'
  },
  {
    id: '2',
    question: 'What should you do if you see content that makes you uncomfortable?',
    options: [
      'Provide harsh criticism',
      'Skip the request and let someone else handle it',
      'Report the content if it violates guidelines',
      'Give a low rating without explanation'
    ],
    correctAnswer: 2,
    explanation: 'Content that violates guidelines should be reported. If content simply makes you uncomfortable but isn\'t inappropriate, you can skip it.'
  },
  {
    id: '3',
    question: 'How much time should you typically spend on each verdict?',
    options: [
      '10-15 seconds for quick judgments',
      '1-2 minutes to provide thoughtful feedback',
      '5+ minutes for detailed analysis',
      'As little time as possible'
    ],
    correctAnswer: 1,
    explanation: 'Quality feedback requires 1-2 minutes of thoughtful consideration to be helpful while maintaining good throughput.'
  },
  {
    id: '4',
    question: 'What makes feedback most valuable?',
    options: [
      'Being as detailed as possible',
      'Agreeing with other judges',
      'Being specific and actionable',
      'Using professional terminology'
    ],
    correctAnswer: 2,
    explanation: 'Specific, actionable feedback helps people understand exactly what they can improve or what\'s working well.'
  }
];

export default function JudgeQualificationPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [showResults, setShowResults] = useState(false);
  const [qualificationScore, setQualificationScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemographics, setShowDemographics] = useState(false);
  const [demographicsCompleted, setDemographicsCompleted] = useState(false);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [lastDemographicsData, setLastDemographicsData] = useState<any>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const getUser = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
        
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          // If already a judge, redirect to judge dashboard
          if ((profileData as any).is_judge) {
            router.push('/judge');
            return;
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Focus management: move focus to step heading when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepHeadingRef.current) {
        stepHeadingRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitQualification = async () => {
    setIsSubmitting(true);

    try {
      // Convert answers to server format (question_id -> answer_id)
      const serverAnswers: Record<string, string> = {};
      QUIZ_QUESTIONS.forEach(question => {
        const answerIndex = quizAnswers[question.id];
        if (answerIndex !== undefined) {
          // Map answer index to answer ID expected by server
          const answerMap: Record<number, string> = {
            0: question.id === '1' ? 'always_positive' : question.id === '2' ? 'skip_it' : question.id === '3' ? 'immediately' : 'guess_anyway',
            1: question.id === '1' ? 'honest_and_constructive' : question.id === '2' ? 'professional_boundaries' : question.id === '3' ? 'within_24_hours' : 'acknowledge_limits',
            2: question.id === '1' ? 'brief_and_quick' : question.id === '2' ? 'harsh_criticism' : question.id === '3' ? 'whenever_convenient' : 'refuse_entirely',
            3: question.id === '1' ? 'agreeing_with_asker' : question.id === '2' ? 'only_positive' : question.id === '3' ? 'within_week' : 'pretend_expert',
          };
          // Map local question ID to server question ID
          const serverQuestionMap: Record<string, string> = {
            '1': 'q1',
            '2': 'q2',
            '3': 'q3',
            '4': 'q4'
          };
          serverAnswers[serverQuestionMap[question.id]] = answerMap[answerIndex];
        }
      });

      // Submit to server for validation
      const response = await fetch('/api/judge/complete-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: serverAnswers }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(result.error || 'Too many attempts. Try again tomorrow.');
        } else {
          toast.error(result.error || 'Quiz submission failed');
        }
        setIsSubmitting(false);
        return;
      }

      // Update UI with results
      const score = (result.score / result.total) * 100;
      setQualificationScore(score);
      setShowResults(true);

      if (result.passed) {
        // Quiz passed and judge status granted by server
        setTimeout(() => {
          setShowDemographics(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error('Failed to submit quiz. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleDemographicsComplete = async (demographicsData: any) => {
    setIsCompletingSetup(true);
    setSetupError(null);
    setLastDemographicsData(demographicsData);

    try {
      // Save demographics
      const demographicsRes = await fetch('/api/judge/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demographicsData),
      });

      if (!demographicsRes.ok) {
        const errorData = await demographicsRes.json();
        console.error('Demographics API error:', errorData);

        // Check if it's a database setup issue
        if (errorData.instructions) {
          setSetupError('Database setup required. Please contact support.');
          console.error(`Database Setup Required:\n${errorData.details}\nMigration file: ${errorData.migrationFile}`);
          throw new Error(errorData.error);
        }

        throw new Error(`Failed to save demographics: ${errorData.error || 'Unknown error'}`);
      }

      // Judge status was already set by the quiz endpoint
      // Just complete the setup
      setDemographicsCompleted(true);
      setIsCompletingSetup(false);
      setTimeout(() => {
        router.push('/judge');
      }, 3000);
    } catch (error) {
      console.error('Error completing judge setup:', error);
      setSetupError(error instanceof Error ? error.message : 'There was an error completing your setup.');
      toast.error('There was an error completing your setup. Please try again.');
      setIsCompletingSetup(false);
    }
  };

  const handleRetrySetup = () => {
    if (lastDemographicsData) {
      handleDemographicsComplete(lastDemographicsData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading qualification...</p>
        <p className="text-gray-400 text-sm mt-2">This should only take a moment</p>
      </div>
    );
  }

  const qualificationSteps: QualificationStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Judge Qualification',
      description: 'Learn what it takes to be a quality judge',
      completed: currentStep > 0,
      content: (
        <div className="text-center space-y-6">
          <div className="bg-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Become a Judge</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your life experience helps others (and pays). You don't need to be an expert, just share your perspective.
          </p>

          {/* Confidence Building Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xl mx-auto mt-4">
            <p className="text-blue-800 text-sm">
              <strong>Remember:</strong> Seekers value diverse viewpoints. Your unique experience and honest opinion are exactly what people need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Flexible Schedule</h3>
              <p className="text-sm text-gray-600">Judge when you want, as much as you want</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Earn Credits</h3>
              <p className="text-sm text-gray-600">Get rewarded for quality judgments</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Safe Environment</h3>
              <p className="text-sm text-gray-600">Moderated content and community guidelines</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'guidelines',
      title: 'Judge Guidelines',
      description: 'Understanding quality standards and expectations',
      completed: currentStep > 1,
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Quality Standards</h2>
            <p className="text-gray-600">Follow these guidelines to provide valuable feedback</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Do: Be Constructive</h3>
                  <ul className="text-green-700 space-y-1 text-sm">
                    <li>• Provide specific, actionable feedback</li>
                    <li>• Balance honest critique with encouragement</li>
                    <li>• Explain your reasoning when possible</li>
                    <li>• Consider the context and intent</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Don't: Be Unnecessarily Harsh</h3>
                  <ul className="text-red-700 space-y-1 text-sm">
                    <li>• Avoid personal attacks or cruel comments</li>
                    <li>• Don't make assumptions about people</li>
                    <li>• Skip requests you can't judge fairly</li>
                    <li>• Report inappropriate content instead of engaging</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <Lightbulb className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Example Quality Feedback</h3>
                  <div className="bg-white rounded p-4 mt-3 border">
                    <p className="text-sm text-gray-600 italic mb-2">"Rate this outfit for a job interview"</p>
                    <p className="text-sm text-blue-800">
                      <strong>Good:</strong> "The colors work well together and it's appropriately formal. Consider adding a simple accessory like a watch to complete the professional look. The fit appears good from what I can see. Great choice for an interview!"
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      <strong>Poor:</strong> "Looks fine" or "Terrible choice"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quiz',
      title: 'Qualification Quiz',
      description: 'Test your understanding of judge guidelines',
      completed: showResults && qualificationScore >= 75,
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <Star className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Qualification Quiz</h2>
            <p className="text-gray-600">Answer these questions to demonstrate your understanding</p>
            <p className="text-sm text-gray-500 mt-2">You need 75% or higher to qualify</p>
          </div>
          
          {!showResults ? (
            <div className="space-y-8">
              {QUIZ_QUESTIONS.map((question, index) => (
                <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-indigo-600">Question {index + 1} of {QUIZ_QUESTIONS.length}</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{question.question}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleQuizAnswer(question.id, optionIndex)}
                        className={`w-full text-left p-4 rounded-lg border transition ${
                          quizAnswers[question.id] === optionIndex
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            quizAnswers[question.id] === optionIndex
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {quizAnswers[question.id] === optionIndex && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="text-center">
                <button
                  onClick={submitQualification}
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length || isSubmitting}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[48px] inline-flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Checking answers...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </button>
                {Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please answer all {QUIZ_QUESTIONS.length} questions ({Object.keys(quizAnswers).length}/{QUIZ_QUESTIONS.length} answered)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className={`rounded-full w-24 h-24 flex items-center justify-center mx-auto ${
                qualificationScore >= 75 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {qualificationScore >= 75 ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-600" />
                )}
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {qualificationScore >= 75 ? 'Congratulations!' : 'Almost There!'}
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  You scored {qualificationScore}% ({Math.round(qualificationScore / 25)} out of {QUIZ_QUESTIONS.length} correct)
                </p>
                
                {qualificationScore >= 75 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      {showDemographics ? 
                        "Great! Now let's set up your judge profile to help match you with relevant requests." :
                        "You've successfully qualified as a judge! Next, we'll set up your profile."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 mb-4">
                      You need 75% or higher to qualify. Review the guidelines and try again.
                    </p>
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setQuizAnswers({});
                        setCurrentStep(1);
                      }}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
              
              {/* Show explanations */}
              <div className="space-y-4 mt-8 text-left">
                <h4 className="font-semibold text-gray-900 text-center">Answer Explanations:</h4>
                {QUIZ_QUESTIONS.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        quizAnswers[question.id] === question.correctAnswer
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{question.question}</p>
                        <p className="text-sm text-green-700 mb-2">
                          <strong>Correct:</strong> {question.options[question.correctAnswer]}
                        </p>
                        <p className="text-sm text-gray-600">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Breadcrumb 
          className="mb-6" 
          customItems={[
            { label: 'Home', href: '/' },
            { label: 'Judge', href: '/judge' },
            { label: 'Qualification', href: '/judge/qualify' }
          ]}
        />
        
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <BackButton useHistory label="Back" />
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {qualificationSteps.length}
            </div>
          </div>
          
          <div className="flex space-x-4 mb-6">
            {qualificationSteps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className={`h-2 rounded-full ${
                  index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>
                <div className="mt-2 text-xs text-gray-600">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Screen reader announcement for step changes */}
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:p-2 focus:rounded focus:shadow-lg focus:z-50"
            >
              {showDemographics ? 'Complete Your Judge Profile' : qualificationSteps[currentStep]?.title}
            </h2>
            {showDemographics ? (
              demographicsCompleted ? (
                <div className="text-center space-y-6">
                  <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Judge Community!</h2>
                    <p className="text-lg text-gray-600 mb-4">
                      Your profile has been set up successfully. You'll be redirected to the judge dashboard in a moment.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">
                        You can now start reviewing requests and earning credits. Thank you for joining our community of judges!
                      </p>
                    </div>
                  </div>
                </div>
              ) : isCompletingSetup ? (
                <div className="text-center space-y-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Setting Up Your Profile...</h2>
                    <p className="text-gray-600">Please wait while we complete your judge registration.</p>
                  </div>
                </div>
              ) : setupError ? (
                <div className="text-center space-y-6">
                  <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Failed</h2>
                    <p className="text-gray-600 mb-4">{setupError}</p>
                    <button
                      onClick={handleRetrySetup}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-8">
                    <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Complete Your Judge Profile</h2>
                    <p className="text-gray-600 mt-2">
                      Help us match you with requests where your perspective is most valuable
                    </p>
                  </div>
                  <DemographicCollection onComplete={handleDemographicsComplete} />
                </div>
              )
            ) : (
              qualificationSteps[currentStep].content
            )}
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div>
                {currentStep > 0 && !showResults && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div>
                {currentStep < qualificationSteps.length - 1 && !showResults && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}