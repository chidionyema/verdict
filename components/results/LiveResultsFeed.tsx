'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Trophy,
  User,
  Star,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Image from 'next/image';

interface Verdict {
  id: string;
  created_at: string;
  chosen_photo: 'A' | 'B';
  confidence_score: number;
  reasoning: string;
  photo_a_rating: number;
  photo_b_rating: number;
  judge_tier?: string;
}

interface LiveResultsFeedProps {
  splitTestId: string;
  photoAUrl: string;
  photoBUrl: string;
  targetCount: number;
  onComplete?: () => void;
}

export function LiveResultsFeed({
  splitTestId,
  photoAUrl,
  photoBUrl,
  targetCount,
  onComplete,
}: LiveResultsFeedProps) {
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState<'A' | 'B' | 'tie' | null>(null);
  const [expandedVerdict, setExpandedVerdict] = useState<string | null>(null);
  const [newVerdictId, setNewVerdictId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const completionCheckedRef = useRef(false);

  const votesA = verdicts.filter((v) => v.chosen_photo === 'A').length;
  const votesB = verdicts.filter((v) => v.chosen_photo === 'B').length;
  const totalVotes = verdicts.length;
  const progress = targetCount > 0 ? (totalVotes / targetCount) * 100 : 0;

  // Check completion with current verdicts count
  const checkCompletion = useCallback(async (currentVerdicts: Verdict[]) => {
    const count = currentVerdicts.length;
    if (count >= targetCount && !completionCheckedRef.current) {
      completionCheckedRef.current = true;
      setIsComplete(true);

      // Calculate local winner
      const localVotesA = currentVerdicts.filter((v) => v.chosen_photo === 'A').length;
      const localVotesB = currentVerdicts.filter((v) => v.chosen_photo === 'B').length;

      try {
        // Fetch updated split test with winner
        const supabase = createClient();
        const { data } = await supabase
          .from('split_test_requests')
          .select('winning_photo, consensus_strength')
          .eq('id', splitTestId)
          .single();

        if (data?.winning_photo) {
          setWinner(data.winning_photo as 'A' | 'B' | 'tie');
        } else {
          // Calculate locally if not yet set
          const localWinner = localVotesA > localVotesB ? 'A' : localVotesB > localVotesA ? 'B' : 'tie';
          setWinner(localWinner);
        }
      } catch {
        // Fallback to local calculation
        const localWinner = localVotesA > localVotesB ? 'A' : localVotesB > localVotesA ? 'B' : 'tie';
        setWinner(localWinner);
      }

      onComplete?.();
    }
  }, [targetCount, splitTestId, onComplete]);

  // Fetch verdicts and subscribe to updates
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchVerdicts = async () => {
      try {
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('split_test_verdicts')
          .select('*')
          .eq('split_test_id', splitTestId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          setVerdicts(data);
          checkCompletion(data);
        }
      } catch (err) {
        setError('Failed to load verdicts. Please refresh.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerdicts();

    // Subscribe to new verdicts
    channel = supabase
      .channel(`split_test_${splitTestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'split_test_verdicts',
          filter: `split_test_id=eq.${splitTestId}`,
        },
        (payload) => {
          const newVerdict = payload.new as Verdict;
          setVerdicts((prev) => {
            const updated = [newVerdict, ...prev];
            // Check completion with updated list
            setTimeout(() => checkCompletion(updated), 0);
            return updated;
          });
          setNewVerdictId(newVerdict.id);
          setIsConnected(true);

          // Play sound notification (optional, with user preference check)
          if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }

          // Clear highlight after animation
          setTimeout(() => setNewVerdictId(null), 3000);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [splitTestId, checkCompletion]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data, error: fetchError } = await supabase
        .from('split_test_verdicts')
        .select('*')
        .eq('split_test_id', splitTestId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (data) {
        setVerdicts(data);
        checkCompletion(data);
      }
    } catch {
      setError('Failed to load verdicts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandToggle = (verdictId: string) => {
    setExpandedVerdict(expandedVerdict === verdictId ? null : verdictId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, verdictId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleExpandToggle(verdictId);
    }
  };

  const getJudgeTierBadge = (tier?: string) => {
    switch (tier) {
      case 'master':
        return { label: 'Master', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-100' };
      case 'expert':
        return { label: 'Expert', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' };
      case 'verified':
        return { label: 'Verified', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-100' };
      default:
        return null;
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-32" />
              <div className="h-6 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-20 bg-gray-100 rounded-lg" />
              <div className="h-20 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Unable to load results</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100">
              <Zap className="h-4 w-4 text-orange-600" aria-hidden="true" />
            </div>
            Live Results
          </h3>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <span
              className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}
              title={isConnected ? 'Connected - receiving live updates' : 'Disconnected - refresh to reconnect'}
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </span>

            {/* Status badge */}
            {isComplete ? (
              <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1.5 border border-green-200">
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Complete
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1.5 border border-orange-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                In Progress
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalVotes} of {targetCount} verdicts
            </span>
            <span className="font-semibold text-gray-900 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2.5 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Verdict collection progress"
          >
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Vote Distribution */}
        {totalVotes > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div
              className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 transition-transform hover:scale-[1.02]"
              role="region"
              aria-label="Photo A votes"
            >
              <div className="text-2xl sm:text-3xl font-bold text-green-600 tabular-nums">{votesA}</div>
              <div className="text-sm text-green-700 font-medium">Photo A</div>
              <div className="text-xs text-green-600 mt-0.5 tabular-nums">
                {totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 0}%
              </div>
            </div>
            <div
              className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 transition-transform hover:scale-[1.02]"
              role="region"
              aria-label="Photo B votes"
            >
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums">{votesB}</div>
              <div className="text-sm text-blue-700 font-medium">Photo B</div>
              <div className="text-xs text-blue-600 mt-0.5 tabular-nums">
                {totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Winner Announcement */}
        {isComplete && winner && (
          <div
            className={`mt-4 p-4 sm:p-5 rounded-xl text-center transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 ${
              winner === 'A'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : winner === 'B'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
            }`}
            role="alert"
            aria-live="polite"
          >
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white mx-auto mb-2 animate-bounce" aria-hidden="true" />
            <div className="text-white font-bold text-lg sm:text-xl">
              {winner === 'tie' ? "It's a Tie!" : `Photo ${winner} Wins!`}
            </div>
            {winner !== 'tie' && (
              <div className="text-white/80 text-sm mt-1">
                {Math.round(((winner === 'A' ? votesA : votesB) / totalVotes) * 100)}% of judges chose Photo {winner}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verdict Feed */}
      <div
        ref={listRef}
        className="divide-y divide-gray-100 max-h-[50vh] sm:max-h-96 overflow-y-auto"
        aria-live="polite"
        aria-label="Live verdict feed"
      >
        {verdicts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-7 w-7 text-gray-400 animate-pulse" aria-hidden="true" />
            </div>
            <div className="text-gray-700 font-medium">Waiting for verdicts...</div>
            <div className="text-gray-500 text-sm mt-1">
              Judges are reviewing your photos
            </div>
          </div>
        ) : (
          verdicts.map((verdict, index) => {
            const tierBadge = getJudgeTierBadge(verdict.judge_tier);
            const isNew = verdict.id === newVerdictId;
            const isExpanded = expandedVerdict === verdict.id;

            return (
              <div
                key={verdict.id}
                className={`transition-all duration-300 ${
                  isNew ? 'bg-orange-50 ring-2 ring-orange-200 ring-inset' : 'hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => handleExpandToggle(verdict.id)}
                  onKeyDown={(e) => handleKeyDown(e, verdict.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`verdict-details-${verdict.id}`}
                  className="w-full p-4 flex items-start gap-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  {/* Judge Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <User className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    </div>
                    {tierBadge && (
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${tierBadge.color} border-2 border-white flex items-center justify-center`}
                        title={tierBadge.label}
                      >
                        <Star className="h-2.5 w-2.5 text-white" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        Judge #{verdicts.length - index}
                      </span>
                      {tierBadge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tierBadge.bgLight} ${tierBadge.textColor} font-medium`}>
                          {tierBadge.label}
                        </span>
                      )}
                      {isNew && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white font-medium animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-sm font-medium ${
                          verdict.chosen_photo === 'A' ? 'text-green-600' : 'text-blue-600'
                        }`}
                      >
                        Chose Photo {verdict.chosen_photo}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                        {verdict.confidence_score}/10 confidence
                      </span>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </button>

                {/* Expanded Content */}
                <div
                  id={`verdict-details-${verdict.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-4 ml-14 space-y-3">
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                      &ldquo;{verdict.reasoning}&rdquo;
                    </p>
                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-green-200">
                          <Image
                            src={photoAUrl}
                            alt="Photo A thumbnail"
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-gray-600 font-medium">
                          A: <span className="text-green-600">{verdict.photo_a_rating}/10</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-blue-200">
                          <Image
                            src={photoBUrl}
                            alt="Photo B thumbnail"
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-gray-600 font-medium">
                          B: <span className="text-blue-600">{verdict.photo_b_rating}/10</span>
                        </span>
                      </div>
                    </div>
                    <time className="block text-xs text-gray-400" dateTime={verdict.created_at}>
                      {new Date(verdict.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
