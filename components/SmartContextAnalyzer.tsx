'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Lightbulb, Target } from 'lucide-react';

interface ContextAnalysis {
  score: number;
  completeness: number;
  clarity: number;
  specificity: number;
  suggestions: string[];
  strengths: string[];
  missing: string[];
  qualityLevel: 'poor' | 'good' | 'excellent';
}

interface SmartContextAnalyzerProps {
  context: string;
  category: string;
  mediaType: 'photo' | 'text';
  onChange?: (analysis: ContextAnalysis) => void;
}

export default function SmartContextAnalyzer({ 
  context, 
  category, 
  mediaType,
  onChange 
}: SmartContextAnalyzerProps) {
  const [analysis, setAnalysis] = useState<ContextAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (context.length < 20) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const newAnalysis = analyzeContext(context, category, mediaType);
      setAnalysis(newAnalysis);
      onChange?.(newAnalysis);
      setIsAnalyzing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [context, category, mediaType, onChange]);

  const analyzeContext = (text: string, cat: string, type: string): ContextAnalysis => {
    const words = text.toLowerCase();
    let score = 0;
    let completeness = 0;
    let clarity = 0;
    let specificity = 0;
    const suggestions: string[] = [];
    const strengths: string[] = [];
    const missing: string[] = [];

    // Length scoring
    if (text.length >= 100) {
      completeness += 40;
      strengths.push('Good detail level');
    } else if (text.length >= 50) {
      completeness += 25;
      suggestions.push('Add more specific details for better feedback');
    } else {
      completeness += 10;
      missing.push('More context needed');
    }

    // Category-specific analysis
    const categoryChecks = {
      appearance: {
        keywords: ['interview', 'date', 'event', 'work', 'occasion', 'style', 'formal', 'casual'],
        questions: ['What is this for?', 'What setting?', 'Who will see you?'],
        specifics: ['event type', 'dress code', 'time of day', 'weather']
      },
      profile: {
        keywords: ['job', 'linkedin', 'career', 'industry', 'position', 'resume', 'professional'],
        questions: ['What industry?', 'What role level?', 'Target audience?'],
        specifics: ['industry', 'job level', 'target companies', 'career goals']
      },
      writing: {
        keywords: ['email', 'message', 'audience', 'tone', 'purpose', 'recipient'],
        questions: ['Who is the audience?', 'What is the goal?', 'What tone?'],
        specifics: ['recipient relationship', 'desired outcome', 'formality level']
      },
      decision: {
        keywords: ['choice', 'option', 'budget', 'timeline', 'priority', 'goal'],
        questions: ['What are the options?', 'What matters most?', 'Timeline?'],
        specifics: ['available options', 'decision criteria', 'constraints']
      }
    };

    const catCheck = categoryChecks[cat as keyof typeof categoryChecks];
    if (catCheck) {
      // Check for category keywords
      const foundKeywords = catCheck.keywords.filter(keyword => words.includes(keyword));
      if (foundKeywords.length > 0) {
        specificity += 20;
        strengths.push(`Good ${cat}-specific context`);
      } else {
        suggestions.push(`Mention specific ${cat} details`);
      }

      // Check for missing specifics
      catCheck.specifics.forEach(spec => {
        const specWords = spec.split(' ');
        const hasSpec = specWords.some(word => words.includes(word));
        if (!hasSpec) {
          missing.push(spec);
        } else {
          specificity += 10;
        }
      });
    }

    // Clarity checks
    if (text.includes('?')) {
      clarity += 15;
      strengths.push('Clear questions help judges focus');
    }

    // Check for emotional context
    const emotionalWords = ['nervous', 'confident', 'worried', 'excited', 'important'];
    if (emotionalWords.some(word => words.includes(word))) {
      clarity += 15;
      strengths.push('Emotional context helps judges understand stakes');
    }

    // Check for timeline/urgency
    const timeWords = ['tomorrow', 'next week', 'urgent', 'soon', 'deadline'];
    if (timeWords.some(word => words.includes(word))) {
      specificity += 15;
      strengths.push('Timeline context helps prioritize feedback');
    } else {
      suggestions.push('Mention your timeline for better urgency understanding');
    }

    // Check for specific goals
    const goalWords = ['want to', 'need to', 'hoping to', 'trying to', 'goal is'];
    if (goalWords.some(phrase => words.includes(phrase))) {
      clarity += 20;
      strengths.push('Clear goals help judges give targeted advice');
    } else {
      suggestions.push('State your specific goal or desired outcome');
    }

    // Calculate final scores
    completeness = Math.min(completeness, 100);
    clarity = Math.min(clarity, 100);
    specificity = Math.min(specificity, 100);
    score = Math.round((completeness + clarity + specificity) / 3);

    // Determine quality level
    let qualityLevel: 'poor' | 'good' | 'excellent';
    if (score >= 80) qualityLevel = 'excellent';
    else if (score >= 60) qualityLevel = 'good';
    else qualityLevel = 'poor';

    // Add quality-based suggestions
    if (qualityLevel === 'poor') {
      suggestions.unshift('This context needs improvement for quality feedback');
    } else if (qualityLevel === 'excellent') {
      strengths.unshift('Excellent context! Judges will give you detailed feedback');
    }

    return {
      score,
      completeness,
      clarity,
      specificity,
      suggestions: suggestions.slice(0, 3),
      strengths: strengths.slice(0, 3),
      missing: missing.slice(0, 3),
      qualityLevel
    };
  };

  if (!context || context.length < 20) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-center text-gray-500">
          <Lightbulb className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Add context to see AI quality analysis...
          </p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Analyzing context quality...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getQualityIcon = (level: string) => {
    if (level === 'excellent') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (level === 'good') return <TrendingUp className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className={`rounded-lg p-4 border ${getScoreBg(analysis.score)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getQualityIcon(analysis.qualityLevel)}
          <h4 className="font-semibold text-gray-900">Context Quality</h4>
        </div>
        <div className={`font-bold text-lg ${getScoreColor(analysis.score)}`}>
          {analysis.score}/100
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="font-semibold text-sm text-gray-600">Completeness</div>
          <div className={`font-bold ${getScoreColor(analysis.completeness)}`}>
            {analysis.completeness}%
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-sm text-gray-600">Clarity</div>
          <div className={`font-bold ${getScoreColor(analysis.clarity)}`}>
            {analysis.clarity}%
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-sm text-gray-600">Specificity</div>
          <div className={`font-bold ${getScoreColor(analysis.specificity)}`}>
            {analysis.specificity}%
          </div>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Strengths</span>
          </div>
          <ul className="space-y-1">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Suggestions</span>
          </div>
          <ul className="space-y-1">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Elements */}
      {analysis.missing.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Consider Adding</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.missing.map((item, index) => (
              <span 
                key={index} 
                className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quality Impact Message */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          {analysis.qualityLevel === 'excellent' && 
            '🎯 Excellent context typically results in 9+ rated verdicts'}
          {analysis.qualityLevel === 'good' && 
            '👍 Good context typically results in 7-8 rated verdicts'}
          {analysis.qualityLevel === 'poor' && 
            '⚠️ Improve context to get higher quality, more specific feedback'}
        </p>
      </div>
    </div>
  );
}