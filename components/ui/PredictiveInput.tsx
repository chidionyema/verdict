'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, Zap, Lightbulb } from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  type: 'completion' | 'template' | 'smart';
  confidence: number;
  context?: string;
  insertPosition?: number;
}

interface PredictiveInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionAccepted?: (suggestion: Suggestion) => void;
  placeholder?: string;
  context?: 'feedback' | 'description' | 'question';
  minLength?: number;
  maxSuggestions?: number;
  enableSmartCompletion?: boolean;
  className?: string;
}

// Common feedback patterns and templates
const FEEDBACK_PATTERNS = {
  positive: [
    'This looks great!',
    'Really solid choice overall.',
    'I love the [specific detail].',
    'This works well because',
    'Strong presentation here.'
  ],
  constructive: [
    'This has potential, but',
    'Consider trying',
    'One suggestion would be to',
    'You might want to',
    'Have you considered'
  ],
  specific: [
    'The lighting could be improved by',
    'The composition would benefit from',
    'The color coordination',
    'The fit looks',
    'The overall impression is'
  ]
};

const QUESTION_STARTERS = [
  'What do you think about',
  'Should I go with',
  'Which option looks better:',
  'Is this appropriate for',
  'How can I improve'
];

const SMART_COMPLETIONS = {
  'dating': [
    'dating app photo',
    'first date outfit',
    'dating profile',
    'casual dating look'
  ],
  'professional': [
    'job interview',
    'work presentation',
    'professional headshot',
    'business meeting'
  ],
  'social': [
    'party outfit',
    'social media post',
    'casual hangout',
    'weekend look'
  ]
};

