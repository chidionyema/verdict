'use client';

import { useEffect } from 'react';
import { useUserJourney } from '@/hooks/use-user-journey';
import { ContextualFeatureIntro } from './ContextualFeatureIntro';

interface JourneyAwareLayoutProps {
  children: React.ReactNode;
  page?: 'home' | 'submit' | 'results' | 'feed' | 'dashboard';
  context?: {
    hasMultiplePhotos?: boolean;
    feedbackReceived?: boolean;
    highEngagement?: boolean;
    firstTime?: boolean;
  };
}

export function JourneyAwareLayout({ 
  children, 
  page = 'home',
  context = {} 
}: JourneyAwareLayoutProps) {
  const { 
    journeyState, 
    activeIntro, 
    loading,
    dismissFeature,
    completeFeature,
    triggerIntro,
    refreshState
  } = useUserJourney();

  // Trigger context-specific intros based on page and context
  useEffect(() => {
    if (!journeyState || loading) return;

    // Page-specific trigger logic
    switch (page) {
      case 'submit':
        if (!journeyState.hasSubmittedRequest && context.firstTime) {
          triggerIntro('welcome_intro');
        } else if (context.hasMultiplePhotos && !journeyState.hasUsedSplitTest) {
          triggerIntro('split_test_intro');
        }
        break;

      case 'results':
        if (context.feedbackReceived && !journeyState.hasTippedReviewer) {
          // Delay showing tip intro to let user read feedback first
          setTimeout(() => triggerIntro('tipping_intro'), 5000);
        } else if (context.highEngagement && !journeyState.hasSharedResult) {
          setTimeout(() => triggerIntro('sharing_intro'), 3000);
        }
        break;

      case 'dashboard':
        if (journeyState.totalEngagementScore >= 50 && !journeyState.hasSharedResult) {
          triggerIntro('sharing_intro');
        }
        break;
    }
  }, [journeyState, page, context, loading]);

  // Track page views for journey analytics
  useEffect(() => {
    if (journeyState && !loading) {
      // Track significant page views
      const significantPages = ['submit', 'results', 'dashboard'];
      if (significantPages.includes(page)) {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'page_view',
            page,
            context
          })
        }).catch(console.error);
      }
    }
  }, [page, journeyState, loading]);

  const handleFeatureDismiss = async (permanent = false) => {
    if (activeIntro) {
      await dismissFeature(activeIntro.id, permanent);
    }
  };

  const handleFeatureComplete = async (action: string) => {
    if (activeIntro) {
      await completeFeature(activeIntro.id, action);
      refreshState(); // Refresh to potentially trigger next feature
    }
  };

  return (
    <>
      {children}
      
      {/* Contextual Feature Intro Overlay */}
      {activeIntro && !loading && (
        <ContextualFeatureIntro
          trigger={activeIntro.type}
          onDismiss={() => handleFeatureDismiss(false)}
          onComplete={() => handleFeatureComplete('completed')}
        />
      )}
    </>
  );
}