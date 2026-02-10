'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Heart,
  MessageSquare,
  Camera,
  FileText
} from 'lucide-react';

interface FeedbackPreviewProps {
  formData: {
    mediaType: 'photo' | 'text' | 'audio';
    category: 'appearance' | 'profile' | 'writing' | 'decision';
    context: string;
    textContent: string;
    mediaFiles: File[];
    targetVerdictCount: number;
    tier: 'community' | 'standard' | 'pro';
  };
  onContinue: () => void;
  onEdit: () => void;
}

interface PreviewInsight {
  type: 'quality' | 'warning' | 'suggestion' | 'strength';
  title: string;
  description: string;
  icon: any;
  color: string;
}

const CATEGORY_INSIGHTS = {
  appearance: {
    strengths: ['Clear visual content', 'Specific context provided', 'Good image quality'],
    suggestions: ['Consider multiple angles', 'Mention intended use (dating, work, etc)', 'Ask about specific aspects'],
    examples: ['Does this photo make me look professional for LinkedIn?', 'Which hairstyle suits my face better?']
  },
  profile: {
    strengths: ['Professional context', 'Clear purpose stated', 'Target audience defined'],
    suggestions: ['Include platform context', 'Mention your goals', 'Ask about impression'],
    examples: ['Is this bio engaging for dating apps?', 'Does this LinkedIn photo look trustworthy?']
  },
  writing: {
    strengths: ['Clear writing sample', 'Context provided', 'Specific feedback requested'],
    suggestions: ['Include target audience', 'Mention writing purpose', 'Ask about tone/clarity'],
    examples: ['Is this email tone professional enough?', 'Does this copy sound persuasive?']
  },
  decision: {
    strengths: ['Clear options presented', 'Context explained', 'Decision criteria mentioned'],
    suggestions: ['Include pros/cons', 'Mention constraints', 'Ask about long-term impact'],
    examples: ['Should I take this job offer?', 'Is this investment worth the risk?']
  }
};

