'use client';

import { useState } from 'react';
import { Shield, Heart, AlertTriangle, CheckCircle, MessageCircle, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';

interface SafetyTrainingProps {
  onComplete: () => void;
  loading?: boolean;
}

interface ScenarioQuiz {
  id: string;
  scenario: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

const safetyTopics = [
  {
    title: 'Giving Constructive Feedback',
    icon: MessageCircle,
    color: 'text-green-600 bg-green-50',
    points: [
      'Focus on the specific thing being asked about',
      'Be specific and actionable - "Your smile looks more natural in the second photo" vs "You look better"',
      'Explain your reasoning when helpful',
      'Avoid personal attacks or judgments about character',
      'Remember there\'s a real person behind every request'
    ]
  },
  {
    title: 'Receiving Feedback Safely',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50',
    points: [
      'Remember that feedback is just one person\'s opinion',
      'Look for patterns across multiple responses, not single comments',
      'It\'s okay to disagree with feedback you receive',
      'Take breaks if feedback becomes overwhelming',
      'Focus on actionable suggestions, ignore harsh criticism'
    ]
  },
  {
    title: 'Recognizing Inappropriate Content',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    points: [
      'Personal attacks, harassment, or bullying',
      'Sexually explicit or inappropriate requests',
      'Hate speech or discriminatory language',
      'Requests that seem to violate privacy or laws',
      'Obvious spam or fake content'
    ]
  },
  {
    title: 'When and How to Report',
    icon: Flag,
    color: 'text-orange-600 bg-orange-50',
    points: [
      'Report immediately if you feel unsafe or uncomfortable',
      'Use the flag icon next to any content',
      'Provide context in your report to help our team',
      'Block users who make you uncomfortable',
      'Don\'t engage with problematic content - just report it'
    ]
  }
];

const quizScenarios: ScenarioQuiz[] = [
  {
    id: 'good-feedback',
    scenario: 'Someone asks for feedback on their job interview outfit. Which response is most helpful?',
    options: [
      {
        text: '"You look professional and confident. The navy suit works well for interviews."',
        correct: true,
        explanation: 'This is constructive, specific, and directly addresses what they asked about.'
      },
      {
        text: '"You\'re ugly and will never get the job."',
        correct: false,
        explanation: 'This is a personal attack and not constructive feedback. This should be reported.'
      },
      {
        text: '"Nice."',
        correct: false,
        explanation: 'While not harmful, this doesn\'t provide useful, actionable feedback.'
      }
    ]
  },
  {
    id: 'inappropriate-request',
    scenario: 'You see a request that seems to be asking for feedback on inappropriate content. What should you do?',
    options: [
      {
        text: 'Ignore it and move on to the next request',
        correct: false,
        explanation: 'While you shouldn\'t engage, you should report inappropriate content to help keep the community safe.'
      },
      {
        text: 'Report the content using the flag button',
        correct: true,
        explanation: 'Reporting helps our moderation team remove inappropriate content and keep the platform safe.'
      },
      {
        text: 'Comment telling them it\'s inappropriate',
        correct: false,
        explanation: 'Don\'t engage with inappropriate content directly. Just report it and move on.'
      }
    ]
  },
  {
    id: 'receiving-harsh-feedback',
    scenario: 'You receive a harsh, critical response to your request. What\'s the best approach?',
    options: [
      {
        text: 'Respond angrily and defend yourself',
        correct: false,
        explanation: 'Engaging in arguments rarely helps. It\'s better to focus on constructive responses.'
      },
      {
        text: 'Take it personally and feel terrible about yourself',
        correct: false,
        explanation: 'Remember that it\'s just one person\'s opinion. Look for patterns across multiple responses.'
      },
      {
        text: 'Consider if there\'s any useful insight, but don\'t take it too personally',
        correct: true,
        explanation: 'The best approach is to evaluate feedback objectively while protecting your mental health.'
      }
    ]
  }
];

export function SafetyTraining({ onComplete, loading = false }: SafetyTrainingProps) {
  const [completedTopics, setCompletedTopics] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizResults, setQuizResults] = useState<{ [key: string]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  const handleTopicComplete = (index: number) => {
    setCompletedTopics(prev => new Set(prev).add(index));
  };

  const handleQuizAnswer = (scenarioId: string, optionIndex: string) => {
    setQuizAnswers(prev => ({ ...prev, [scenarioId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    const results: { [key: string]: boolean } = {};
    
    quizScenarios.forEach(scenario => {
      const userAnswer = quizAnswers[scenario.id];
      if (userAnswer !== undefined) {
        const optionIndex = parseInt(userAnswer);
        results[scenario.id] = scenario.options[optionIndex].correct;
      }
    });
    
    setQuizResults(results);
    setShowResults(true);
  };

  const allTopicsRead = completedTopics.size === safetyTopics.length;
  const allQuizAnswered = Object.keys(quizAnswers).length === quizScenarios.length;
  const quizScore = Object.values(quizResults).filter(Boolean).length;
  const quizPassed = quizScore >= quizScenarios.length; // All questions must be correct
  const canComplete = allTopicsRead && quizPassed;

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Safety Training</h3>
        </div>
        <p className="text-blue-800 leading-relaxed">
          Learn how to give and receive feedback safely. This training helps create 
          a positive environment where everyone can get honest, constructive input.
        </p>
      </div>

      {/* Safety Topics */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Essential Safety Knowledge</h4>
        
        {safetyTopics.map((topic, index) => {
          const isCompleted = completedTopics.has(index);
          const Icon = topic.icon;
          
          return (
            <div
              key={index}
              className={`border-2 rounded-lg transition-all ${
                isCompleted 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${topic.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h5 className="font-semibold text-gray-900">{topic.title}</h5>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                
                <ul className="space-y-3">
                  {topic.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
                
                {!isCompleted && (
                  <button
                    onClick={() => handleTopicComplete(index)}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiz Section */}
      {allTopicsRead && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">Safety Quiz</h4>
          <p className="text-gray-600">
            Test your understanding with these scenarios. You need to get all questions 
            correct to complete the safety training.
          </p>
          
          {quizScenarios.map((scenario, scenarioIndex) => (
            <div key={scenario.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="font-medium text-gray-900 mb-4">
                Question {scenarioIndex + 1}: {scenario.scenario}
              </h5>
              
              <div className="space-y-3">
                {scenario.options.map((option, optionIndex) => {
                  const isSelected = quizAnswers[scenario.id] === optionIndex.toString();
                  const showExplanation = showResults && isSelected;
                  const isCorrect = option.correct;
                  
                  return (
                    <div key={optionIndex}>
                      <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        showResults
                          ? isSelected
                            ? isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                          : isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name={scenario.id}
                          value={optionIndex}
                          checked={isSelected}
                          onChange={(e) => handleQuizAnswer(scenario.id, e.target.value)}
                          disabled={showResults}
                          className="mt-1 text-indigo-600"
                        />
                        <span className="flex-1">{option.text}</span>
                        {showResults && isSelected && (
                          isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )
                        )}
                      </label>
                      
                      {showExplanation && (
                        <div className={`mt-2 p-3 rounded-lg text-sm ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {option.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {allQuizAnswered && !showResults && (
            <button
              onClick={handleSubmitQuiz}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700"
            >
              Submit Quiz
            </button>
          )}
          
          {showResults && (
            <div className={`p-6 rounded-lg ${
              quizPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {quizPassed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <span className={`font-semibold ${
                  quizPassed ? 'text-green-900' : 'text-red-900'
                }`}>
                  Quiz Score: {quizScore} / {quizScenarios.length}
                </span>
              </div>
              
              {quizPassed ? (
                <p className="text-green-800">
                  Excellent! You've demonstrated a good understanding of safety principles.
                </p>
              ) : (
                <div className="text-red-800">
                  <p className="mb-2">Please review the incorrect answers above and retake the quiz.</p>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setQuizAnswers({});
                      setQuizResults({});
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completion */}
      {canComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Safety Training Complete!</h3>
          </div>
          <p className="text-green-800 mb-6">
            You've successfully completed the safety training. You now understand how to 
            give and receive feedback safely and constructively.
          </p>
          
          <button
            onClick={onComplete}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Completing Training...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Complete Safety Training
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}