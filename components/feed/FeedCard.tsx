'use client';

import { useState } from 'react';
import { Heart, X, MessageSquare, Clock, Eye, Camera, FileText, Zap, SkipForward } from 'lucide-react';

// Flexible type that works with both feedback_requests and verdict_requests
interface FeedRequest {
  id: string;
  user_id: string;
  category: string;
  question?: string;
  text_content?: string | null;
  context?: string | null;
  media_type?: 'photo' | 'text' | 'audio' | null;
  media_url?: string | null;
  roast_mode?: boolean | null;
  requested_tone?: 'encouraging' | 'honest' | 'brutally_honest' | null;
  visibility?: 'public' | 'private' | null;
  created_at: string;
  response_count?: number;
  received_verdict_count?: number;
  user_has_judged?: boolean;
}

interface FeedCardProps {
  item: FeedRequest;
  onJudge: (verdict: 'like' | 'dislike', feedback?: string) => Promise<void>;
  onSkip: () => void;
  judging: boolean;
}

export function FeedCard({ item, onJudge, onSkip, judging }: FeedCardProps) {
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [detailedFeedback, setDetailedFeedback] = useState('');

  // Handle both feedback_requests (question) and verdict_requests (text_content)
  const displayQuestion = item.question || item.text_content || '';
  const displayContext = item.context || '';
  const isRoastMode = item.roast_mode || item.requested_tone === 'brutally_honest';
  const responseCount = item.response_count ?? item.received_verdict_count ?? 0;

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'appearance': return <Camera className="h-4 w-4" />;
      case 'writing': return <FileText className="h-4 w-4" />;
      case 'career': return <MessageSquare className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'appearance': return 'bg-pink-100 text-pink-700';
      case 'writing': return 'bg-green-100 text-green-700';
      case 'career': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeSinceCreated = () => {
    const now = new Date();
    const created = new Date(item.created_at);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  async function handleQuickJudge(verdict: 'like' | 'dislike') {
    if (judging) return;
    // For roast mode, provide harsher feedback templates
    const roastFeedback = isRoastMode ? 
      (verdict === 'like' ? '🔥 This is actually decent' : '💀 This ain\'t it chief') :
      (verdict === 'like' ? '👍 Looks good' : '👎 Could be better');
    
    await onJudge(verdict, roastFeedback);
  }

  async function handleDetailedJudge(verdict: 'like' | 'dislike') {
    if (judging || !detailedFeedback.trim()) return;
    await onJudge(verdict, detailedFeedback);
    setDetailedFeedback('');
    setShowDetailedFeedback(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getCategoryColor()}`}>
              {getCategoryIcon()}
              <span className="capitalize">{item.category}</span>
            </div>
            {isRoastMode && (
              <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                🔥 ROAST MODE
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {getTimeSinceCreated()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Question */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{displayQuestion}</h3>
          {displayContext && (
            <p className="text-gray-600 text-sm leading-relaxed">{displayContext}</p>
          )}
        </div>

        {/* Media placeholder */}
        {item.media_type === 'photo' && (
          <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Photo submission</p>
              <p className="text-xs">(Blurred for privacy)</p>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Eye className="h-4 w-4" />
          <span>{responseCount}/3 judgments</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((responseCount) / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!showDetailedFeedback ? (
        <div className={`p-4 space-y-3 ${isRoastMode ? 'bg-red-50' : 'bg-gray-50'}`}>
          {/* Quick judgment */}
          <div className="flex gap-3">
            <button
              onClick={() => handleQuickJudge('dislike')}
              disabled={judging}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-white disabled:bg-gray-300 min-h-[48px] ${
                isRoastMode
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <X className="h-5 w-5" />
              {judging ? 'Judging...' : isRoastMode ? '💀 Destroy' : 'Not Good'}
            </button>
            <button
              onClick={() => handleQuickJudge('like')}
              disabled={judging}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-white disabled:bg-gray-300 min-h-[48px] ${
                isRoastMode
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              <Heart className="h-5 w-5" />
              {judging ? 'Judging...' : isRoastMode ? '🔥 Fire' : 'Looks Good'}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetailedFeedback(true)}
              className="flex-1 bg-indigo-100 text-indigo-700 py-3 px-4 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
            >
              <MessageSquare className="h-4 w-4" />
              Write Feedback
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </button>
          </div>

          {/* Credit indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
              <Zap className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-700 font-medium">+0.2 credits for judging</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 space-y-3">
          <div>
            <label htmlFor="detailed-feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Feedback
            </label>
            <p id="feedback-hint" className="text-xs text-gray-500 mb-2">
              Write at least 10 characters to submit your feedback
            </p>
            <textarea
              id="detailed-feedback"
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              placeholder={isRoastMode
                ? "Let them have it! Be brutal, be honest, be savage... 🔥"
                : "Share specific thoughts, suggestions, or observations..."}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
                isRoastMode ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={3}
              maxLength={500}
              aria-label="Write detailed feedback"
              aria-describedby="feedback-hint feedback-counter"
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${detailedFeedback.trim().length < 10 && detailedFeedback.length > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                {detailedFeedback.trim().length < 10 && detailedFeedback.length > 0
                  ? `${10 - detailedFeedback.trim().length} more characters needed`
                  : detailedFeedback.trim().length >= 10
                  ? '✓ Ready to submit'
                  : ''}
              </span>
              <span
                id="feedback-counter"
                className="text-xs text-gray-400"
                aria-live="polite"
                aria-atomic="true"
              >
                {detailedFeedback.length}/500
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleDetailedJudge('dislike')}
              disabled={judging || detailedFeedback.trim().length < 10}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <X className="h-5 w-5" />
              Not Good
            </button>
            <button
              onClick={() => handleDetailedJudge('like')}
              disabled={judging || detailedFeedback.trim().length < 10}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Heart className="h-5 w-5" />
              Looks Good
            </button>
          </div>
          {detailedFeedback.trim().length > 0 && detailedFeedback.trim().length < 10 && (
            <p className="text-xs text-amber-600 text-center" role="alert">
              Add {10 - detailedFeedback.trim().length} more characters to submit
            </p>
          )}
          
          <button
            onClick={() => setShowDetailedFeedback(false)}
            className="w-full bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
          >
            Back to Quick Judge
          </button>
        </div>
      )}
    </div>
  );
}