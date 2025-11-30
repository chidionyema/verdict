'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Star, 
  MessageSquare,
  Clock,
  Camera,
  FileText,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  visual: React.ReactNode;
  duration: number;
}

const DEMO_FEEDBACK_RESPONSES = [
  {
    id: 1,
    rating: 9,
    tone: 'encouraging',
    text: "Love this look! The color combination is perfect and very professional. You'll definitely make a great first impression at the interview.",
    reviewer: "A1"
  },
  {
    id: 2,
    rating: 8,
    tone: 'constructive', 
    text: "Overall great choice! Maybe consider a slightly different tie pattern - something more subtle might be even better for finance.",
    reviewer: "B7"
  },
  {
    id: 3,
    rating: 10,
    tone: 'encouraging',
    text: "Perfect! This outfit shows confidence without being flashy. The fit is spot-on and very appropriate for corporate culture.",
    reviewer: "C3"
  }
];

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "Upload Your Content",
    description: "Share what you need feedback on - photo, text, or decision",
    duration: 2000,
    visual: (
      <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm mb-3">"Should I wear this to my job interview?"</p>
          <div className="w-32 h-24 bg-blue-200 rounded-md mx-auto"></div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Real People Review",
    description: "3 vetted reviewers anonymously provide detailed feedback on your submission",
    duration: 3000,
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
          <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Reviewer A1 providing feedback...</p>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
              <div className="bg-yellow-600 h-2 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-700" />
          </div>
          <p className="text-sm font-medium">Reviewer B7 completed review</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-sm font-medium">Reviewer C3 writing review...</p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Get Detailed Results",
    description: "Receive honest ratings and constructive feedback in minutes",
    duration: 4000,
    visual: (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-semibold text-lg">8.7/10</span>
            </div>
            <Badge className="bg-green-100 text-green-800">Great choice!</Badge>
          </div>
          <div className="space-y-2">
            {DEMO_FEEDBACK_RESPONSES.map((feedback) => (
              <div key={feedback.id} className="text-sm bg-gray-50 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-xs">{feedback.reviewer}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{feedback.rating}/10</span>
                  <Badge variant="outline" className="text-xs">{feedback.tone}</Badge>
                </div>
                <p className="text-gray-700">{feedback.text}</p>
              </div>
            ))}
            <p className="text-xs text-gray-500 text-center pt-2">All 3 comprehensive reports shown</p>
          </div>
        </div>
      </div>
    )
  }
];

export function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setProgress(0);
    
    // Auto-progress through steps
    let stepIndex = 0;
    const progressStep = () => {
      if (stepIndex < DEMO_STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setProgress(0);
        setTimeout(progressStep, DEMO_STEPS[stepIndex].duration);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    };
    
    setTimeout(progressStep, DEMO_STEPS[0].duration);
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
  };

  return (
    <div id="demo" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          See How It Works in 30 Seconds
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Watch a real feedback request from submission to results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Demo Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            {DEMO_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                  ${index <= currentStep 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
                onClick={() => !isPlaying && setCurrentStep(index)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${index <= currentStep
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    
                    {index === currentStep && isPlaying && (
                      <div className="w-full bg-purple-200 rounded-full h-1 mt-2">
                        <div
                          className="bg-purple-600 h-1 rounded-full transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Controls */}
          <div className="flex gap-3">
            {!isPlaying ? (
              <TouchButton
                onClick={startDemo}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </TouchButton>
            ) : (
              <TouchButton
                variant="outline"
                onClick={resetDemo}
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </TouchButton>
            )}
            
            <TouchButton
              variant="outline"
              onClick={resetDemo}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </TouchButton>
          </div>
        </div>

        {/* Demo Visual */}
        <div>
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {DEMO_STEPS[currentStep].title}
                  </h3>
                  <Badge variant="outline">
                    Step {currentStep + 1}/3
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {DEMO_STEPS[currentStep].description}
                </p>
              </div>
              
              <div className="min-h-[300px] flex items-center">
                {DEMO_STEPS[currentStep].visual}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA after demo */}
      {currentStep === DEMO_STEPS.length - 1 && progress === 100 && (
        <div className="text-center mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to get your own feedback?
          </h3>
          <p className="text-gray-600 mb-4">
            Join thousands who've gotten honest feedback in minutes
          </p>
          <TouchButton
            onClick={() => (window.location.href = '/start-simple')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
          >
            Get 3 free requests
            <ArrowRight className="ml-2 w-4 h-4" />
          </TouchButton>
        </div>
      )}
    </div>
  );
}