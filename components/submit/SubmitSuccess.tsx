'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Eye, Share2, Bell, Sparkles, Users, Gavel, DollarSign, PartyPopper, Trophy, Star, Shield, Lock, RefreshCw, Coins, AlertTriangle } from 'lucide-react';
import { SubmissionData, TIERS, CATEGORIES } from './types';
import { Confetti, playSuccessSound, triggerHaptic } from '@/components/ui/Confetti';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface SubmitSuccessProps {
  requestId: string;
  data: SubmissionData;
  creditsUsed: number;
  isFirstSubmission?: boolean;
}

// First submission celebration modal
function FirstSubmissionCelebration({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Celebration header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-8 text-white text-center relative overflow-hidden">
          {/* Floating emojis */}
          <motion.div
            className="absolute top-4 left-8"
            animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-3xl">🎉</span>
          </motion.div>
          <motion.div
            className="absolute top-6 right-10"
            animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-2xl">✨</span>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <PartyPopper className="h-10 w-10" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">First Request Submitted!</h2>
          <p className="text-white/80">You are officially part of the Verdict community</p>
        </div>

        {/* Achievement unlocked */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Achievement Unlocked!</p>
                <p className="text-sm text-amber-700">First Steps - Submit your first request</p>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700">What happens next:</p>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <p className="text-sm text-gray-600">Judges see your request and start writing feedback</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-600">2</span>
              </div>
              <p className="text-sm text-gray-600">You get notified as each verdict arrives (~2hr avg)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <p className="text-sm text-gray-600">Rate the feedback to help improve quality</p>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SubmitSuccess({ requestId, data, creditsUsed, isFirstSubmission = false }: SubmitSuccessProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFirstSubmissionModal, setShowFirstSubmissionModal] = useState(isFirstSubmission);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  const tier = TIERS.find(t => t.id === data.tier);
  const category = CATEGORIES.find(c => c.id === data.category);

  const isLowCredits = remainingCredits !== null && remainingCredits <= 2;
  const isNoCredits = remainingCredits === 0;

  // Trigger celebration and fetch remaining credits on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowConfetti(true);
    triggerHaptic('success');
    playSuccessSound();

    // Check if this is user's first submission from localStorage
    const hasSubmittedBefore = localStorage.getItem('verdict_has_submitted');
    if (!hasSubmittedBefore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFirstSubmissionModal(true);
      localStorage.setItem('verdict_has_submitted', 'true');
    }

    // Fetch remaining credits
    async function fetchCredits() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single() as { data: { credits: number } | null };
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRemainingCredits(profile?.credits ?? 0);
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err);
      }
    }
    fetchCredits();
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* First submission celebration modal */}
      <AnimatePresence>
        {showFirstSubmissionModal && (
          <FirstSubmissionCelebration onContinue={() => setShowFirstSubmissionModal(false)} />
        )}
      </AnimatePresence>

      {/* Confetti effect */}
      <Confetti active={showConfetti} duration={4000} pieces={100} />

      <div className="max-w-lg w-full mx-auto text-center">
        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-once">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25" />
        </div>

        {/* Main message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Request Submitted!
        </h1>
        <p className="text-gray-600 mb-8">
          {tier?.verdictCount} judges are being matched to your request
        </p>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 text-left">
          <div className="flex items-start gap-4 mb-4">
            {/* Display images based on request type */}
            {data.mediaType === 'photo' && data.mediaUrls.length > 0 && (
              data.requestType === 'comparison' || data.requestType === 'split_test' ? (
                // Show both images side by side for comparisons and split tests
                <div className="flex gap-2">
                  {data.mediaUrls[0] && (
                    <div className="relative">
                      <img
                        src={data.mediaUrls[0]}
                        alt={data.requestType === 'comparison' ? 'Option A' : 'Photo A'}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-green-400"
                      />
                      <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        A
                      </span>
                    </div>
                  )}
                  {data.mediaUrls[1] && (
                    <div className="relative">
                      <img
                        src={data.mediaUrls[1]}
                        alt={data.requestType === 'comparison' ? 'Option B' : 'Photo B'}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-blue-400"
                      />
                      <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        B
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Single image for standard requests
                <img
                  src={data.mediaUrls[0]}
                  alt="Your submission"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )
            )}
            {data.mediaType === 'text' && (
              <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category?.icon}</span>
                <span className="font-medium text-gray-900">{category?.name}</span>
                {(data.requestType === 'comparison' || data.requestType === 'split_test') && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    data.requestType === 'comparison'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {data.requestType === 'comparison' ? 'A/B Comparison' : 'Split Test'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{data.context}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{tier?.verdictCount}</p>
              <p className="text-xs text-gray-500">Verdicts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{tier?.turnaround}</p>
              <p className="text-xs text-gray-500">Est. Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{creditsUsed}</p>
              <p className="text-xs text-gray-500">Credits Used</p>
            </div>
          </div>
        </div>

        {/* Credit Balance Status */}
        {remainingCredits !== null && (
          <div className={`rounded-xl p-4 mb-6 ${
            isNoCredits
              ? 'bg-red-50 border border-red-200'
              : isLowCredits
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isNoCredits ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Coins className={`h-5 w-5 ${isLowCredits ? 'text-amber-600' : 'text-green-600'}`} />
                )}
                <div>
                  <p className={`font-semibold ${
                    isNoCredits ? 'text-red-800' : isLowCredits ? 'text-amber-800' : 'text-green-800'
                  }`}>
                    {isNoCredits
                      ? 'No credits remaining'
                      : `${remainingCredits} credit${remainingCredits !== 1 ? 's' : ''} remaining`}
                  </p>
                  <p className={`text-sm ${
                    isNoCredits ? 'text-red-600' : isLowCredits ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {isNoCredits || isLowCredits
                      ? 'Earn or buy credits for your next submission'
                      : 'Ready for more submissions'}
                  </p>
                </div>
              </div>
              {isLowCredits && (
                <Link
                  href="/credits"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isNoCredits
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  Get More
                </Link>
              )}
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>Judges review your submission and write detailed feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>We will notify you as each verdict comes in</span>
            </li>
            <li className="flex items-start gap-2">
              <Share2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>View all feedback on your request page</span>
            </li>
          </ul>
        </div>

        {/* Judge while you wait CTA */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gavel className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 mb-1">Earn while you wait</h3>
              <p className="text-sm text-gray-600 mb-3">
                Help others by judging their requests and earn money. Most verdicts take just 1-2 minutes.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Earn $0.60-$2.00 per verdict
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Help real people get feedback
                </span>
              </div>
              <button
                onClick={() => router.push('/judge')}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Gavel className="h-4 w-4" />
                Start Judging
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              // Route to the correct page based on request type
              if (data.requestType === 'comparison') {
                router.push(`/comparisons/${requestId}`);
              } else if (data.requestType === 'split_test') {
                router.push(`/split-tests/${requestId}`);
              } else {
                router.push(`/requests/${requestId}`);
              }
            }}
            className="w-full py-4 min-h-[56px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            View Your {data.requestType === 'comparison' ? 'Comparison' : data.requestType === 'split_test' ? 'Split Test' : 'Request'}
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => router.push('/submit')}
            className="w-full py-3 min-h-[48px] bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Submit Another Request
          </button>
        </div>

        {/* Trust indicators */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mt-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-green-700">
              <Shield className="h-4 w-4" />
              Anonymous & Secure
            </span>
            <span className="text-green-300">|</span>
            <span className="inline-flex items-center gap-1.5 text-green-700">
              <Lock className="h-4 w-4" />
              Data Protected
            </span>
            <span className="text-green-300">|</span>
            <span className="inline-flex items-center gap-1.5 text-green-700">
              <RefreshCw className="h-4 w-4" />
              3 Verdicts Guaranteed
            </span>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-green-600">
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
            <span className="text-green-300">|</span>
            <Link href="/legal/terms" className="hover:underline">Refund Policy</Link>
            <span className="text-green-300">|</span>
            <Link href="/legal/community-guidelines" className="hover:underline">Guidelines</Link>
          </div>
        </div>

        {/* Request ID for reference */}
        <p className="text-xs text-gray-400 mt-6">
          Request ID: {requestId}
        </p>
      </div>
    </div>
  );
}

