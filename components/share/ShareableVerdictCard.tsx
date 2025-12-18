'use client';

import { useState } from 'react';
import { Download, Share2, Copy, X, Instagram, Twitter, Facebook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TouchButton } from '@/components/ui/touch-button';

interface VerdictData {
  id: string;
  question: string;
  category: string;
  averageRating?: number;
  feedbackCount: number;
  highlights: string[];
  submittedAt: string;
  isPrivate?: boolean;
}

interface ShareableVerdictCardProps {
  verdict: VerdictData;
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  appearance: { 
    gradient: 'from-pink-500 to-rose-500',
    icon: '👔',
    name: 'Style & Appearance'
  },
  dating: { 
    gradient: 'from-red-500 to-pink-500',
    icon: '💕', 
    name: 'Dating & Relationships'
  },
  career: { 
    gradient: 'from-blue-500 to-indigo-500',
    icon: '💼',
    name: 'Career & Professional'
  },
  writing: { 
    gradient: 'from-purple-500 to-violet-500',
    icon: '✍️',
    name: 'Creative & Writing'
  },
  decision: { 
    gradient: 'from-emerald-500 to-teal-500',
    icon: '🤔',
    name: 'Life Decisions'
  }
};

const shareTemplates = {
  instagram: {
    size: { width: 1080, height: 1080 },
    title: "Got the verdict! 📝",
    hashtags: "#Verdict #Feedback #Community #TruthTellers"
  },
  twitter: {
    size: { width: 1200, height: 675 },
    title: "Just got some honest feedback on @AskVerdict 🎯",
    hashtags: "#GetTheVerdict #HonestFeedback"
  },
  facebook: {
    size: { width: 1200, height: 630 },
    title: "Community feedback hits different 💯",
    hashtags: ""
  }
};

export function ShareableVerdictCard({ verdict, isOpen, onClose }: ShareableVerdictCardProps) {
  const [selectedFormat, setSelectedFormat] = useState<'instagram' | 'twitter' | 'facebook'>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const config = categoryConfig[verdict.category as keyof typeof categoryConfig] || categoryConfig.decision;
  const template = shareTemplates[selectedFormat];

  const generateShareableCard = async () => {
    setIsGenerating(true);
    
    // Create a canvas element for generating the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = template.size.width;
    canvas.height = template.size.height;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add overlay pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < canvas.width; i += 40) {
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.fillRect(i, j, 20, 20);
      }
    }

    // Add content
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 VERDICT RECEIVED', canvas.width / 2, 120);

    // Add category
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${config.icon} ${config.name}`, canvas.width / 2, 200);

    // Add question (truncated if too long)
    ctx.font = '32px Arial';
    const maxQuestionWidth = canvas.width - 100;
    const truncatedQuestion = verdict.question.length > 60 
      ? verdict.question.substring(0, 60) + '...'
      : verdict.question;
    
    // Word wrap the question
    const words = truncatedQuestion.split(' ');
    let line = '';
    let y = 280;
    const lineHeight = 45;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxQuestionWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Add stats
    if (verdict.averageRating) {
      const stars = '⭐'.repeat(Math.round(verdict.averageRating));
      ctx.font = 'bold 40px Arial';
      ctx.fillText(`${stars} ${verdict.averageRating.toFixed(1)}/5`, canvas.width / 2, y + 80);
    }

    ctx.font = '28px Arial';
    ctx.fillText(`${verdict.feedbackCount} detailed reviews received`, canvas.width / 2, y + 130);

    // Add highlights
    if (verdict.highlights.length > 0) {
      ctx.font = 'bold 24px Arial';
      ctx.fillText('KEY INSIGHTS:', canvas.width / 2, y + 200);
      
      ctx.font = '22px Arial';
      verdict.highlights.slice(0, 3).forEach((highlight, index) => {
        const truncatedHighlight = highlight.length > 50 
          ? highlight.substring(0, 50) + '...'
          : highlight;
        ctx.fillText(`• ${truncatedHighlight}`, canvas.width / 2, y + 240 + (index * 35));
      });
    }

    // Add branding
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('AskVerdict.com - Get honest feedback', canvas.width / 2, canvas.height - 50);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verdict-${verdict.id}-${selectedFormat}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setIsGenerating(false);
    });
  };

  const copyShareText = () => {
    const shareText = `${template.title}\n\nJust got some valuable feedback on "${verdict.question.substring(0, 80)}${verdict.question.length > 80 ? '...' : ''}"\n\n${verdict.averageRating ? `⭐ ${verdict.averageRating.toFixed(1)}/5 rating` : ''}\n📊 ${verdict.feedbackCount} detailed reviews\n\nTry it yourself: askverdict.com\n\n${template.hashtags}`;
    
    navigator.clipboard.writeText(shareText);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6" />
              Share Your Verdict
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-white/90 mt-2">Create viral-ready content for social media</p>
        </div>

        <div className="p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Platform Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(shareTemplates).map(([platform, template]) => {
                const isSelected = selectedFormat === platform;
                const icons = {
                  instagram: Instagram,
                  twitter: Twitter, 
                  facebook: Facebook
                };
                const Icon = icons[platform as keyof typeof icons];
                
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedFormat(platform as any)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${
                      isSelected ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <div className="font-medium text-sm capitalize">{platform}</div>
                    <div className="text-xs text-gray-500">
                      {template.size.width} × {template.size.height}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preview
            </label>
            <div className={`bg-gradient-to-br ${config.gradient} rounded-xl p-6 text-white text-center relative overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 gap-1 h-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-sm" />
                  ))}
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">🎯 VERDICT RECEIVED</h3>
                <p className="text-lg mb-3">{config.icon} {config.name}</p>
                <p className="text-sm mb-4 opacity-90">
                  "{verdict.question.substring(0, 60)}{verdict.question.length > 60 ? '...' : ''}"
                </p>
                
                {verdict.averageRating && (
                  <div className="mb-2">
                    <span className="text-lg">⭐ {verdict.averageRating.toFixed(1)}/5</span>
                  </div>
                )}
                
                <p className="text-sm opacity-80 mb-4">
                  {verdict.feedbackCount} detailed reviews received
                </p>
                
                <div className="text-xs opacity-70">
                  AskVerdict.com - Get honest feedback
                </div>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <TouchButton
                onClick={generateShareableCard}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </>
                )}
              </TouchButton>
              
              <TouchButton
                onClick={copyShareText}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                {showCopySuccess ? (
                  <>
                    ✅ Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Caption
                  </>
                )}
              </TouchButton>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Share Caption Preview:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {template.title}
                {'\n\n'}Just got some valuable feedback on "{verdict.question.substring(0, 80)}{verdict.question.length > 80 ? '...' : ''}"
                {'\n\n'}{verdict.averageRating ? `⭐ ${verdict.averageRating.toFixed(1)}/5 rating\n` : ''}📊 {verdict.feedbackCount} detailed reviews
                {'\n\n'}Try it yourself: askverdict.com
                {template.hashtags && `\n\n${template.hashtags}`}
              </p>
            </div>

            <div className="text-xs text-gray-500 text-center">
              💡 Sharing your results helps others discover honest feedback and builds our community
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}