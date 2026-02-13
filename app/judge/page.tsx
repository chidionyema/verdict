'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/database.types';
import JudgeProgression from '@/components/judge/JudgeProgression';
import { CrossRolePrompt } from '@/components/ui/CrossRolePrompt';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';
import { NewJudgeWelcomeTour, useWelcomeTour } from '@/components/judge/NewJudgeWelcomeTour';
import { MilestoneCelebration, useMilestoneCheck } from '@/components/judge/MilestoneCelebration';
import { TierProgressIndicator } from '@/components/judge/TierProgressIndicator';
import { StreakRewards } from '@/components/judge/StreakRewards';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import {
  LoadingState,
  NotAuthenticatedScreen,
  NotQualifiedScreen,
  AchievementsModal,
  SubmissionSuccessBanner,
  DashboardHeader,
  EarningsOverview,
  PerformanceMetrics,
  NextMilestone,
  NotReadyToJudge,
  VerdictHistoryCard,
  ProTipsCard,
  DashboardStyles,
  QueueFilters,
  PremiumSpotlight,
  QueueLoading,
  QueueError,
  EmptyQueue,
  NoMatchingResults,
  RequestCard,
  JudgeDashboardTabs,
  CollapsibleStatsSection,
  DEFAULT_STATS,
  getJudgeLevel,
  getAchievements,
  type QueueRequest,
  type JudgeStats,
  type QueueFilter,
  type QueueSort,
  type EarningsTimeframe,
  type JudgeTabType,
} from '@/components/judge/dashboard';

export const dynamic = 'force-dynamic';

function JudgeDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const judgeRedirectPath = '/judge/qualify';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [queue, setQueue] = useState<QueueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [expertInfo, setExpertInfo] = useState<{ industry?: string; title?: string } | null>(null);
  const [queueType, setQueueType] = useState<'expert' | 'community'>('community');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [queueSort, setQueueSort] = useState<QueueSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<JudgeStats>(DEFAULT_STATS);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<EarningsTimeframe>('weekly');
  const [earningsData, setEarningsData] = useState<Array<{ date: string; amount: number }>>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [showQueueInfo, setShowQueueInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<JudgeTabType>('queue');

  // Check for submission success param
  useEffect(() => {
    const submitted = searchParams.get('submitted');
    const success = searchParams.get('success');
    if (submitted === 'true' || success === 'true' || success === 'comparison' || success === 'split_test') {
      setShowSubmissionSuccess(true);
      window.history.replaceState({}, '', '/judge');
    }
  }, [searchParams]);

  // Filter and sort queue
  const filteredQueue = queue
    .filter((request) => {
      if (queueFilter !== 'all' && request.category !== queueFilter) return false;
      if (searchQuery && !request.context.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (queueSort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'earnings':
          // Sort by request tier (expert > pro > standard > community)
          const tierPriority: Record<string, number> = {
            expert: 4,
            pro: 3,
            standard: 2,
            community: 1,
          };
          const aTier = tierPriority[a.request_tier || 'community'] || 1;
          const bTier = tierPriority[b.request_tier || 'community'] || 1;
          return bTier - aTier;
        default:
          return 0;
      }
    });

  const fetchData = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null; error: any };

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        if (profileData?.is_judge) {
          setQueueLoading(true);
          setQueueError(null);

          try {
            const res = await fetch('/api/judge/queue', { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
              const { requests, isExpert: isExpertResponse, expertInfo: expertInfoResponse, queueType: queueTypeResponse } = await res.json();
              setQueue(requests || []);
              setIsExpert(isExpertResponse || false);
              setExpertInfo(expertInfoResponse || null);
              setQueueType(queueTypeResponse || 'community');
            } else {
              setQueueError(res.status === 401 ? 'auth' : 'failed');
            }
          } catch (queueErr) {
            setQueueError(queueErr instanceof Error && queueErr.name === 'AbortError' ? 'timeout' : 'network');
          } finally {
            setQueueLoading(false);
          }

          try {
            setStatsError(null);
            const statsRes = await fetch('/api/judge/stats', { signal: AbortSignal.timeout(10000) });
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats((prev) => ({ ...prev, ...statsData }));
            } else {
              setStatsError('Unable to load your stats. Some data may be outdated.');
            }
          } catch (statsError) {
            console.error('Stats fetch error:', statsError);
            setStatsError(statsError instanceof Error && statsError.name === 'AbortError'
              ? 'Stats request timed out'
              : 'Failed to load stats');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (profile?.is_judge) {
      // Poll every 15 seconds for judge dashboard updates
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [profile?.is_judge]);

  // Fetch real earnings data from API
  useEffect(() => {
    const controller = new AbortController();

    async function fetchEarnings() {
      if (!profile?.is_judge) return;

      setEarningsLoading(true);
      try {
        const timeframeMap: Record<EarningsTimeframe, string> = {
          daily: '7d',
          weekly: '7d',
          monthly: '30d',
        };
        const apiTimeframe = timeframeMap[selectedTimeframe] || '30d';

        const res = await fetch(`/api/judge/earnings/chart?timeframe=${apiTimeframe}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const { data } = await res.json();
          setEarningsData(data || []);
        } else {
          // Fallback to empty data on error - don't break the UI
          setEarningsData([]);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Earnings fetch error:', err);
          setEarningsData([]);
        }
      } finally {
        setEarningsLoading(false);
      }
    }

    fetchEarnings();

    return () => controller.abort();
  }, [selectedTimeframe, profile?.is_judge]);

  const toggleJudge = async () => {
    if (!profile) return;
    setToggling(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_judge: !profile.is_judge }),
      });

      if (res.ok) {
        const { profile: updated } = await res.json();
        setProfile(updated);

        if (updated.is_judge) {
          const queueRes = await fetch('/api/judge/queue');
          if (queueRes.ok) {
            const { requests } = await queueRes.json();
            setQueue(requests || []);
          }
        } else {
          setQueue([]);
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!profile) return <NotAuthenticatedScreen redirectPath={judgeRedirectPath} />;

  // Require email verification for judges
  if (!(profile as any).email_verified) {
    return (
      <EmailVerificationGuard redirectTo="/judge" featureName="become a judge">
        <div />
      </EmailVerificationGuard>
    );
  }

  if (!profile.is_judge) return <NotQualifiedScreen />;

  const judgeLevel = getJudgeLevel(stats);
  const achievements = getAchievements(stats);

  // Check if this is a new judge (less than 5 verdicts)
  const isNewJudge = stats.verdicts_given < 5;

  return (
    <>
      {/* Welcome tour for new judges */}
      <NewJudgeTourWrapper userId={profile.id} />

      {/* Milestone celebration */}
      <MilestoneCelebrationWrapper stats={stats} />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation hint to unified dashboard */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowRight className="h-3 w-3 rotate-180" />
            Back to unified dashboard
          </Link>
          <span className="text-xs text-gray-400 hidden sm:block">
            Tip: Use the unified dashboard to see both your requests and judging in one place
          </span>
        </div>

        {showSubmissionSuccess && (
          <SubmissionSuccessBanner
            onDismiss={() => setShowSubmissionSuccess(false)}
            onRefresh={() => {
              setShowSubmissionSuccess(false);
              fetchData();
            }}
          />
        )}

        <DashboardHeader
          profile={profile}
          stats={stats}
          judgeLevel={judgeLevel}
          achievements={achievements}
          toggling={toggling}
          onToggleJudge={toggleJudge}
          onShowAchievements={() => setShowAchievements(true)}
        />

        {showAchievements && (
          <AchievementsModal
            achievements={achievements}
            onClose={() => setShowAchievements(false)}
          />
        )}

        {/* Tier Progress - compact version in header area */}
        <div className="mb-6">
          <TierProgressIndicator
            currentTier={judgeLevel.name}
            totalVerdicts={stats.verdicts_given}
            variant="compact"
          />
        </div>

        {/* Stats error notification */}
        {statsError && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3" role="alert">
            <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800">{statsError}</p>
            <button
              onClick={() => setStatsError(null)}
              className="ml-auto p-1 text-amber-600 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded"
              aria-label="Dismiss stats error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Section Tabs - Queue is now primary */}
        <JudgeDashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          queueCount={filteredQueue.length}
          className="mb-6"
        />

        {/* Tab Content */}
        {!profile?.is_judge ? (
          <NotReadyToJudge />
        ) : (
          <>
            {/* QUEUE TAB - Primary work area */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                <QueueFilters
                  isExpert={isExpert}
                  expertInfo={expertInfo}
                  queueType={queueType}
                  queueFilter={queueFilter}
                  setQueueFilter={setQueueFilter}
                  queueSort={queueSort}
                  setQueueSort={setQueueSort}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  showQueueInfo={showQueueInfo}
                  setShowQueueInfo={setShowQueueInfo}
                  queue={queue}
                  filteredQueueLength={filteredQueue.length}
                  onRefresh={fetchData}
                />

                <div className="space-y-4">
                  {filteredQueue.length > 0 && <PremiumSpotlight request={filteredQueue[0]} />}

                  {queueLoading && <QueueLoading />}

                  {queueError && !queueLoading && (
                    <QueueError
                      error={queueError}
                      onRetry={() => {
                        setQueueError(null);
                        fetchData();
                      }}
                    />
                  )}

                  {!queueLoading && !queueError && queue.length === 0 && <EmptyQueue onRefresh={fetchData} />}

                  {!queueLoading && !queueError && queue.length > 0 && filteredQueue.length === 0 && (
                    <NoMatchingResults
                      onClearFilters={() => {
                        setQueueFilter('all');
                        setSearchQuery('');
                      }}
                    />
                  )}

                  {!queueLoading && !queueError && filteredQueue.length > 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredQueue.slice(1).map((request) => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STATS TAB - Earnings & Performance */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <EarningsOverview
                    stats={stats}
                    selectedTimeframe={selectedTimeframe}
                    onTimeframeChange={setSelectedTimeframe}
                    earningsData={earningsData}
                    isLoading={earningsLoading}
                  />
                  <div className="space-y-6">
                    <PerformanceMetrics stats={stats} />
                    <StreakRewards
                      currentStreak={stats.streak_days}
                      longestStreak={stats.longest_streak ?? stats.streak_days}
                      streakAtRisk={stats.streak_at_risk}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VerdictHistoryCard stats={stats} />
                  <ProTipsCard qualityScore={stats.average_quality_score} />
                </div>

                {profile && (
                  <CrossRolePrompt currentRole="judge" userId={profile.id} variant="card" />
                )}
              </div>
            )}

            {/* PROGRESSION TAB - Level & Achievements */}
            {activeTab === 'progression' && (
              <div className="space-y-6">
                <JudgeProgression
                  userId={profile?.id || ''}
                  currentStats={{
                    totalVerdicts: stats.verdicts_given,
                    avgRating: stats.average_quality_score || 4.0,
                    helpfulnessScore: stats.completion_rate,
                    specializations: [stats.best_category],
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DashboardStyles />
    </div>
    </>
  );
}

// Wrapper component for welcome tour (needs hooks)
function NewJudgeTourWrapper({ userId }: { userId: string }) {
  const { showTour, completeTour, skipTour } = useWelcomeTour(userId);

  if (!showTour) return null;

  return (
    <NewJudgeWelcomeTour
      onComplete={completeTour}
      onSkip={skipTour}
    />
  );
}

// Wrapper component for milestone celebration (needs hooks)
function MilestoneCelebrationWrapper({ stats }: { stats: JudgeStats }) {
  const { milestone, clearMilestone } = useMilestoneCheck({
    verdicts_given: stats.verdicts_given,
    streak_days: stats.streak_days,
  });

  if (!milestone) return null;

  return (
    <MilestoneCelebration
      type={milestone}
      isOpen={true}
      onClose={clearMilestone}
      extraData={{
        streakDays: stats.streak_days,
      }}
    />
  );
}

export default function JudgeDashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading judge dashboard...</p>
            </div>
          </div>
        }
      >
        <JudgeDashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
