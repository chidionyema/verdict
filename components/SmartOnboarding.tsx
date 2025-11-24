'use client';

import { useState } from 'react';
import { Target, Clock, TrendingUp, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface OnboardingGoal {
  id: string;
  title: string;
  description: string;
  icon: any;
  urgency: 'low' | 'medium' | 'high';
  successRate: number;
  timeToResult: string;
  examples: string[];
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const goals: OnboardingGoal[] = [
  {
    id: 'career',
    title: 'Advance My Career',
    description: 'Interview prep, professional image, leadership presence',
    icon: Target,
    urgency: 'high',
    successRate: 89,
    timeToResult: '1-2 weeks',
    examples: ['Interview outfits', 'LinkedIn profiles', 'Presentation skills']
  },
  {
    id: 'dating',
    title: 'Improve Dating Success',
    description: 'Photos, style, conversation starters, profile optimization',
    icon: TrendingUp,
    urgency: 'medium',
    successRate: 92,
    timeToResult: '3-7 days',
    examples: ['Dating photos', 'Style advice', 'Bio writing']
  },
  {
    id: 'confidence',
    title: 'Build Confidence',
    description: 'Personal style, communication, public speaking',
    icon: CheckCircle,
    urgency: 'medium',
    successRate: 87,
    timeToResult: '1-3 weeks',
    examples: ['Style transformation', 'Communication tips', 'Body language']
  },
  {
    id: 'event',
    title: 'Prepare for Event',
    description: 'Wedding, party, presentation, special occasion',
    icon: Clock,
    urgency: 'high',
    successRate: 94,
    timeToResult: '1-5 days',
    examples: ['Event outfits', 'Speech preparation', 'Photo poses']
  }
];

// Goal Selection Step
function GoalSelection({ onSelect }: { onSelect: (goal: OnboardingGoal) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          What's your main goal?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          We'll customize your experience and match you with the perfect experts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              onClick={() => onSelect(goal)}
              className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {goal.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {goal.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      goal.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      goal.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {goal.urgency} urgency
                    </span>
                    <span>{goal.successRate}% success rate</span>
                    <span>Results in {goal.timeToResult}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Success Preview Step
function SuccessPreview({ goal, onContinue }: { goal: OnboardingGoal; onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Perfect! Here's what to expect
        </h2>
        <p className="text-lg text-gray-600">
          Based on {goal.title.toLowerCase()}, here's how we'll help you succeed
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {goal.successRate}% Success Rate
            </h3>
            <p className="text-green-700">
              People with your goal typically see results in {goal.timeToResult}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">You'll get feedback on:</h4>
          {goal.examples.map((example, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">{example}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Pro Tip</h4>
            <p className="text-yellow-700 text-sm">
              Users who follow our upload guidelines get 40% better feedback quality. 
              We'll guide you through the best practices next.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        Let's Get Started
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// Upload Guidance Step
function UploadGuidance({ goal, onContinue }: { goal: OnboardingGoal; onContinue: () => void }) {
  const tips = {
    career: [
      'Use good lighting and a clean background',
      'Include full-body shots for style feedback',
      'Mention your industry and role level',
      'Upload multiple outfit options if possible'
    ],
    dating: [
      'Show your genuine smile and personality',
      'Include both close-up and full-body photos',
      'Mention your age and dating goals',
      'Natural lighting works best'
    ],
    confidence: [
      'Be specific about what areas you want to improve',
      'Include photos that show your current style',
      'Mention any specific challenges or insecurities',
      'Context about your lifestyle helps'
    ],
    event: [
      'Mention the specific event and setting',
      'Include the event date for urgency',
      'Show outfit options or describe dress code',
      'Mention who else will be there'
    ]
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Get Better Results
        </h2>
        <p className="text-lg text-gray-600">
          Follow these tips to get the most helpful feedback
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          For {goal.title.toLowerCase()}:
        </h3>
        
        <div className="space-y-3">
          {tips[goal.id as keyof typeof tips]?.map((tip, index) => (
            <div key={index} className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Target className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-indigo-800 mb-1">Quality Prediction</h4>
            <p className="text-indigo-700 text-sm">
              Following these guidelines typically results in 8.5+ rated verdicts 
              with actionable, specific feedback you can implement immediately.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        I'm Ready to Upload
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function SmartOnboarding({ onComplete }: { onComplete: (goal: OnboardingGoal) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(null);

  const handleGoalSelect = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    setCurrentStep(2);
  };

  const handleContinue = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3 && selectedGoal) {
      onComplete(selectedGoal);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">
            Step {currentStep} of 3 • Takes 2 minutes
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentStep === 1 && <GoalSelection onSelect={handleGoalSelect} />}
          {currentStep === 2 && selectedGoal && (
            <SuccessPreview goal={selectedGoal} onContinue={handleContinue} />
          )}
          {currentStep === 3 && selectedGoal && (
            <UploadGuidance goal={selectedGoal} onContinue={handleContinue} />
          )}
        </div>
      </div>
    </div>
  );
}