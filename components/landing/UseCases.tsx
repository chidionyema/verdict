'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Briefcase,
  Shirt,
  Mail,
  Camera,
  Lightbulb,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UseCase {
  id: string;
  icon: typeof Heart;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const USE_CASES: UseCase[] = [
  {
    id: 'dating',
    icon: Heart,
    emoji: '💕',
    title: 'Dating Profile Review',
    subtitle: 'Get more matches',
    description: 'Find out which photos actually work and what your bio says about you',
    examples: [
      'Which photo should be my main?',
      'Is my bio interesting or cringey?',
      'Do I look approachable?'
    ],
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  {
    id: 'career',
    icon: Briefcase,
    emoji: '💼',
    title: 'Career Decisions',
    subtitle: 'Make the right move',
    description: 'Get unbiased perspectives on job offers, salary negotiations, and career pivots',
    examples: [
      'Should I take this job offer?',
      'Is my salary fair?',
      'How do I negotiate better?'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'style',
    icon: Shirt,
    emoji: '👔',
    title: 'Outfit Check',
    subtitle: 'Look your best',
    description: 'Get honest feedback on what you\'re wearing before that important moment',
    examples: [
      'Is this interview-appropriate?',
      'Does this outfit work for a first date?',
      'Wedding guest - formal enough?'
    ],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    id: 'business',
    icon: Lightbulb,
    emoji: '💡',
    title: 'Business Ideas',
    subtitle: 'Validate before you build',
    description: 'Test your pitch, landing page, or business idea with real people',
    examples: [
      'Does this pitch make sense?',
      'Would you use this product?',
      'What\'s missing from my landing page?'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

interface UseCasesProps {
  variant?: 'grid' | 'tabs' | 'minimal';
  showCTA?: boolean;
  onCTAClick?: () => void;
  className?: string;
}

export function UseCases({
  variant = 'grid',
  showCTA = true,
  onCTAClick,
  className
}: UseCasesProps) {
  const [activeTab, setActiveTab] = useState(USE_CASES[0].id);

  if (variant === 'minimal') {
    return (
      <div className={cn("flex flex-wrap justify-center gap-3", className)}>
        {USE_CASES.map((useCase) => (
          <div
            key={useCase.id}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border",
              useCase.bgColor,
              useCase.borderColor
            )}
          >
            <span className="text-lg">{useCase.emoji}</span>
            <span className={cn("text-sm font-medium", useCase.color)}>
              {useCase.title}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'tabs') {
    const activeUseCase = USE_CASES.find(uc => uc.id === activeTab) || USE_CASES[0];

    return (
      <section className={cn("py-16", className)}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What can you get feedback on?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Anything you need honest opinions about
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {USE_CASES.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setActiveTab(useCase.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                activeTab === useCase.id
                  ? cn(useCase.bgColor, useCase.color, "shadow-md")
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="text-lg">{useCase.emoji}</span>
              <span className="hidden sm:inline">{useCase.title}</span>
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "max-w-3xl mx-auto rounded-2xl p-8 border-2",
            activeUseCase.bgColor,
            activeUseCase.borderColor
          )}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-white shadow-md"
            )}>
              <activeUseCase.icon className={cn("w-7 h-7", activeUseCase.color)} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {activeUseCase.title}
              </h3>
              <p className="text-gray-600">{activeUseCase.description}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700">Common questions:</p>
            {activeUseCase.examples.map((example, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/80 rounded-lg p-3">
                <CheckCircle className={cn("w-5 h-5", activeUseCase.color)} />
                <span className="text-gray-700">{example}</span>
              </div>
            ))}
          </div>

          {showCTA && (
            <button
              onClick={onCTAClick}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg",
                "bg-gradient-to-r",
                activeUseCase.id === 'dating' && "from-pink-500 to-rose-500",
                activeUseCase.id === 'career' && "from-blue-500 to-indigo-500",
                activeUseCase.id === 'style' && "from-emerald-500 to-teal-500",
                activeUseCase.id === 'business' && "from-purple-500 to-violet-500"
              )}
            >
              Get {activeUseCase.title} Feedback
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </motion.div>
      </section>
    );
  }

  // Grid variant (default)
  return (
    <section className={cn("py-16", className)}>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          What can you get feedback on?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Anything you need honest opinions about
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {USE_CASES.map((useCase, index) => (
          <motion.div
            key={useCase.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer group",
              useCase.bgColor,
              useCase.borderColor
            )}
            onClick={onCTAClick}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm",
                "group-hover:scale-110 transition-transform"
              )}>
                <useCase.icon className={cn("w-6 h-6", useCase.color)} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {useCase.title}
                </h3>
                <p className="text-sm text-gray-600">{useCase.subtitle}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{useCase.description}</p>

            <div className="flex flex-wrap gap-2">
              {useCase.examples.slice(0, 2).map((example, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/80 px-3 py-1 rounded-full text-gray-600"
                >
                  {example}
                </span>
              ))}
            </div>

            <div className={cn(
              "mt-4 flex items-center gap-1 text-sm font-medium",
              useCase.color,
              "group-hover:gap-2 transition-all"
            )}>
              Get feedback
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default UseCases;
