'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TouchButton } from '@/components/ui/touch-button';
import { 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
  Clock,
  Shield,
  Users,
  CheckCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Send,
  Heart,
  TrendingUp,
  Eye
} from 'lucide-react';

// Demo data for the interactive walkthrough
const DEMO_STEPS = [
  {
    id: 1,
    title: "Ask Your Question",
    subtitle: "Upload an image or write your dilemma",
    description: "No signup required. Just describe what you need help with.",
    mockups: {
      mobile: (
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What do you need feedback on?</h3>
          </div>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center bg-indigo-50/50 cursor-pointer hover:bg-indigo-100/50 transition-colors">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Drop image here or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
            </div>
            <textarea 
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Or describe your situation..."
              rows={3}
            />
            <TouchButton className="w-full bg-indigo-600 text-white">
              Get 3 comprehensive reports → 
            </TouchButton>
          </div>
        </div>
      )
    },
    features: ["No account needed", "100% anonymous", "Upload images or text"]
  },
  {
    id: 2,
    title: "Vetted Reviewers Respond",
    subtitle: "3 verified people give honest feedback",
    description: "Your request goes to our pool of quality-rated reviewers who provide thoughtful responses.",
    mockups: {
      mobile: (
        <div className="bg-gray-50 rounded-2xl p-4 max-w-sm mx-auto">
          <div className="bg-white rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                J1
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Reviewer analyzing...</div>
                <div className="text-sm text-gray-500">Fashion expert • 4.8★ rating</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-2 flex-1 bg-indigo-600 rounded-full animate-pulse" />
              <div className="h-2 flex-1 bg-gray-200 rounded-full" />
              <div className="h-2 flex-1 bg-gray-200 rounded-full" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 mb-3 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                J2
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Waiting...</div>
                <div className="text-sm text-gray-500">Career advisor • 4.9★ rating</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 opacity-40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                J3
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Waiting...</div>
                <div className="text-sm text-gray-500">Life coach • 5.0★ rating</div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Average response time: 47 minutes
          </div>
        </div>
      )
    },
    features: ["Quality-rated reviewers", "Diverse perspectives", "Fast responses"]
  },
  {
    id: 3,
    title: "Get Your Verdict",
    subtitle: "Read all 3 comprehensive reports and decide",
    description: "Receive thoughtful, detailed feedback that helps you make better decisions.",
    mockups: {
      mobile: (
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your verdicts are ready!</h3>
            <p className="text-sm text-gray-600">3 reviewers have responded</p>
          </div>
          
          <div className="space-y-3">
            {[
              { score: 9, text: "Love the professional look! The blue tie really complements..." },
              { score: 8, text: "Great choice for finance. Consider a slightly more subtle..." },
              { score: 10, text: "Perfect! Shows you're serious about the role. Confidence is..." }
            ].map((verdict, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`w-3 h-3 ${j < Math.floor(verdict.score / 2) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{verdict.score}/10</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{verdict.text}</p>
                <button 
                  className="text-xs text-indigo-600 font-medium mt-2"
                  aria-label="Read full verdict text"
                >
                  Read full verdict →
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall verdict:</span>
              <span className="font-bold text-green-600">Highly recommended!</span>
            </div>
          </div>
        </div>
      )
    },
    features: ["Detailed feedback", "Multiple perspectives", "Clear recommendations"]
  }
];

// Interactive demo stats
const LIVE_STATS = [
  { icon: Users, value: "2,847", label: "Verdicts delivered" },
  { icon: Clock, value: "47min", label: "Avg response time" },
  { icon: Star, value: "4.9/5", label: "Judge rating" },
  { icon: Shield, value: "100%", label: "Anonymous" }
];

export function ProductDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setActiveStep((step) => (step + 1) % DEMO_STEPS.length);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, activeStep]);

  const currentStep = DEMO_STEPS[activeStep];

  return (
    <section id="product-demo" className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <Eye className="w-3 h-3 mr-1" />
            Interactive Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See AskVerdict in action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how easy it is to get honest feedback on your toughest decisions
          </p>
        </div>

        {/* Interactive demo container */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Device mockup */}
              <div className="relative">
                <div className="relative mx-auto" style={{ maxWidth: '375px' }}>
                  {/* Phone frame */}
                  <div className="relative bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-8 bg-gray-900 rounded-t-[2.5rem]">
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-2 w-20 h-4 bg-black rounded-full" />
                    </div>
                    <div className="bg-white rounded-[2rem] overflow-hidden mt-4">
                      {/* Status bar */}
                      <div className="bg-gray-100 px-6 py-2 flex items-center justify-between text-xs text-gray-600">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-3 bg-gray-600 rounded-sm" />
                          <div className="w-4 h-3 bg-gray-600 rounded-sm" />
                          <div className="w-6 h-3 bg-gray-600 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* App content */}
                      <div className="relative h-[600px] overflow-hidden bg-gray-50">
                        <div className="absolute inset-0 transition-opacity duration-500">
                          {currentStep.mockups.mobile}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating badges */}
                  <div className="absolute -right-4 top-20 bg-white rounded-xl shadow-lg p-3 animate-float">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">No signup</span>
                    </div>
                  </div>
                  
                  <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-lg p-3 animate-float animation-delay-2000">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-medium">100% Anonymous</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Step details */}
              <div>
                <div className="mb-8">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-6">
                    {DEMO_STEPS.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          setActiveStep(index);
                          setProgress(0);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                          index === activeStep
                            ? 'bg-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className="font-medium">{step.id}</span>
                        {index === activeStep && (
                          <span className="text-sm">{step.title}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Step content */}
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStep.title}
                  </h3>
                  <p className="text-xl text-indigo-600 font-medium mb-4">
                    {currentStep.subtitle}
                  </p>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {currentStep.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-3">
                    {currentStep.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-4">
                  <TouchButton
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </TouchButton>
                  
                  <div className="flex items-center gap-2">
                    <TouchButton
                      onClick={() => {
                        setActiveStep((prev) => (prev - 1 + DEMO_STEPS.length) % DEMO_STEPS.length);
                        setProgress(0);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </TouchButton>
                    <TouchButton
                      onClick={() => {
                        setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
                        setProgress(0);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </TouchButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live stats */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {LIVE_STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform"
                >
                  <Icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* CTA section */}
          <div className="text-center mt-12">
            <TouchButton
              onClick={() => window.location.href = '/submit'}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl"
            >
              Try it yourself - Start Free with 3 Credits
              <ChevronRight className="ml-2 w-5 h-5" />
            </TouchButton>
            <p className="mt-4 text-sm text-gray-600">
              No credit card required • 100% anonymous • Results in 47 minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}