export function PredictiveInput({
  value,
  onChange,
  onSuggestionAccepted,
  placeholder,
  context = 'feedback',
  minLength = 10,
  maxSuggestions = 5,
  enableSmartCompletion = true,
  className = ''
}: PredictiveInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on current input
  const generateSuggestions = useCallback((input: string, cursor: number) => {
    if (input.length < 3) return [];

    const suggestions: Suggestion[] = [];
    const words = input.toLowerCase().split(' ');
    const currentSentence = input.slice(0, cursor);
    const lastWord = words[words.length - 1];

    // 1. Smart completions based on context
    if (enableSmartCompletion) {
      Object.entries(SMART_COMPLETIONS).forEach(([category, completions]) => {
        if (words.some(word => word.includes(category.slice(0, 4)))) {
          completions.forEach(completion => {
            if (completion.toLowerCase().includes(lastWord) && completion !== lastWord) {
              suggestions.push({
                id: `smart_${completion}`,
                text: completion,
                type: 'smart',
                confidence: 0.8,
                context: `Smart completion for ${category}`
              });
            }
          });
        }
      });
    }

    // 2. Template suggestions for feedback
    if (context === 'feedback') {
      // Detect sentiment to suggest appropriate patterns
      const isPositive = /\b(good|great|love|nice|perfect|excellent)\b/i.test(input);
      const isConstructive = /\b(but|however|consider|suggest|improve|try)\b/i.test(input);

      let patterns = FEEDBACK_PATTERNS.constructive;
      if (isPositive && !isConstructive) {
        patterns = FEEDBACK_PATTERNS.positive;
      } else if (input.length > 30) {
        patterns = FEEDBACK_PATTERNS.specific;
      }

      patterns.forEach(pattern => {
        if (!input.toLowerCase().includes(pattern.toLowerCase().slice(0, 10))) {
          suggestions.push({
            id: `template_${pattern}`,
            text: input + (input.endsWith('.') ? ' ' : '. ') + pattern,
            type: 'template',
            confidence: 0.7,
            context: 'Feedback template'
          });
        }
      });
    }

    // 3. Question completions
    if (context === 'question' || input.includes('?')) {
      QUESTION_STARTERS.forEach(starter => {
        if (starter.toLowerCase().startsWith(lastWord) && starter !== input.trim()) {
          suggestions.push({
            id: `question_${starter}`,
            text: starter,
            type: 'completion',
            confidence: 0.6,
            context: 'Question starter'
          });
        }
      });
    }

    // 4. Auto-complete based on common patterns
    if (lastWord.length > 2) {
      const commonWords = [
        'because', 'however', 'therefore', 'specifically', 'particularly',
        'recommend', 'suggest', 'consider', 'definitely', 'probably'
      ];

      commonWords.forEach(word => {
        if (word.startsWith(lastWord) && word !== lastWord) {
          const beforeCursor = input.slice(0, cursor - lastWord.length);
          suggestions.push({
            id: `completion_${word}`,
            text: beforeCursor + word + input.slice(cursor),
            type: 'completion',
            confidence: 0.5,
            insertPosition: cursor - lastWord.length
          });
        }
      });
    }

    // 5. Smart sentence completion
    if (input.endsWith(' ') && input.length > minLength) {
      const smartCompletions = [
        'This would work better if',
        'I particularly like',
        'One thing to consider is',
        'The main issue I see is',
        'Overall, this is'
      ];

      smartCompletions.forEach(completion => {
        suggestions.push({
          id: `smart_sentence_${completion}`,
          text: input + completion,
          type: 'smart',
          confidence: 0.6,
          context: 'Smart sentence completion'
        });
      });
    }

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }, [context, minLength, maxSuggestions, enableSmartCompletion]);

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(value, cursorPosition);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setSelectedIndex(0);
  }, [value, cursorPosition, generateSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        acceptSuggestion(suggestions[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Accept a suggestion
  const acceptSuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    onSuggestionAccepted?.(suggestion);

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = suggestion.insertPosition ?? suggestion.text.length;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'smart':
        return <Zap className="h-3 w-3 text-blue-500" />;
      case 'template':
        return <Lightbulb className="h-3 w-3 text-yellow-500" />;
      default:
        return <Check className="h-3 w-3 text-green-500" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        rows={5}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lightbulb className="h-3 w-3" />
              <span>Smart suggestions</span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded">Tab</kbd>
              <span>to accept</span>
            </div>
          </div>

          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => acceptSuggestion(suggestion)}
              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                index === selectedIndex ? 'bg-indigo-50 border-indigo-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">
                    {suggestion.type === 'completion' 
                      ? <span>
                          <span className="text-gray-400">{value.slice(0, suggestion.insertPosition || 0)}</span>
                          <span className="font-medium">{suggestion.text.slice(suggestion.insertPosition || 0)}</span>
                        </span>
                      : <span className="font-medium">{
                          suggestion.text.length > 80 
                            ? suggestion.text.slice(0, 80) + '...' 
                            : suggestion.text
                        }</span>
                    }
                  </div>
                  {suggestion.context && (
                    <div className="text-xs text-gray-500 mt-1">{suggestion.context}</div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(suggestion.confidence * 100)}%
                </div>
              </div>
            </button>
          ))}

          <div className="p-2 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              Use ↑↓ to navigate • Enter or Tab to accept • Esc to dismiss
            </div>
          </div>
        </div>
      )}

      {/* Writing assistance indicator */}
      {value.length > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {enableSmartCompletion && (
            <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              <Zap className="h-3 w-3 inline mr-1" />
              AI-assisted
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing writing suggestions across the app
export function useWritingAssistant(context: string) {
  const [suggestionHistory, setSuggestionHistory] = useState<string[]>([]);

  const recordSuggestion = useCallback((suggestion: Suggestion) => {
    setSuggestionHistory(prev => {
      const updated = [suggestion.text, ...prev.slice(0, 9)];
      localStorage.setItem(`writing_history_${context}`, JSON.stringify(updated));
      return updated;
    });
  }, [context]);

  const getSuggestionHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(`writing_history_${context}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [context]);

  useEffect(() => {
    setSuggestionHistory(getSuggestionHistory());
  }, [getSuggestionHistory]);

  return {
    suggestionHistory,
    recordSuggestion
  };
}