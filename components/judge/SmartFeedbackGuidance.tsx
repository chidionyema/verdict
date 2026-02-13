'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CharacterGuidanceProps {
  value: string;
  minLength: number;
  goodLength: number;
  excellentLength: number;
  maxLength: number;
  fieldName?: string;
}

/**
 * Progressive character counter with visual feedback
 */
export function CharacterGuidance({
  value,
  minLength,
  goodLength,
  excellentLength,
  maxLength,
  fieldName = 'feedback',
}: CharacterGuidanceProps) {
  const length = value.length;
  const isEmpty = length === 0;

  const getStatus = () => {
    if (isEmpty) return { color: 'gray', label: 'Not started', message: `Write at least ${minLength} characters to submit` };
    if (length < minLength) return { color: 'red', label: 'Too short', message: `Need ${minLength - length} more characters` };
    if (length < goodLength) return { color: 'yellow', label: 'Good start', message: 'Add more detail for better quality' };
    if (length < excellentLength) return { color: 'blue', label: 'Good', message: 'Nice work! A bit more detail helps' };
    return { color: 'green', label: 'Excellent', message: 'Great detailed feedback!' };
  };

  const status = getStatus();
  const percentage = Math.min((length / excellentLength) * 100, 100);

  const colorClasses = {
    gray: { bg: 'bg-gray-300', text: 'text-gray-500', border: 'border-gray-300' },
    red: { bg: 'bg-red-400', text: 'text-red-600', border: 'border-red-300' },
    yellow: { bg: 'bg-amber-400', text: 'text-amber-600', border: 'border-amber-300' },
    blue: { bg: 'bg-blue-400', text: 'text-blue-600', border: 'border-blue-300' },
    green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300' },
  };

  const colors = colorClasses[status.color as keyof typeof colorClasses];

  return (
    <div className="mt-2 space-y-2">
      {/* Initial state hint - more prominent */}
      {isEmpty && (
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-700 flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
            <span><strong>Minimum {minLength} characters</strong> required. Aim for {excellentLength}+ for excellent quality.</span>
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${colors.bg} rounded-full`}
          />
        </div>
        <span className={`text-sm font-medium ${colors.text}`}>
          {length}/{maxLength}
        </span>
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1 ${colors.text}`}>
          {length >= minLength ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {status.message}
        </span>
        {length >= minLength && (
          <span className="text-green-600 font-medium">Ready to submit</span>
        )}
      </div>

      {/* Quality milestones - always visible */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span className={length >= minLength ? 'text-green-500 font-medium' : ''}>
          {minLength} min
        </span>
        <span className="text-gray-300">→</span>
        <span className={length >= goodLength ? 'text-green-500 font-medium' : ''}>
          {goodLength} good
        </span>
        <span className="text-gray-300">→</span>
        <span className={length >= excellentLength ? 'text-green-500 font-medium' : ''}>
          {excellentLength}+ excellent
        </span>
      </div>
    </div>
  );
}

interface TonePreSelectorProps {
  requestedTone?: string;
  selectedTone: 'honest' | 'constructive' | 'encouraging';
  onToneChange: (tone: 'honest' | 'constructive' | 'encouraging') => void;
}

/**
 * Tone selector that pre-selects based on requested tone with visual guidance
 */
export function TonePreSelector({
  requestedTone,
  selectedTone,
  onToneChange,
}: TonePreSelectorProps) {
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);

  // Map requested tones to form tones
  const getRecommendedTone = (): 'honest' | 'constructive' | 'encouraging' | null => {
    if (!requestedTone) return null;
    if (requestedTone === 'encouraging') return 'encouraging';
    if (requestedTone === 'brutally_honest') return 'honest';
    if (requestedTone === 'honest' || requestedTone === 'direct') return 'constructive';
    return null;
  };

  const recommendedTone = getRecommendedTone();

  // Check for mismatch
  useEffect(() => {
    if (!recommendedTone) {
      setShowMismatchWarning(false);
      return;
    }

    const isMismatch =
      (recommendedTone === 'encouraging' && selectedTone === 'honest') ||
      (recommendedTone === 'honest' && selectedTone === 'encouraging');

    setShowMismatchWarning(isMismatch);
  }, [recommendedTone, selectedTone]);

  const toneOptions = [
    {
      value: 'honest' as const,
      label: 'Honest',
      description: 'Direct and straightforward',
      color: 'blue',
      emoji: '💬',
    },
    {
      value: 'constructive' as const,
      label: 'Constructive',
      description: 'Balanced with actionable advice',
      color: 'amber',
      emoji: '🎯',
    },
    {
      value: 'encouraging' as const,
      label: 'Encouraging',
      description: 'Supportive and positive',
      color: 'green',
      emoji: '💪',
    },
  ];

  const getColorClasses = (tone: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-100 text-blue-700 border-blue-500 ring-2 ring-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300',
      amber: isSelected ? 'bg-amber-100 text-amber-700 border-amber-500 ring-2 ring-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:border-amber-300',
      green: isSelected ? 'bg-green-100 text-green-700 border-green-500 ring-2 ring-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-300',
    };
    return colors[tone as keyof typeof colors];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Feedback Tone
        </label>
        {recommendedTone && (
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Requested: {requestedTone === 'brutally_honest' ? 'Brutally honest' : requestedTone}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onToneChange(option.value)}
            className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${getColorClasses(option.color, selectedTone === option.value)}`}
          >
            {recommendedTone === option.value && (
              <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                Suggested
              </span>
            )}
            <div className="text-center">
              <span className="text-lg">{option.emoji}</span>
              <p className="font-medium text-sm mt-1">{option.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showMismatchWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                The requester asked for <strong>{requestedTone === 'brutally_honest' ? 'brutally honest' : requestedTone}</strong> feedback.
                Your current tone selection may not match their preference.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
}

interface ResponseTemplatesProps {
  category: string;
  verdictType: 'standard' | 'comparison' | 'split_test';
  onSelectTemplate: (template: string) => void;
}

/**
 * Response templates for common feedback patterns
 */
export function ResponseTemplates({
  category,
  verdictType,
  onSelectTemplate,
}: ResponseTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTemplates = (): ResponseTemplate[] => {
    if (verdictType === 'comparison') {
      return [
        {
          id: 'comp-clear-winner',
          name: 'Clear Winner',
          category: 'comparison',
          template: 'I recommend Option [A/B] because [main reason]. While Option [other] has [strength], Option [chosen] better fits your goal of [goal] because [specific reason]. My confidence is high because [evidence].',
        },
        {
          id: 'comp-close-call',
          name: 'Close Decision',
          category: 'comparison',
          template: 'This is close, but I lean toward Option [A/B]. Both options have merit: [Option A strength] vs [Option B strength]. The deciding factor for me is [key differentiator]. Consider your [timeframe/budget/priority] when making the final call.',
        },
        {
          id: 'comp-context-matters',
          name: 'Context Dependent',
          category: 'comparison',
          template: 'My recommendation depends on your priority. If [scenario 1], go with Option [A]. If [scenario 2], Option [B] is better. Given your stated goals of [goals], I lean toward [choice] because [reason].',
        },
      ];
    }

    if (verdictType === 'split_test') {
      return [
        {
          id: 'split-clear',
          name: 'Clear Winner',
          category: 'split_test',
          template: 'Variant [A/B] is the clear winner. It [outperforms/achieves] the success criteria by [how]. The hypothesis is [supported/not supported] because [evidence]. Key factors: [list 2-3 factors].',
        },
        {
          id: 'split-tie',
          name: 'Too Close to Call',
          category: 'split_test',
          template: 'Both variants perform similarly. Variant A excels at [strength A] while Variant B excels at [strength B]. The hypothesis is [inconclusive] because [reason]. Recommendation: [next steps to get clarity].',
        },
        {
          id: 'split-insights',
          name: 'With Insights',
          category: 'split_test',
          template: 'Winner: Variant [A/B]. The hypothesis is [validation status]. Key insight: [unexpected finding]. To improve further, consider [recommendation]. The winning variant succeeds because [specific reason].',
        },
      ];
    }

    // Standard verdict templates by category
    const categoryTemplates: Record<string, ResponseTemplate[]> = {
      appearance: [
        {
          id: 'app-positive',
          name: 'Positive Feedback',
          category: 'appearance',
          template: 'This looks [adjective]! The [specific element] works really well because [reason]. One small suggestion: [minor improvement]. Overall, you should feel confident about [conclusion].',
        },
        {
          id: 'app-constructive',
          name: 'Constructive Critique',
          category: 'appearance',
          template: 'I see potential here. The [positive element] is working, but [area for improvement] could be enhanced by [specific suggestion]. Consider [actionable next step]. This would help [benefit].',
        },
        {
          id: 'app-direct',
          name: 'Direct Assessment',
          category: 'appearance',
          template: 'My honest take: [main observation]. What works: [positive]. What doesn\'t: [negative]. To improve, I\'d [specific action]. The key thing to focus on is [priority].',
        },
      ],
      profile: [
        {
          id: 'prof-dating',
          name: 'Dating Profile',
          category: 'profile',
          template: 'Your profile [overall impression]. Strong points: [what works]. To improve: [specific suggestion]. The key is [main advice]. This will help you attract [target outcome].',
        },
        {
          id: 'prof-professional',
          name: 'Professional Profile',
          category: 'profile',
          template: 'Overall impression: [assessment]. Your [section] effectively shows [strength]. Consider [improvement] in the [section] to better highlight [quality]. This positions you well for [goal].',
        },
      ],
      writing: [
        {
          id: 'writ-feedback',
          name: 'Writing Feedback',
          category: 'writing',
          template: 'Your writing [overall assessment]. Strengths: [what works well]. The [section/aspect] could be stronger by [suggestion]. Key revision: [most important change]. This will make it more [outcome].',
        },
      ],
      decision: [
        {
          id: 'dec-recommendation',
          name: 'Decision Help',
          category: 'decision',
          template: 'Based on your context, I recommend [choice]. Key reasons: 1) [reason 1], 2) [reason 2]. Potential downside to consider: [caveat]. Overall, this aligns with your goal of [goal].',
        },
      ],
    };

    return categoryTemplates[category] || categoryTemplates.appearance;
  };

  const templates = getTemplates();

  const handleCopy = (template: ResponseTemplate) => {
    onSelectTemplate(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">Response Templates</span>
          <span className="text-xs text-gray-400">(click to use as starting point)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 border-t border-gray-200">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{template.name}</span>
                    <button
                      onClick={() => handleCopy(template)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="h-3 w-3" />
                          Inserted!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Use this
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {template.template}
                  </p>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 text-center">
                Replace [brackets] with your specific details
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InlineHelpProps {
  topic: 'rating' | 'tone' | 'feedback' | 'strengths' | 'reasoning';
}

/**
 * Contextual inline help tooltips
 */
export function InlineHelp({ topic }: InlineHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent: Record<string, { title: string; tips: string[] }> = {
    rating: {
      title: 'Rating Guide',
      tips: [
        '1-3: Major issues, needs significant work',
        '4-6: Mixed results, some improvements needed',
        '7-8: Good overall, minor adjustments',
        '9-10: Excellent, meets/exceeds expectations',
      ],
    },
    tone: {
      title: 'Choosing Your Tone',
      tips: [
        'Honest: Direct and straightforward, no sugar-coating',
        'Constructive: Balanced criticism with actionable advice',
        'Encouraging: Focus on positives while gently noting improvements',
        'Match the requester\'s preference when possible',
      ],
    },
    feedback: {
      title: 'Writing Great Feedback',
      tips: [
        'Start with your main recommendation',
        'Give 2-3 specific reasons',
        'Tie feedback to their stated context',
        'End with one actionable next step',
      ],
    },
    strengths: {
      title: 'Identifying Strengths',
      tips: [
        'What catches your attention positively?',
        'What would you keep if you were them?',
        'What differentiates this from weaker options?',
        'Be specific—vague praise isn\'t helpful',
      ],
    },
    reasoning: {
      title: 'Explaining Your Reasoning',
      tips: [
        'State your conclusion clearly first',
        'Explain the key factors that led to your decision',
        'Acknowledge trade-offs you considered',
        'Share relevant experience if applicable',
      ],
    },
  };

  const content = helpContent[topic];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
        aria-label={`Help for ${topic}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 left-0 top-full mt-1 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{content.title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ×
              </button>
            </div>
            <ul className="space-y-1.5">
              {content.tips.map((tip, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength: number;
  goodLength: number;
  excellentLength: number;
  maxLength: number;
  rows?: number;
  category?: string;
  verdictType?: 'standard' | 'comparison' | 'split_test';
  showTemplates?: boolean;
  helpTopic?: 'rating' | 'tone' | 'feedback' | 'strengths' | 'reasoning';
  label?: string;
}

/**
 * Enhanced textarea with all smart guidance features
 */
export function SmartTextarea({
  value,
  onChange,
  placeholder,
  minLength,
  goodLength,
  excellentLength,
  maxLength,
  rows = 5,
  category = 'appearance',
  verdictType = 'standard',
  showTemplates = false,
  helpTopic,
  label,
}: SmartTextareaProps) {
  const getBorderColor = () => {
    if (value.length === 0) return 'border-gray-300';
    if (value.length < minLength) return 'border-red-300';
    if (value.length < goodLength) return 'border-amber-300';
    return 'border-green-300';
  };

  const handleTemplateSelect = (template: string) => {
    // If there's existing content, append template. Otherwise, replace.
    if (value.trim()) {
      onChange(value + '\n\n' + template);
    } else {
      onChange(template);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          {helpTopic && <InlineHelp topic={helpTopic} />}
        </div>
      )}

      {showTemplates && (
        <ResponseTemplates
          category={category}
          verdictType={verdictType}
          onSelectTemplate={handleTemplateSelect}
        />
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${getBorderColor()}`}
      />

      <CharacterGuidance
        value={value}
        minLength={minLength}
        goodLength={goodLength}
        excellentLength={excellentLength}
        maxLength={maxLength}
      />
    </div>
  );
}
