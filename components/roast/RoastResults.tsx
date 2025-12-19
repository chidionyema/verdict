'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Download, Copy, ExternalLink, Flame, Zap, TrendingUp } from 'lucide-react';
import { ViralSharePopup } from '@/components/viral/ViralSharePopup';
import { useViralSharing } from '@/hooks/useViralSharing';
import { toast } from '@/components/ui/toast';
import type { Database } from '@/types/supabase';

type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row'];
type FeedbackRequest = Database['public']['Tables']['feedback_requests']['Row'] & {
  feedback_responses: FeedbackResponse[];
};

interface RoastResultsProps {
  request: FeedbackRequest;
  currentUserId?: string;
}

export function RoastResults({ request, currentUserId }: RoastResultsProps) {
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  const {
    shouldShowViralPopup,
    setShouldShowViralPopup,
    currentRoastData,
    generateShareContent,
    triggerViralShare,
    markAsShared
  } = useViralSharing();

  const isOwner = currentUserId === request.user_id;
  const roasts = request.feedback_responses || [];
  const avgRating = roasts.length > 0 ? roasts.reduce((sum, r) => sum + (r.rating || 0), 0) / roasts.length : 0;

  // Auto-trigger viral sharing for completed roasts
  useEffect(() => {
    if (isOwner && roasts.length >= 3) {
      const roastData = {
        id: request.id,
        question: request.question || 'My submission',
        category: request.category || 'general',
        avgRating,
        totalRoasts: roasts.length,
        roasts: roasts.map(r => ({
          feedback: r.feedback || '',
          rating: r.rating || 0
        }))
      };

      // Trigger viral share popup after component mounts
      const timer = setTimeout(() => {
        triggerViralShare(roastData);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOwner, roasts.length, request.id, avgRating, triggerViralShare]);

  const generateShareableContent = () => {
    const avgRating = roasts.reduce((sum, r) => sum + (r.rating || 0), 0) / roasts.length;
    
    return `I asked strangers to roast my ${request.category} and got DESTROYED 🔥

Question: "${request.question}"

The verdicts:
${roasts.map((r, i) => `${i + 1}. "${r.feedback}" - ${r.rating}/10`).join('\n')}

Average rating: ${avgRating.toFixed(1)}/10

Try it yourself at askverdict.com 👀

#roasted #honestfeedback #verdict`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareableContent());
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleShareToSocial = (platform: 'twitter' | 'tiktok' | 'instagram') => {
    const content = generateShareableContent();
    const encodedContent = encodeURIComponent(content);
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedContent}`, '_blank');
        break;
      case 'tiktok':
        // TikTok doesn't have direct URL sharing, so we copy content instead
        handleCopyToClipboard();
        toast.success('Content copied! Paste it into your TikTok caption.');
        break;
      case 'instagram':
        // Instagram doesn't have direct URL sharing either
        handleCopyToClipboard();
        toast.success('Content copied! Paste it into your Instagram caption.');
        break;
    }
  };

  if (!isOwner) {
    // For non-owners, show a simplified view
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Flame className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-bold text-gray-900">🔥 Roast Results</h3>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
            ROAST MODE
          </span>
        </div>
        
        <div className="space-y-4">
          {roasts.map((roast, index) => (
            <div key={roast.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-red-900">Roaster #{index + 1}</span>
                <span className="text-lg font-bold text-red-600">{roast.rating}/10</span>
              </div>
              <p className="text-gray-800 leading-relaxed">{roast.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For owners, show full results with sharing options
  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">You Got Roasted! 🔥</h2>
            <p className="text-red-100">Here's what strangers really think...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {roasts.length > 0 ? (roasts.reduce((sum, r) => sum + (r.rating || 0), 0) / roasts.length).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-red-100">Average Rating</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{roasts.length}</div>
            <div className="text-sm text-red-100">Roasters</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {roasts.reduce((sum, r) => sum + (r.feedback?.split(' ').length || 0), 0)}
            </div>
            <div className="text-sm text-red-100">Words Used</div>
          </div>
        </div>
      </div>

      {/* Individual Roasts */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">The Roasts:</h3>
        
        {roasts.map((roast, index) => (
          <div key={roast.id} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="font-semibold text-gray-900">Anonymous Roaster</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{roast.rating}/10</div>
                <div className="text-xs text-gray-500">brutality score</div>
              </div>
            </div>
            
            <blockquote className="text-gray-800 text-lg leading-relaxed font-medium italic">
              "{roast.feedback}"
            </blockquote>
          </div>
        ))}
      </div>

      {/* Enhanced Viral Sharing Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500 text-white rounded-full p-2">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">Your Roast is Going Viral! 🔥</h3>
            <p className="text-sm text-amber-700">Share this brutal honesty and watch the engagement explode</p>
          </div>
          <span className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-semibold animate-pulse">
            📈 VIRAL READY
          </span>
        </div>
        
        <p className="text-amber-800 mb-6">
          Share your brutal feedback results and watch them go viral. People love seeing others get roasted!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleShareToSocial('twitter')}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Twitter/X
          </button>
          
          <button
            onClick={() => handleShareToSocial('tiktok')}
            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            TikTok
          </button>
          
          <button
            onClick={() => handleShareToSocial('instagram')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Instagram
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              copiedToClipboard 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Copy className="h-4 w-4" />
            {copiedToClipboard ? 'Copied!' : 'Copy Text'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-amber-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">
            {generateShareableContent().slice(0, 200)}...
          </div>
        </div>
      </div>

      {/* Get Roasted Again CTA */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Want More Brutal Honesty?</h3>
        <p className="text-indigo-100 mb-4">Submit something else and see what strangers really think.</p>
        <button
          onClick={() => router.push('/start?mode=roast')}
          className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Get Roasted Again 🔥
        </button>
      </div>

      {/* Viral Share Popup */}
      {currentRoastData && (
        <ViralSharePopup
          isOpen={shouldShowViralPopup}
          onClose={() => setShouldShowViralPopup(false)}
          shareContent={generateShareContent(currentRoastData)}
          roastData={{
            question: currentRoastData.question,
            avgRating: currentRoastData.avgRating,
            totalRoasts: currentRoastData.totalRoasts,
            category: currentRoastData.category
          }}
        />
      )}
    </div>
  );
}