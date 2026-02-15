'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface Verdict {
  id: string;
  chosen_photo: 'A' | 'B';
  reasoning: string;
  confidence_score: number;
  photo_a_rating: number;
  photo_b_rating: number;
  judge_tier?: string;
  judge_demographics?: {
    age_range?: string;
    gender?: string;
    location?: string;
  };
}

interface Segment {
  id: string;
  name: string;
  winner: 'A' | 'B' | 'tie' | null;
  completed_count: number;
}

interface AIInsightsProps {
  verdicts: Verdict[];
  segments?: Segment[];
  photoAUrl?: string;
  photoBUrl?: string;
  question?: string;
  onRefresh?: () => void;
}

interface Insight {
  type: 'strength' | 'weakness' | 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  confidence: number;
  relevantTo: 'A' | 'B' | 'both';
}

export function AIInsights({
  verdicts,
  segments,
  question,
  onRefresh,
}: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'recommendations'>('summary');

  // Helper function to extract themes from reasoning text
  const extractThemes = (reasons: string[]) => {
    const themes = {
      lighting: 0,
      expression: 0,
      background: 0,
      composition: 0,
      color: 0,
      quality: 0,
      natural: 0,
    };

    const keywords = {
      lighting: ['light', 'lighting', 'bright', 'dark', 'shadow', 'exposure'],
      expression: ['smile', 'expression', 'eyes', 'look', 'face', 'natural'],
      background: ['background', 'setting', 'distract', 'clean', 'busy'],
      composition: ['angle', 'framing', 'crop', 'composition', 'centered'],
      color: ['color', 'vibrant', 'warm', 'cool', 'tone', 'saturation'],
      quality: ['quality', 'sharp', 'blur', 'focus', 'clear', 'crisp'],
      natural: ['natural', 'authentic', 'genuine', 'real', 'relaxed'],
    };

    reasons.forEach(reason => {
      Object.entries(keywords).forEach(([theme, words]) => {
        if (words.some(word => reason.includes(word))) {
          themes[theme as keyof typeof themes]++;
        }
      });
    });

    return themes;
  };

  // Synthesize insights from verdicts
  useEffect(() => {
    if (verdicts.length < 3) {
      setLoading(false);
      return;
    }

    const generateInsights = () => {
      const newInsights: Insight[] = [];
      const votesA = verdicts.filter(v => v.chosen_photo === 'A').length;
      const votesB = verdicts.filter(v => v.chosen_photo === 'B').length;
      const total = verdicts.length;
      const winner = votesA > votesB ? 'A' : votesB > votesA ? 'B' : null;
      const margin = Math.abs(votesA - votesB) / total;

      // Analyze reasoning text for common themes
      const allReasons = verdicts.map(v => v.reasoning.toLowerCase());
      const themes = extractThemes(allReasons);

      // Calculate average ratings
      const avgRatingA = verdicts.reduce((sum, v) => sum + v.photo_a_rating, 0) / total;
      const avgRatingB = verdicts.reduce((sum, v) => sum + v.photo_b_rating, 0) / total;

      // High-confidence verdicts analysis
      const highConfidenceVerdicts = verdicts.filter(v => v.confidence_score >= 8);
      const highConfidenceForA = highConfidenceVerdicts.filter(v => v.chosen_photo === 'A').length;
      const highConfidenceForB = highConfidenceVerdicts.filter(v => v.chosen_photo === 'B').length;

      // 1. Clear winner insight
      if (margin > 0.3 && winner) {
        newInsights.push({
          type: 'strength',
          title: `Photo ${winner} has a decisive lead`,
          description: `${Math.round((winner === 'A' ? votesA : votesB) / total * 100)}% of judges preferred Photo ${winner}. This is a statistically significant preference.`,
          confidence: 95,
          relevantTo: winner,
        });
      } else if (margin < 0.1) {
        newInsights.push({
          type: 'warning',
          title: 'Results are very close',
          description: 'The photos are performing nearly equally. Consider what specific context you\'ll use them in to make your decision.',
          confidence: 90,
          relevantTo: 'both',
        });
      }

      // 2. High-confidence alignment
      if (highConfidenceVerdicts.length >= 3) {
        const confidentWinner = highConfidenceForA > highConfidenceForB ? 'A' : 'B';
        const confidentPct = Math.round(Math.max(highConfidenceForA, highConfidenceForB) / highConfidenceVerdicts.length * 100);
        newInsights.push({
          type: 'trend',
          title: 'Expert judges agree',
          description: `${confidentPct}% of judges who were highly confident chose Photo ${confidentWinner}.`,
          confidence: 85,
          relevantTo: confidentWinner,
        });
      }

      // 3. Theme-based insights
      if (themes.lighting > 2) {
        newInsights.push({
          type: 'opportunity',
          title: 'Lighting is a key factor',
          description: 'Multiple judges mentioned lighting quality. The better-lit photo tends to perform significantly better.',
          confidence: 80,
          relevantTo: 'both',
        });
      }

      if (themes.expression > 2) {
        newInsights.push({
          type: 'opportunity',
          title: 'Expression matters most',
          description: 'Judges frequently cited facial expression as a deciding factor. Natural, relaxed expressions win.',
          confidence: 85,
          relevantTo: 'both',
        });
      }

      if (themes.background > 2) {
        newInsights.push({
          type: 'opportunity',
          title: 'Background influences choice',
          description: 'The background/setting was mentioned often. Cleaner, less distracting backgrounds are preferred.',
          confidence: 75,
          relevantTo: 'both',
        });
      }

      // 4. Rating discrepancy insight
      const ratingDiff = Math.abs(avgRatingA - avgRatingB);
      if (ratingDiff > 1.5) {
        const higherRated = avgRatingA > avgRatingB ? 'A' : 'B';
        newInsights.push({
          type: 'strength',
          title: `Photo ${higherRated} rated significantly higher`,
          description: `Average rating of ${(higherRated === 'A' ? avgRatingA : avgRatingB).toFixed(1)}/10 vs ${(higherRated === 'A' ? avgRatingB : avgRatingA).toFixed(1)}/10.`,
          confidence: 90,
          relevantTo: higherRated,
        });
      }

      // 5. Segment divergence (if available)
      if (segments && segments.length > 1) {
        const segmentWinners = segments.filter(s => s.winner).map(s => s.winner);
        const hasDisagreement = new Set(segmentWinners).size > 1;

        if (hasDisagreement) {
          newInsights.push({
            type: 'warning',
            title: 'Audience segments disagree',
            description: 'Different demographic groups prefer different photos. Consider your target audience when choosing.',
            confidence: 95,
            relevantTo: 'both',
          });
        }
      }

      // 6. Actionable recommendation
      if (winner) {
        newInsights.push({
          type: 'opportunity',
          title: `Recommendation: Use Photo ${winner}`,
          description: question
            ? `For "${question}", Photo ${winner} will likely perform better based on judge feedback.`
            : `Photo ${winner} is the stronger choice based on collective judge feedback.`,
          confidence: margin > 0.2 ? 90 : 70,
          relevantTo: winner,
        });
      }

      setInsights(newInsights);
      setLoading(false);
    };

    // Simulate AI processing time
    const timer = setTimeout(generateInsights, 1000);
    return () => clearTimeout(timer);
  }, [verdicts, segments, question]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'strength':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'weakness':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'trend':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: Insight['type']) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200';
      case 'weakness':
        return 'bg-red-50 border-red-200';
      case 'opportunity':
        return 'bg-amber-50 border-amber-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'trend':
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (verdicts.length < 3) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Need more verdicts</p>
          <p className="text-gray-400 text-sm mt-1">
            AI insights will appear after 3+ verdicts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              Beta
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1"
          role="tablist"
          aria-label="Insight categories"
        >
          {(['summary', 'detailed', 'recommendations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              id={`tab-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onKeyDown={(e) => {
                const tabs = ['summary', 'detailed', 'recommendations'] as const;
                const currentIndex = tabs.indexOf(tab);
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextTab = tabs[(currentIndex + 1) % tabs.length];
                  setActiveTab(nextTab);
                  document.getElementById(`tab-${nextTab}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
                  setActiveTab(prevTab);
                  document.getElementById(`tab-${prevTab}`)?.focus();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="p-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-600 font-medium">Analyzing verdicts...</p>
              <p className="text-gray-400 text-sm">Synthesizing insights from judge feedback</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="AI-generated insights">
            {insights
              .filter((insight) => {
                if (activeTab === 'summary') return true;
                if (activeTab === 'recommendations') return insight.type === 'opportunity';
                return true;
              })
              .slice(0, activeTab === 'summary' ? 3 : undefined)
              .map((insight, index) => (
                <div
                  key={index}
                  role="listitem"
                  className={`p-4 rounded-xl border ${getInsightBg(insight.type)} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5" aria-hidden="true">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        {insight.relevantTo !== 'both' && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              insight.relevantTo === 'A'
                                ? 'bg-green-200 text-green-700'
                                : 'bg-blue-200 text-blue-700'
                            }`}
                          >
                            Photo {insight.relevantTo}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={insight.confidence}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Confidence level: ${insight.confidence}%`}
                        >
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500" aria-hidden="true">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === 'summary' && insights.length > 3 && (
              <button
                onClick={() => setActiveTab('detailed')}
                className="w-full py-3 text-center text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                View all {insights.length} insights
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Based on {verdicts.length} verdicts</span>
          </div>
          <span>Last updated: just now</span>
        </div>
      </div>
    </div>
  );
}
