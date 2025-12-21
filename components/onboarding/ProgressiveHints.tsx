'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Target, 
  Users, 
  Camera, 
  MessageSquare, 
  X, 
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

interface ProgressiveHintsProps {
  currentStep: number;
  formData: any;
  onHintAction?: (action: string) => void;
}

interface Hint {
  id: string;
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    type: string;
  };
  trigger: (formData: any, step: number) => boolean;
  example?: string;
  color: string;
}

const HINTS: Hint[] = [
  {
    id: 'be_specific',
    icon: Target,
    title: 'Be Specific',
    description: 'The more specific you are about what feedback you want, the better responses you\'ll get.',
    example: 'Instead of "What do you think?" try "Does this photo make me look professional for LinkedIn?"',
    color: 'blue',
    trigger: (formData, step) => step === 0 && formData.context.length < 20,
    action: {
      label: 'See Examples',
      type: 'show_examples'
    }
  },
  {
    id: 'context_matters',
    icon: MessageSquare,
    title: 'Context is Key',
    description: 'Tell reviewers the purpose. Are you using this for dating, work, social media?',
    example: 'Add context like: "This is for my dating profile" or "This is for a job interview"',
    color: 'green',
    trigger: (formData, step) => step === 0 && formData.mediaFiles.length > 0 && !formData.context.toLowerCase().includes('for'),
  },
  {
    id: 'quality_photos',
    icon: Camera,
    title: 'Photo Quality Tips',
    description: 'Clear, well-lit photos get better feedback. Avoid blurry or dark images.',
    color: 'purple',
    trigger: (formData, step) => step === 0 && formData.mediaType === 'photo' && formData.mediaFiles.length === 0,
  },
  {
    id: 'multiple_opinions',
    icon: Users,
    title: 'Why Multiple Opinions?',
    description: 'Getting 3-5 opinions helps you see patterns and get more balanced feedback.',
    color: 'orange',
    trigger: (formData, step) => step === 1,
  },
  {
    id: 'first_submission',
    icon: Star,
    title: 'Your First Request!',
    description: 'You\'re about to get honest feedback from real people. Most users get helpful insights within 2 hours.',
    color: 'indigo',
    trigger: (formData, step) => step === 2 && formData.context.length > 30,
  }
];

export function ProgressiveHints({ currentStep, formData, onHintAction }: ProgressiveHintsProps) {
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [showExamples, setShowExamples] = useState(false);

  // Find the most relevant hint for current context
  useEffect(() => {
    const relevantHint = HINTS.find(hint => 
      !dismissedHints.has(hint.id) && 
      hint.trigger(formData, currentStep)
    );
    
    setActiveHint(relevantHint || null);
  }, [currentStep, formData, dismissedHints]);

  const dismissHint = (hintId: string) => {
    setDismissedHints(prev => new Set([...prev, hintId]));
    setActiveHint(null);
    
    // Save to localStorage to persist across sessions
    const dismissed = Array.from(dismissedHints);
    dismissed.push(hintId);
    localStorage.setItem('verdict_dismissed_hints', JSON.stringify(dismissed));
  };

  const handleHintAction = (action: string) => {
    if (action === 'show_examples') {
      setShowExamples(true);
    }
    onHintAction?.(action);
  };

  // Load dismissed hints on mount
  useEffect(() => {
    const savedDismissed = localStorage.getItem('verdict_dismissed_hints');
    if (savedDismissed) {
      try {
        const dismissed = JSON.parse(savedDismissed);
        setDismissedHints(new Set(dismissed));
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  const examples = [
    {
      category: 'Dating Profiles',
      examples: [
        'Does this photo make me look approachable for dating?',
        'Which photo should I use as my main dating profile picture?',
        'Is this bio too long for a dating app?'
      ]
    },
    {
      category: 'Professional',
      examples: [
        'Does this headshot look professional for LinkedIn?',
        'Is this appropriate to wear to a job interview?',
        'Should I include this project in my portfolio?'
      ]
    },
    {
      category: 'Social Media',
      examples: [
        'Should I post this photo on Instagram?',
        'Does this caption sound engaging?',
        'Which photo gets your attention more?'
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <div className={`bg-gradient-to-r ${
              activeHint.color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
              activeHint.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
              activeHint.color === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
              activeHint.color === 'orange' ? 'from-orange-50 to-orange-100 border-orange-200' :
              'from-indigo-50 to-indigo-100 border-indigo-200'
            } border rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 ${
                  activeHint.color === 'blue' ? 'bg-blue-600' :
                  activeHint.color === 'green' ? 'bg-green-600' :
                  activeHint.color === 'purple' ? 'bg-purple-600' :
                  activeHint.color === 'orange' ? 'bg-orange-600' :
                  'bg-indigo-600'
                } rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <activeHint.icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{activeHint.title}</h4>
                      <p className="text-sm text-gray-700 mb-2">{activeHint.description}</p>
                      
                      {activeHint.example && (
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-600 mb-1">Example:</p>
                          <p className="text-sm text-gray-800 italic">"{activeHint.example}"</p>
                        </div>
                      )}
                      
                      {activeHint.action && (
                        <button
                          onClick={() => handleHintAction(activeHint.action!.type)}
                          className={`text-xs font-medium ${
                            activeHint.color === 'blue' ? 'text-blue-700 hover:text-blue-800' :
                            activeHint.color === 'green' ? 'text-green-700 hover:text-green-800' :
                            activeHint.color === 'purple' ? 'text-purple-700 hover:text-purple-800' :
                            activeHint.color === 'orange' ? 'text-orange-700 hover:text-orange-800' :
                            'text-indigo-700 hover:text-indigo-800'
                          } flex items-center gap-1`}
                        >
                          {activeHint.action.label}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => dismissHint(activeHint.id)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples Modal */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowExamples(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Great Question Examples</h3>
                  <button
                    onClick={() => setShowExamples(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {examples.map((category, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                      <div className="space-y-2">
                        {category.examples.map((example, exIndex) => (
                          <div key={exIndex} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">"{example}"</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    The best questions include <strong>context</strong> (what it's for), 
                    <strong>specific feedback</strong> (what you want to know), and 
                    <strong>options</strong> (if comparing choices).
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}