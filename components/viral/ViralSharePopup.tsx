'use client';

import { useState, useEffect } from 'react';
import { X, Share2, Flame, TrendingUp, Users, Zap } from 'lucide-react';

interface ViralSharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  shareContent: string;
  roastData: {
    question: string;
    avgRating: number;
    totalRoasts: number;
    category: string;
  };
}

export function ViralSharePopup({ isOpen, onClose, shareContent, roastData }: ViralSharePopupProps) {
  const [showMotivation, setShowMotivation] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Show motivational messaging after a brief delay
      const timer = setTimeout(() => setShowMotivation(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const viralStats = [
    { icon: TrendingUp, label: 'Roast posts get 3x more engagement', value: '300%' },
    { icon: Users, label: 'Average shares per roast', value: '12.5' },
    { icon: Zap, label: 'Viral potential', value: 'HIGH' }
  ];

  const quickShareButtons = [
    { 
      name: 'Twitter/X', 
      color: 'bg-blue-500 hover:bg-blue-600', 
      action: () => {
        setPlatform('twitter');
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent)}`, '_blank');
      }
    },
    { 
      name: 'TikTok', 
      color: 'bg-black hover:bg-gray-800', 
      action: () => {
        setPlatform('tiktok');
        navigator.clipboard.writeText(shareContent);
        alert('Caption copied! Open TikTok and paste into your video description.');
      }
    },
    { 
      name: 'Instagram', 
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600', 
      action: () => {
        setPlatform('instagram');
        navigator.clipboard.writeText(shareContent);
        alert('Caption copied! Open Instagram and paste into your post/story.');
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Your Roast is Ready to Go Viral! 🔥</h2>
                <p className="text-red-100">Share your brutal feedback and watch the engagement roll in</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Viral Stats */}
          <div className="grid grid-cols-3 gap-4">
            {viralStats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="font-bold text-lg text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Motivational messaging */}
          {showMotivation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-800">
                <Flame className="h-5 w-5" />
                <span className="font-semibold">Roast content performs 3x better than regular posts!</span>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                People love seeing others get roasted. Your brutal feedback is entertainment gold! 📈
              </p>
            </div>
          )}

          {/* Quick Share Buttons */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Roast (1-Click)
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {quickShareButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
                  className={`${button.color} text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 transform flex items-center justify-between group`}
                >
                  <span>{button.name}</span>
                  <div className="text-sm opacity-80 group-hover:opacity-100">
                    {button.name === 'Twitter/X' && '→ Instant post'}
                    {button.name === 'TikTok' && '→ Copy caption'}
                    {button.name === 'Instagram' && '→ Copy caption'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Share Preview:</div>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border whitespace-pre-wrap font-mono">
              {shareContent}
            </div>
          </div>

          {/* Viral Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-bold text-blue-900 mb-2">💡 Pro Viral Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Post during peak hours (7-9 PM)</li>
              <li>• Add relevant hashtags (#roasted #honestfeedback)</li>
              <li>• Tag friends who need to see this</li>
              <li>• Reply to comments to boost engagement</li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              I'll Share This Later
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Come back anytime to share your roast results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}