export function FeedbackPreview({ formData, onContinue, onEdit }: FeedbackPreviewProps) {
  const [insights, setInsights] = useState<PreviewInsight[]>([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [expectedOutcome, setExpectedOutcome] = useState<string>('');

  useEffect(() => {
    analyzeRequest();
  }, [formData]);

  const analyzeRequest = () => {
    const analysis: PreviewInsight[] = [];
    let score = 50; // Base score

    // Check context quality
    if (formData.context.length > 100) {
      analysis.push({
        type: 'strength',
        title: 'Detailed Context',
        description: 'You\'ve provided good context for reviewers to understand your request',
        icon: CheckCircle,
        color: 'green'
      });
      score += 15;
    } else if (formData.context.length < 30) {
      analysis.push({
        type: 'warning',
        title: 'Limited Context',
        description: 'More context helps reviewers give better, more relevant feedback',
        icon: AlertTriangle,
        color: 'orange'
      });
      score -= 10;
    }

    // Check for specific questions
    const hasQuestion = formData.context.includes('?');
    if (hasQuestion) {
      analysis.push({
        type: 'strength',
        title: 'Clear Questions',
        description: 'You\'ve asked specific questions, which leads to focused feedback',
        icon: Target,
        color: 'blue'
      });
      score += 10;
    } else {
      analysis.push({
        type: 'suggestion',
        title: 'Add Specific Questions',
        description: 'Consider asking specific questions to get more targeted feedback',
        icon: Lightbulb,
        color: 'purple'
      });
    }

    // Check content quality based on media type
    if (formData.mediaType === 'photo' && formData.mediaFiles.length === 0) {
      analysis.push({
        type: 'warning',
        title: 'No Images Uploaded',
        description: 'Upload clear, well-lit photos for the best feedback quality',
        icon: Camera,
        color: 'red'
      });
      score -= 20;
    } else if (formData.mediaType === 'text' && formData.textContent.length < 50) {
      analysis.push({
        type: 'warning',
        title: 'Limited Text Content',
        description: 'Longer text samples help reviewers provide more detailed feedback',
        icon: FileText,
        color: 'orange'
      });
      score -= 10;
    }

    // Category-specific insights
    const categoryData = CATEGORY_INSIGHTS[formData.category];
    
    // Check for purpose/context keywords
    const contextLower = formData.context.toLowerCase();
    const hasPurpose = ['for', 'dating', 'work', 'linkedin', 'interview', 'job', 'professional', 'business'].some(keyword => 
      contextLower.includes(keyword)
    );
    
    if (hasPurpose) {
      analysis.push({
        type: 'strength',
        title: 'Clear Purpose',
        description: 'You\'ve mentioned the intended use, which helps reviewers provide relevant advice',
        icon: Star,
        color: 'gold'
      });
      score += 15;
    } else {
      analysis.push({
        type: 'suggestion',
        title: 'Add Purpose',
        description: `Mention what you'll use this ${formData.mediaType} for (work, dating, social media, etc.)`,
        icon: Info,
        color: 'blue'
      });
    }

    // Tier-based quality prediction
    if (formData.tier === 'pro') {
      score += 20;
      setExpectedOutcome('Comprehensive expert analysis with actionable insights');
    } else if (formData.tier === 'standard') {
      score += 10;
      setExpectedOutcome('Detailed feedback from verified community members');
    } else {
      setExpectedOutcome('Quick opinions from the general community');
    }

    // Cap score at 100
    setQualityScore(Math.min(score, 100));
    setInsights(analysis);
  };

  const getScoreColor = () => {
    if (qualityScore >= 80) return 'from-green-500 to-emerald-600';
    if (qualityScore >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getScoreLabel = () => {
    if (qualityScore >= 80) return 'Excellent';
    if (qualityScore >= 60) return 'Good';
    if (qualityScore >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const estimatedTime = () => {
    const baseTime = formData.tier === 'pro' ? 60 : formData.tier === 'standard' ? 120 : 30;
    const complexity = formData.context.length > 100 ? 1.2 : 1;
    return Math.round(baseTime * complexity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Feedback Quality Preview</h3>
        <p className="text-gray-600">See what kind of feedback you can expect to receive</p>
      </div>

      {/* Quality Score */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Request Quality Score</h4>
            <p className="text-sm text-gray-600">Based on context, clarity, and specificity</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
              {qualityScore}%
            </div>
            <div className={`text-sm font-medium ${
              qualityScore >= 80 ? 'text-green-600' : 
              qualityScore >= 60 ? 'text-yellow-600' : 'text-orange-600'
            }`}>
              {getScoreLabel()}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${qualityScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor()}`}
            />
          </div>
        </div>

        {/* Expected Outcome */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-blue-900 mb-1">Expected Outcome</h5>
              <p className="text-blue-800 text-sm">{expectedOutcome}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Quality Analysis</h4>
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-l-4 ${
              insight.type === 'strength' ? 'bg-green-50 border-green-500' :
              insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
              insight.type === 'suggestion' ? 'bg-purple-50 border-purple-500' :
              'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                insight.color === 'green' ? 'bg-green-600' :
                insight.color === 'orange' ? 'bg-orange-600' :
                insight.color === 'purple' ? 'bg-purple-600' :
                insight.color === 'blue' ? 'bg-blue-600' :
                insight.color === 'red' ? 'bg-red-600' :
                'bg-yellow-600'
              }`}>
                <insight.icon className="h-3 w-3 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">{insight.title}</h5>
                <p className="text-gray-700 text-sm">{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Predicted Timeline */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Estimated Timeline</h4>
              <p className="text-sm text-gray-600">Based on your tier and request complexity</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{estimatedTime()}min</div>
            <div className="text-sm text-indigo-500">Average response time</div>
          </div>
        </div>
      </div>

      {/* Sample Feedback Preview */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          Sample Feedback You Might Receive
        </h4>
        
        <div className="space-y-3">
          {formData.category === 'appearance' && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 italic">
                    "Great natural lighting in this photo! For professional use, I'd suggest a more neutral background. 
                    The smile looks genuine and approachable. Overall rating: 8/10"
                  </p>
                  <div className="text-xs text-gray-500 mt-1">Verified Judge • 2 min</div>
                </div>
              </div>
            </div>
          )}
          
          {formData.category === 'writing' && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 italic">
                    "The tone is professional and clear. Consider shortening the second paragraph for better impact. 
                    The call-to-action could be stronger. Overall solid piece with minor tweaks needed."
                  </p>
                  <div className="text-xs text-gray-500 mt-1">Expert Judge • 5 min</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <span className="text-xs text-gray-500">
              + {formData.targetVerdictCount - 1} more detailed responses
            </span>
          </div>
        </div>
      </div>

      {/* Category Tips */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Tips for Better Feedback
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CATEGORY_INSIGHTS[formData.category].suggestions.map((tip, index) => (
            <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-yellow-600 font-bold mt-0.5">•</span>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={onEdit}
          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          Edit Request
        </button>

        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-3 ${
            qualityScore >= 60
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          {qualityScore >= 60 ? 'Looks Great! Continue' : 'Continue Anyway'}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>

      {qualityScore < 60 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-orange-800 font-medium mb-1">Consider improving your request</p>
              <p className="text-orange-700">
                Adding more context and specific questions will help you get much better feedback. 
                You can still submit now, but reviewers might ask for clarification.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}