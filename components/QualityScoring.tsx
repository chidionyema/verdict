'use client';

import { useState, useEffect } from 'react';
import { Camera, FileText, CheckCircle, AlertTriangle, Target, Star, Zap, Eye } from 'lucide-react';

interface QualityMetrics {
  overall: number;
  technical: number;
  context: number;
  clarity: number;
  completeness: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  improvements: QualityImprovement[];
  strengths: string[];
  predictedRating: number;
}

interface QualityImprovement {
  area: string;
  issue: string;
  solution: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  icon: any;
}

interface QualityScoringProps {
  mediaType: 'photo' | 'text';
  content: string | File | null;
  context: string;
  category: string;
  onScoreUpdate?: (score: QualityMetrics) => void;
}

export default function QualityScoring({
  mediaType,
  content,
  context,
  category,
  onScoreUpdate
}: QualityScoringProps) {
  const [qualityScore, setQualityScore] = useState<QualityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!content) {
      setQualityScore(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const score = calculateQualityScore(mediaType, content, context, category);
      setQualityScore(score);
      onScoreUpdate?.(score);
      setIsAnalyzing(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [mediaType, content, context, category, onScoreUpdate]);

  const calculateQualityScore = (
    type: string,
    contentData: string | File | null,
    ctx: string,
    cat: string
  ): QualityMetrics => {
    let technical = 85; // Base score
    let contextScore = 70;
    let clarity = 80;
    let completeness = 75;
    
    const improvements: QualityImprovement[] = [];
    const strengths: string[] = [];

    // Technical quality analysis (photo/text specific)
    if (type === 'photo' && contentData instanceof File) {
      // Simulate photo analysis
      const fileSize = contentData.size;
      const fileName = contentData.name.toLowerCase();

      if (fileSize > 3 * 1024 * 1024) {
        technical += 10;
        strengths.push('High resolution image');
      } else if (fileSize < 500 * 1024) {
        technical -= 15;
        improvements.push({
          area: 'Image Quality',
          issue: 'Low resolution may affect feedback quality',
          solution: 'Upload a higher resolution image (>1MB)',
          impact: 'medium',
          difficulty: 'easy',
          icon: Camera
        });
      }

      if (fileName.includes('screenshot') || fileName.includes('screen')) {
        technical -= 20;
        improvements.push({
          area: 'Image Type',
          issue: 'Screenshots typically have poor lighting',
          solution: 'Take a new photo with natural lighting',
          impact: 'high',
          difficulty: 'medium',
          icon: Eye
        });
      } else {
        strengths.push('Original photo (not screenshot)');
      }

      // Simulate lighting analysis
      const hasGoodLighting = Math.random() > 0.3; // Mock analysis
      if (!hasGoodLighting) {
        technical -= 15;
        improvements.push({
          area: 'Lighting',
          issue: 'Poor lighting detected',
          solution: 'Retake near a window or in natural light',
          impact: 'high',
          difficulty: 'medium',
          icon: Zap
        });
      } else {
        technical += 5;
        strengths.push('Good lighting detected');
      }
    }

    if (type === 'text' && typeof contentData === 'string') {
      const wordCount = contentData.split(' ').length;
      
      if (wordCount > 50) {
        technical += 10;
        strengths.push('Good length for detailed feedback');
      } else if (wordCount < 20) {
        technical -= 20;
        improvements.push({
          area: 'Content Length',
          issue: 'Text too short for comprehensive feedback',
          solution: 'Add more details about your situation',
          impact: 'high',
          difficulty: 'easy',
          icon: FileText
        });
      }

      // Check for formatting
      if (contentData.includes('\n\n') || contentData.includes('- ')) {
        technical += 5;
        strengths.push('Well-formatted text');
      }

      // Grammar check simulation
      const hasGrammarIssues = contentData.includes('  ') || Math.random() > 0.7;
      if (hasGrammarIssues) {
        technical -= 10;
        improvements.push({
          area: 'Clarity',
          issue: 'Grammar or formatting issues detected',
          solution: 'Proofread and clean up formatting',
          impact: 'low',
          difficulty: 'easy',
          icon: CheckCircle
        });
      }
    }

    // Context analysis
    const contextWords = ctx.split(' ').length;
    
    if (contextWords > 30) {
      contextScore += 20;
      strengths.push('Detailed context provided');
    } else if (contextWords < 10) {
      contextScore -= 30;
      improvements.push({
        area: 'Context',
        issue: 'Very minimal context provided',
        solution: 'Explain the situation, goal, and audience',
        impact: 'high',
        difficulty: 'easy',
        icon: Target
      });
    }

    // Category-specific analysis
    const categoryKeywords = {
      appearance: ['interview', 'date', 'event', 'professional', 'casual'],
      profile: ['job', 'career', 'linkedin', 'professional', 'resume'],
      writing: ['email', 'message', 'tone', 'audience', 'formal'],
      decision: ['choice', 'option', 'help', 'decide', 'advice']
    };

    const catKeywords = categoryKeywords[cat as keyof typeof categoryKeywords] || [];
    const contextLower = ctx.toLowerCase();
    const keywordMatches = catKeywords.filter(keyword => contextLower.includes(keyword)).length;

    if (keywordMatches >= 2) {
      contextScore += 15;
      clarity += 10;
      strengths.push(`Strong ${cat}-specific context`);
    } else if (keywordMatches === 0) {
      contextScore -= 20;
      improvements.push({
        area: 'Relevance',
        issue: `Missing ${cat}-specific details`,
        solution: `Include specific ${cat} context and goals`,
        impact: 'high',
        difficulty: 'easy',
        icon: Target
      });
    }

    // Clarity checks
    if (ctx.includes('?')) {
      clarity += 10;
      strengths.push('Clear questions help focus feedback');
    }

    if (ctx.includes('goal') || ctx.includes('want') || ctx.includes('need')) {
      clarity += 15;
      strengths.push('Clear goals stated');
    } else {
      improvements.push({
        area: 'Goals',
        issue: 'Goals or desired outcomes not clearly stated',
        solution: 'Specify what you want to achieve',
        impact: 'medium',
        difficulty: 'easy',
        icon: Star
      });
    }

    // Completeness analysis
    const hasTimeline = contextLower.includes('tomorrow') || contextLower.includes('next') || contextLower.includes('urgent');
    const hasAudience = contextLower.includes('for ') || contextLower.includes('audience') || contextLower.includes('people');
    const hasConstraints = contextLower.includes('budget') || contextLower.includes('time') || contextLower.includes('must');

    if (hasTimeline) {
      completeness += 10;
      strengths.push('Timeline context provided');
    }

    if (hasAudience) {
      completeness += 10;
      strengths.push('Target audience specified');
    }

    if (!hasConstraints && cat !== 'appearance') {
      improvements.push({
        area: 'Constraints',
        issue: 'No constraints or limitations mentioned',
        solution: 'Mention budget, time, or other constraints',
        impact: 'low',
        difficulty: 'easy',
        icon: AlertTriangle
      });
    }

    // Normalize scores
    technical = Math.max(0, Math.min(100, technical));
    contextScore = Math.max(0, Math.min(100, contextScore));
    clarity = Math.max(0, Math.min(100, clarity));
    completeness = Math.max(0, Math.min(100, completeness));

    const overall = Math.round((technical + contextScore + clarity + completeness) / 4);

    // Grade calculation
    let grade: QualityMetrics['grade'];
    if (overall >= 95) grade = 'A+';
    else if (overall >= 90) grade = 'A';
    else if (overall >= 85) grade = 'B+';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 75) grade = 'C+';
    else if (overall >= 70) grade = 'C';
    else grade = 'D';

    // Predicted rating based on quality
    const predictedRating = Math.max(6.0, Math.min(10.0, 6.0 + (overall / 100) * 4));

    return {
      overall,
      technical,
      context: contextScore,
      clarity,
      completeness,
      grade,
      improvements: improvements.slice(0, 3), // Top 3 improvements
      strengths: strengths.slice(0, 3), // Top 3 strengths
      predictedRating
    };
  };

  if (!content) return null;

  if (isAnalyzing) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Camera className="h-6 w-6 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">
              Analyzing Quality...
            </h3>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-blue-700 text-sm mt-2">
            Checking technical quality, context, and clarity...
          </p>
        </div>
      </div>
    );
  }

  if (!qualityScore) return null;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <CheckCircle className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-blue-900">Quality Analysis</h3>
        </div>
        <p className="text-blue-700">AI assessment of your submission quality</p>
      </div>

      {/* Grade and Overall Score */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border">
          <div className={`text-3xl font-bold mb-2 px-3 py-1 rounded-lg inline-block ${getGradeColor(qualityScore.grade)}`}>
            {qualityScore.grade}
          </div>
          <p className="text-sm text-gray-600">Overall Grade</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center border">
          <div className={`text-3xl font-bold mb-2 ${getScoreColor(qualityScore.overall)}`}>
            {qualityScore.overall}%
          </div>
          <p className="text-sm text-gray-600">Quality Score</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Technical</span>
            <span className={`font-bold ${getScoreColor(qualityScore.technical)}`}>
              {qualityScore.technical}%
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Context</span>
            <span className={`font-bold ${getScoreColor(qualityScore.context)}`}>
              {qualityScore.context}%
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Clarity</span>
            <span className={`font-bold ${getScoreColor(qualityScore.clarity)}`}>
              {qualityScore.clarity}%
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Complete</span>
            <span className={`font-bold ${getScoreColor(qualityScore.completeness)}`}>
              {qualityScore.completeness}%
            </span>
          </div>
        </div>
      </div>

      {/* Predicted Rating */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6 text-center border border-purple-200">
        <p className="text-purple-800 font-medium mb-1">Predicted Verdict Rating</p>
        <div className="flex items-center justify-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
          <span className="text-2xl font-bold text-purple-900">
            {qualityScore.predictedRating.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* Strengths */}
      {qualityScore.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h4>
          <div className="space-y-1">
            {qualityScore.strengths.map((strength, index) => (
              <div key={index} className="bg-green-50 rounded p-2 border border-green-200">
                <p className="text-sm text-green-800">✓ {strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {qualityScore.improvements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-orange-800 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quick Improvements
            </h4>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          </div>
          
          <div className="space-y-2">
            {qualityScore.improvements.map((improvement, index) => {
              const Icon = improvement.icon;
              return (
                <div key={index} className="bg-orange-50 rounded p-3 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-orange-900 text-sm">{improvement.area}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          improvement.impact === 'high' ? 'bg-red-100 text-red-700' :
                          improvement.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {improvement.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-orange-800">{improvement.issue}</p>
                      {showDetails && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs text-green-700 font-medium">💡 {improvement.solution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Impact Message */}
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 border border-indigo-200">
        <p className="text-center text-indigo-800 text-sm">
          {qualityScore.overall >= 90 && '🎯 Excellent quality! You\'re set for top-tier feedback.'}
          {qualityScore.overall >= 80 && qualityScore.overall < 90 && '👍 Good quality. Small tweaks could boost your rating significantly.'}
          {qualityScore.overall >= 70 && qualityScore.overall < 80 && '⚡ Decent start. Following the suggestions will improve feedback quality.'}
          {qualityScore.overall < 70 && '🔧 Quality improvements needed for better feedback. Focus on the red areas above.'}
        </p>
      </div>
    </div>
  );
}