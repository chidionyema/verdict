'use client';

import { useState } from 'react';
import { Share2, TrendingUp, X, ExternalLink } from 'lucide-react';

interface ViralShareHintProps {
  isRoastMode?: boolean;
  feedbackCount?: number;
  onShare?: () => void;
}

export function ViralShareHint({ isRoastMode = false, feedbackCount = 0, onShare }: ViralShareHintProps) {
  const [dismissed, setDismissed] = useState(false);
  
  // Only show hint for engaging content
  if (dismissed || feedbackCount < 2) return null;
  
  const shareHints = {
    roast: {
      title: "🔥 This roast is going viral!",
      description: "Roast content gets 3x more engagement. Perfect for TikTok/Instagram stories!",
      cta: "Share the Roast",
      bgColor: "from-red-50 to-orange-50",
      borderColor: "border-red-200",
      textColor: "text-red-700"
    },
    regular: {
      title: "📈 This feedback could go viral!",
      description: "Great feedback content performs well on social media. Share your honest verdict!",
      cta: "Share This",
      bgColor: "from-blue-50 to-indigo-50", 
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    }
  };
  
  const config = isRoastMode ? shareHints.roast : shareHints.regular;
  
  return (
    <div className={`bg-gradient-to-r ${config.bgColor} ${config.borderColor} border rounded-lg p-3 mb-3 relative animate-fade-in`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <TrendingUp className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
        <div className="flex-1">
          <div className={`font-semibold ${config.textColor} text-sm`}>
            {config.title}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {config.description}
          </div>
          <button
            onClick={onShare}
            className={`inline-flex items-center gap-1 text-xs ${config.textColor} hover:underline font-medium`}
          >
            <Share2 className="h-3 w-3" />
            {config.cta}
          </button>
        </div>
      </div>
    </div>
  );
}