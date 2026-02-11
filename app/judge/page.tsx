'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/database.types';
import JudgeProgression from '@/components/judge/JudgeProgression';
import { CrossRolePrompt } from '@/components/ui/CrossRolePrompt';

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
  DEFAULT_STATS,
  getJudgeLevel,
  getAchievements,
  type QueueRequest,
  type JudgeStats,
  type QueueFilter,
  type QueueSort,
  type EarningsTimeframe,
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
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [showQueueInfo, setShowQueueInfo] = useState(false);

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
          return 0;
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
            const statsRes = await fetch('/api/judge/stats', { signal: AbortSignal.timeout(10000) });
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats((prev) => ({ ...prev, ...statsData }));
            }
          } catch (statsError) {
            console.error('Stats fetch error:', statsError);
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
    fetchData();
  }, []);

  useEffect(() => {
    if (profile?.is_judge) {
      // Poll every 15 seconds for judge dashboard updates
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [profile?.is_judge]);

  // Generate mock earnings data
  useEffect(() => {
    const days = selectedTimeframe === 'daily' ? 24 : selectedTimeframe === 'weekly' ? 7 : 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      if (selectedTimeframe === 'daily') {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - i);
      }
      data.push({
        date: date.toISOString(),
        amount: Math.random() * 10 + 5 + (days - i) * 0.5,
      });
    }
    setEarningsData(data);
  }, [selectedTimeframe]);

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
  if (!profile.is_judge) return <NotQualifiedScreen />;

  const judgeLevel = getJudgeLevel(stats);
  const achievements = getAchievements(stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <EarningsOverview
            stats={stats}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            earningsData={earningsData}
          />
          <div className="space-y-6">
            <PerformanceMetrics stats={stats} />
            <NextMilestone />
          </div>
        </div>

        <div className="mb-8">
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

        {!profile?.is_judge ? (
          <NotReadyToJudge />
        ) : (
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

        {profile?.is_judge && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <VerdictHistoryCard stats={stats} />
            <ProTipsCard />
            {profile && <CrossRolePrompt currentRole="judge" userId={profile.id} variant="card" />}
          </div>
        )}
      </div>

      <DashboardStyles />
    </div>
  );
}

export default function JudgeDashboardPage() {
  return (
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
  );
}
