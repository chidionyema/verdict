'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, useReducedMotion } from 'framer-motion';
import {
  Heart,
  X,
  MessageSquare,
  Clock,
  Eye,
  Camera,
  FileText,
  Zap,
  SkipForward,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Send,
  Lightbulb,
  Check,
  AlertCircle,
  Star,
  Users,
  DollarSign,
  Coins,
} from 'lucide-react';
import { triggerHaptic } from '@/components/ui/Confetti';

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
  request_tier?: 'community' | 'standard' | 'priority' | 'premium' | null;
}

// Tier configuration for visual badges
const TIER_BADGES: Record<string, { label: string; className: string; icon: typeof DollarSign }> = {
  premium: { label: 'Premium', className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white', icon: Star },
  priority: { label: 'Priority', className: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white', icon: Zap },
  standard: { label: 'Paid', className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white', icon: DollarSign },
  community: { label: 'Free', className: 'bg-gray-100 text-gray-600', icon: Users },
};

interface FeedCardProps {
  item: FeedRequest;
  onJudge: (verdict: 'like' | 'dislike', feedback?: string) => Promise<void>;
  onSkip: () => void;
  judging: boolean;
}

const QUICK_RESPONSES = {
  positive: [
    { emoji: '🔥', text: 'This looks great! Really strong overall.' },
    { emoji: '👍', text: 'Nice work! This is well done.' },
    { emoji: '✨', text: 'Love this! Keep it up.' },
    { emoji: '💯', text: 'Solid choice, this works well.' },
  ],
  negative: [
    { emoji: '🤔', text: 'This could use some work. Consider making changes.' },
    { emoji: '💡', text: 'Not quite there yet. Try a different approach.' },
    { emoji: '📝', text: 'Room for improvement here.' },
    { emoji: '🔄', text: 'I\'d suggest trying something different.' },
  ],
  roastPositive: [
    { emoji: '🔥', text: 'Okay, I\'ll admit it - this is actually fire.' },
    { emoji: '😤', text: 'Damn, you didn\'t have to go this hard.' },
    { emoji: '💪', text: 'Not bad at all. Respect.' },
  ],
  roastNegative: [
    { emoji: '💀', text: 'This ain\'t it, chief. Back to the drawing board.' },
    { emoji: '😬', text: 'Yikes. This needs serious work.' },
    { emoji: '🗑️', text: 'Delete this and start over.' },
  ],
};

const CATEGORY_CONFIG: Record<string, { icon: typeof Camera; gradient: string; lightBg: string; color: string }> = {
  appearance: { icon: Camera, gradient: 'from-pink-500 to-rose-500', lightBg: 'bg-pink-50', color: 'text-pink-600' },
  writing: { icon: FileText, gradient: 'from-emerald-500 to-green-500', lightBg: 'bg-emerald-50', color: 'text-emerald-600' },
  career: { icon: MessageSquare, gradient: 'from-blue-500 to-indigo-500', lightBg: 'bg-blue-50', color: 'text-blue-600' },
  profile: { icon: Users, gradient: 'from-purple-500 to-violet-500', lightBg: 'bg-purple-50', color: 'text-purple-600' },
  decision: { icon: Lightbulb, gradient: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', color: 'text-amber-600' },
  other: { icon: Star, gradient: 'from-gray-500 to-slate-500', lightBg: 'bg-gray-50', color: 'text-gray-600' },
};

export function FeedCard({ item, onJudge, onSkip, judging }: FeedCardProps) {
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [selectedQuickResponse, setSelectedQuickResponse] = useState<{ type: 'positive' | 'negative'; index: number } | null>(null);
  const [customFeedback, setCustomFeedback] = useState('');
  const [showImageExpanded, setShowImageExpanded] = useState(false);
  const [animatingOut, setAnimatingOut] = useState<'left' | 'right' | null>(null);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Accessibility: Reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Drag gesture tracking
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const displayQuestion = item.question || item.text_content || '';
  const displayContext = item.context || '';
  const isRoastMode = item.roast_mode || item.requested_tone === 'brutally_honest';
  const responseCount = item.response_count ?? item.received_verdict_count ?? 0;
  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
  const CategoryIcon = categoryConfig.icon;

  // Determine tier badge (paid tiers earn more)
  const requestTier = item.request_tier || 'community';
  const tierBadge = TIER_BADGES[requestTier] || TIER_BADGES.community;
  const isPaidTier = requestTier !== 'community';
  const TierIcon = tierBadge.icon;

  // Handle drag end - trigger verdict if dragged far enough
  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (judging) return;

    if (info.offset.x > threshold) {
      // Swiped right - like
      triggerHaptic('medium');
      setAnimatingOut('right');
      await new Promise(resolve => setTimeout(resolve, 200));
      await onJudge('like', isRoastMode ? '🔥 This is fire.' : '👍 Looks good!');
    } else if (info.offset.x < -threshold) {
      // Swiped left - dislike
      triggerHaptic('medium');
      setAnimatingOut('left');
      await new Promise(resolve => setTimeout(resolve, 200));
      await onJudge('dislike', isRoastMode ? '💀 This ain\'t it.' : '👎 Could be better.');
    }
    setDragDirection(null);
  };

  // Track drag direction for visual feedback
  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) {
      setDragDirection('right');
    } else if (info.offset.x < -50) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const getTimeSinceCreated = () => {
    const now = new Date();
    const created = new Date(item.created_at);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Auto-focus textarea when switching to detailed mode
  useEffect(() => {
    if (mode === 'detailed' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleQuickSelect = (type: 'positive' | 'negative', index: number) => {
    triggerHaptic('light');
    setSelectedQuickResponse({ type, index });
  };

  const handleQuickSubmit = async () => {
    if (!selectedQuickResponse || judging) return;

    const responseSet = isRoastMode
      ? (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.roastPositive : QUICK_RESPONSES.roastNegative)
      : (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.positive : QUICK_RESPONSES.negative);
    const response = responseSet[selectedQuickResponse.index];

    // Animate out
    setAnimatingOut(selectedQuickResponse.type === 'positive' ? 'right' : 'left');
    triggerHaptic('medium');

    await new Promise(resolve => setTimeout(resolve, 200));
    await onJudge(selectedQuickResponse.type === 'positive' ? 'like' : 'dislike', response.text);
  };

  const handleDetailedSubmit = async (verdict: 'like' | 'dislike') => {
    if (judging || customFeedback.trim().length < 20) return;

    setAnimatingOut(verdict === 'like' ? 'right' : 'left');
    triggerHaptic('success');

    await new Promise(resolve => setTimeout(resolve, 200));
    await onJudge(verdict, customFeedback);
  };

  const handleSwipeAction = async (verdict: 'like' | 'dislike') => {
    if (judging) return;

    const feedback = isRoastMode
      ? (verdict === 'like' ? '🔥 This is actually fire.' : '💀 This ain\'t it.')
      : (verdict === 'like' ? '👍 Looks good!' : '👎 Could be better.');

    setAnimatingOut(verdict === 'like' ? 'right' : 'left');
    triggerHaptic('medium');

    await new Promise(resolve => setTimeout(resolve, 200));
    await onJudge(verdict, feedback);
  };

  const canSubmitDetailed = customFeedback.trim().length >= 20;
  const progressPercent = (responseCount / 3) * 100;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{
        opacity: animatingOut ? 0 : 1,
        y: 0,
        x: animatingOut === 'left' ? -100 : animatingOut === 'right' ? 100 : 0,
      }}
      style={prefersReducedMotion ? undefined : { x: animatingOut ? undefined : x, rotate: animatingOut ? (animatingOut === 'left' ? -5 : 5) : rotate }}
      drag={!prefersReducedMotion && !judging && !animatingOut ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDrag={prefersReducedMotion ? undefined : handleDrag}
      onDragEnd={prefersReducedMotion ? undefined : handleDragEnd}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative touch-pan-y cursor-grab active:cursor-grabbing"
    >
      {/* Swipe feedback overlays */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent to-green-500/20 rounded-2xl pointer-events-none z-10 flex items-center justify-end pr-8"
        style={{ opacity: likeOpacity }}
      >
        <div className="bg-green-500 text-white p-3 rounded-full shadow-lg">
          <Heart className="h-6 w-6" />
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-l from-transparent to-red-500/20 rounded-2xl pointer-events-none z-10 flex items-center justify-start pl-8"
        style={{ opacity: dislikeOpacity }}
      >
        <div className="bg-red-500 text-white p-3 rounded-full shadow-lg">
          <X className="h-6 w-6" />
        </div>
      </motion.div>
      {/* Header with category and time */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryConfig.gradient} flex items-center justify-center shadow-lg`}>
              <CategoryIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 capitalize">{item.category}</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{getTimeSinceCreated()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tier badge - shows earning potential */}
            {isPaidTier && (
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm ${tierBadge.className}`}>
                <TierIcon className="h-3 w-3" aria-hidden="true" />
                <span>{tierBadge.label}</span>
              </div>
            )}
            {isRoastMode && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <span>🔥</span>
                <span>ROAST</span>
              </div>
            )}
            <button
              onClick={onSkip}
              disabled={judging}
              aria-label="Skip to next request"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 disabled:opacity-50 active:scale-95"
            >
              <SkipForward className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Question */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">{displayQuestion}</h3>
        {displayContext && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{displayContext}</p>
        )}

        {/* Photo display */}
        {item.media_type === 'photo' && item.media_url && (
          <motion.button
            className="relative rounded-2xl overflow-hidden bg-gray-100 mb-4 cursor-pointer w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={() => setShowImageExpanded(!showImageExpanded)}
            aria-expanded={showImageExpanded}
            aria-label={showImageExpanded ? 'Collapse image' : 'Expand image to see full size'}
            layout={!prefersReducedMotion}
          >
            <img
              src={item.media_url}
              alt="Submission image for review"
              className={`w-full object-cover transition-all duration-300 ${
                showImageExpanded ? 'max-h-[600px]' : 'max-h-[300px]'
              }`}
              loading="lazy"
            />
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1" aria-hidden="true">
              <Eye className="h-3 w-3" />
              <span>{showImageExpanded ? 'Collapse' : 'Expand'}</span>
            </div>
          </motion.button>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">{responseCount}/3 verdicts</span>
              <span className="text-gray-400">{3 - responseCount} more needed</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${categoryConfig.gradient}`}
                initial={prefersReducedMotion ? false : { width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-4" role="tablist" aria-label="Feedback mode">
          <button
            onClick={() => setMode('quick')}
            role="tab"
            aria-selected={mode === 'quick'}
            aria-controls="quick-feedback-panel"
            className={`flex-1 py-2 px-4 min-h-[44px] rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
              mode === 'quick'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Quick Vote
            </span>
          </button>
          <button
            onClick={() => setMode('detailed')}
            role="tab"
            aria-selected={mode === 'detailed'}
            aria-controls="detailed-feedback-panel"
            className={`flex-1 py-2 px-4 min-h-[44px] rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
              mode === 'detailed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Write Feedback
            </span>
          </button>
        </div>
      </div>

      {/* Actions Area */}
      <AnimatePresence mode="wait">
        {mode === 'quick' ? (
          <motion.div
            key="quick"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className={`px-4 pb-4 pt-0 ${isRoastMode ? 'bg-gradient-to-b from-white to-red-50' : ''}`}
          >
            {/* Quick Response Selection */}
            {!selectedQuickResponse ? (
              <div className="space-y-3">
                {/* Positive responses */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                    {isRoastMode ? 'Actually good' : 'Positive feedback'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(isRoastMode ? QUICK_RESPONSES.roastPositive : QUICK_RESPONSES.positive).map((response, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSelect('positive', i)}
                        aria-label={`Positive response: ${response.text}`}
                        className="p-3 min-h-[72px] rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1"
                      >
                        <span className="text-lg mb-1 block" aria-hidden="true">{response.emoji}</span>
                        <span className="text-xs text-green-700 line-clamp-2">{response.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Negative responses */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3 text-red-500" />
                    {isRoastMode ? 'Needs work' : 'Constructive criticism'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(isRoastMode ? QUICK_RESPONSES.roastNegative : QUICK_RESPONSES.negative).map((response, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSelect('negative', i)}
                        aria-label={`Negative response: ${response.text}`}
                        className="p-3 min-h-[72px] rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                      >
                        <span className="text-lg mb-1 block" aria-hidden="true">{response.emoji}</span>
                        <span className="text-xs text-red-700 line-clamp-2">{response.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick swipe actions */}
                <div className="pt-2">
                  <p className="text-xs text-gray-400 text-center mb-2" id="quick-vote-label">Or quick vote:</p>
                  <div className="flex gap-3" role="group" aria-labelledby="quick-vote-label">
                    <button
                      onClick={() => handleSwipeAction('dislike')}
                      disabled={judging}
                      aria-label={isRoastMode ? 'Vote: Nope, not good' : 'Vote: Not good'}
                      className={`flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600 ${
                        isRoastMode
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                      } text-white shadow-lg hover:shadow-xl disabled:opacity-50`}
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                      <span>{isRoastMode ? 'Nope' : 'Not Good'}</span>
                    </button>
                    <button
                      onClick={() => handleSwipeAction('like')}
                      disabled={judging}
                      aria-label={isRoastMode ? 'Vote: Fire, looks good' : 'Vote: Looks good'}
                      className={`flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-600 ${
                        isRoastMode
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      } text-white shadow-lg hover:shadow-xl disabled:opacity-50`}
                    >
                      <Heart className="h-5 w-5" aria-hidden="true" />
                      <span>{isRoastMode ? 'Fire' : 'Looks Good'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Confirmation state */
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : undefined}
                className="space-y-3"
              >
                <div className={`p-4 rounded-xl border-2 ${
                  selectedQuickResponse.type === 'positive'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {(isRoastMode
                        ? (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.roastPositive : QUICK_RESPONSES.roastNegative)
                        : (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.positive : QUICK_RESPONSES.negative)
                      )[selectedQuickResponse.index].emoji}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${
                        selectedQuickResponse.type === 'positive' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Your feedback:
                      </p>
                      <p className={`text-sm ${
                        selectedQuickResponse.type === 'positive' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {(isRoastMode
                          ? (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.roastPositive : QUICK_RESPONSES.roastNegative)
                          : (selectedQuickResponse.type === 'positive' ? QUICK_RESPONSES.positive : QUICK_RESPONSES.negative)
                        )[selectedQuickResponse.index].text}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedQuickResponse(null)}
                    className="flex-1 py-3 min-h-[48px] rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-1"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleQuickSubmit}
                    disabled={judging}
                    aria-label="Submit your feedback"
                    className={`flex-1 py-3 min-h-[48px] rounded-xl font-semibold transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${
                      selectedQuickResponse.type === 'positive'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus-visible:ring-offset-green-600'
                        : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 focus-visible:ring-offset-red-600'
                    } text-white shadow-lg disabled:opacity-50`}
                  >
                    {judging ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" role="status" aria-label="Submitting verdict" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Detailed feedback mode */
          <motion.div
            key="detailed"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="px-4 pb-4 pt-0"
          >
            <div className="space-y-3">
              {/* Feedback textarea */}
              <div>
                <textarea
                  ref={textareaRef}
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  placeholder={isRoastMode
                    ? "Let them have it! Be brutal but helpful... 🔥"
                    : "Share your thoughts - be specific and helpful..."
                  }
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-offset-1 resize-none transition-all ${
                    customFeedback.length > 0 && customFeedback.length < 20
                      ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                      : customFeedback.length >= 20
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  } ${isRoastMode ? 'bg-red-50/50' : ''}`}
                  rows={4}
                  maxLength={500}
                />

                {/* Character guidance */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {customFeedback.length === 0 ? (
                      <span className="text-xs text-gray-400">Min 20 characters</span>
                    ) : customFeedback.length < 20 ? (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {20 - customFeedback.length} more needed
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Ready to submit!
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${
                    customFeedback.length > 450 ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {customFeedback.length}/500
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      customFeedback.length < 20 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    animate={{ width: `${Math.min((customFeedback.length / 100) * 100, 100)}%` }}
                    transition={prefersReducedMotion ? { duration: 0 } : undefined}
                  />
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3" role="group" aria-label="Submit your verdict">
                <button
                  onClick={() => handleDetailedSubmit('dislike')}
                  disabled={!canSubmitDetailed || judging}
                  aria-label="Submit as not good"
                  aria-disabled={!canSubmitDetailed || judging}
                  className={`flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                    canSubmitDetailed && !judging
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg focus-visible:ring-red-500'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ThumbsDown className="h-5 w-5" aria-hidden="true" />
                  <span>Not Good</span>
                </button>
                <button
                  onClick={() => handleDetailedSubmit('like')}
                  disabled={!canSubmitDetailed || judging}
                  aria-label="Submit as looks good"
                  aria-disabled={!canSubmitDetailed || judging}
                  className={`flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                    canSubmitDetailed && !judging
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg focus-visible:ring-green-500'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {judging ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" role="status" aria-label="Submitting verdict" />
                  ) : (
                    <>
                      <ThumbsUp className="h-5 w-5" aria-hidden="true" />
                      <span>Looks Good</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Credit info */}
      <div className={`px-4 py-3 border-t ${isRoastMode ? 'border-red-100 bg-red-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200" aria-label="Earn credits: 3 reviews equals 1 credit">
            <Zap className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-700">3 reviews = 1 credit</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
