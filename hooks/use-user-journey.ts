import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserJourneyState {
  hasSubmittedRequest: boolean;
  hasReceivedFeedback: boolean;
  feedbackCount: number;
  hasSharedResult: boolean;
  hasTippedReviewer: boolean;
  hasUsedSplitTest: boolean;
  totalEngagementScore: number;
  verificationLevel: 'none' | 'basic' | 'verified';
  dismissedFeatures: string[];
}

interface JourneyTrigger {
  id: string;
  type: 'first_submission' | 'after_feedback' | 'multiple_photos' | 'high_engagement';
  conditions: (state: UserJourneyState) => boolean;
  cooldown: number; // Hours before showing again
  priority: number; // Higher = more important
}

const JOURNEY_TRIGGERS: JourneyTrigger[] = [
  {
    id: 'welcome_intro',
    type: 'first_submission',
    conditions: (state) => !state.hasSubmittedRequest && !state.dismissedFeatures.includes('welcome_intro'),
    cooldown: 24,
    priority: 10
  },
  {
    id: 'tipping_intro',
    type: 'after_feedback',
    conditions: (state) => 
      state.hasReceivedFeedback && 
      !state.hasTippedReviewer && 
      !state.dismissedFeatures.includes('tipping_intro'),
    cooldown: 72,
    priority: 8
  },
  {
    id: 'split_test_intro',
    type: 'multiple_photos',
    conditions: (state) => 
      state.feedbackCount >= 2 && 
      !state.hasUsedSplitTest && 
      !state.dismissedFeatures.includes('split_test_intro'),
    cooldown: 48,
    priority: 7
  },
  {
    id: 'sharing_intro',
    type: 'high_engagement',
    conditions: (state) => 
      state.totalEngagementScore >= 50 && 
      !state.hasSharedResult && 
      !state.dismissedFeatures.includes('sharing_intro'),
    cooldown: 24,
    priority: 6
  }
];

export function useUserJourney() {
  const [journeyState, setJourneyState] = useState<UserJourneyState | null>(null);
  const [activeIntro, setActiveIntro] = useState<JourneyTrigger | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Load user journey state
  useEffect(() => {
    async function loadJourneyState() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's activity data
        const [
          { data: requests },
          { data: tips },
          { data: splitTests },
          { data: shares },
          { data: profile }
        ] = await Promise.all([
          supabase
            .from('verdict_requests')
            .select('id, status, created_at')
            .eq('user_id', user.id),
          
          supabase
            .from('tips')
            .select('id')
            .eq('tipper_id', user.id),
          
          supabase
            .from('split_test_requests')
            .select('id')
            .eq('user_id', user.id),
          
          // Assuming we track shares in user_actions
          supabase
            .from('user_actions')
            .select('id')
            .eq('user_id', user.id)
            .eq('action', 'verdict_shared'),
          
          supabase
            .from('profiles')
            .select('journey_state, dismissed_features')
            .eq('id', user.id)
            .single()
        ]);

        // Calculate engagement score
        const completedRequests = requests?.filter(r => (r as any).status === 'closed') || [];
        const engagementScore = calculateEngagementScore({
          requestsSubmitted: requests?.length || 0,
          requestsCompleted: completedRequests.length,
          tipsGiven: tips?.length || 0,
          sharesCreated: shares?.length || 0,
          splitTestsCreated: splitTests?.length || 0
        });

        const state: UserJourneyState = {
          hasSubmittedRequest: (requests?.length || 0) > 0,
          hasReceivedFeedback: completedRequests.length > 0,
          feedbackCount: completedRequests.length,
          hasSharedResult: (shares?.length || 0) > 0,
          hasTippedReviewer: (tips?.length || 0) > 0,
          hasUsedSplitTest: (splitTests?.length || 0) > 0,
          totalEngagementScore: engagementScore,
          verificationLevel: (profile as any)?.verification_status || 'none',
          dismissedFeatures: (profile as any)?.dismissed_features || []
        };

        setJourneyState(state);

        // Check if we should trigger any intros
        checkForTriggers(state);

      } catch (error) {
        console.error('Error loading journey state:', error);
      } finally {
        setLoading(false);
      }
    }

    loadJourneyState();
  }, []);

  // Check for journey triggers
  const checkForTriggers = async (state: UserJourneyState) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get trigger history to respect cooldowns
    const { data: triggerHistory } = await supabase
      .from('user_journey_triggers')
      .select('trigger_id, last_shown_at')
      .eq('user_id', user.id);

    const now = new Date();
    
    // Find the highest priority trigger that should be shown
    const availableTriggers = JOURNEY_TRIGGERS.filter(trigger => {
      // Check conditions
      if (!trigger.conditions(state)) return false;

      // Check cooldown
      const foundTrigger = triggerHistory?.find(h => (h as any).trigger_id === trigger.id);
      const lastShown = foundTrigger ? (foundTrigger as any).last_shown_at : null;
      if (lastShown) {
        const cooldownEnd = new Date(lastShown);
        cooldownEnd.setHours(cooldownEnd.getHours() + trigger.cooldown);
        if (now < cooldownEnd) return false;
      }

      return true;
    });

    // Sort by priority and show the most important one
    availableTriggers.sort((a, b) => b.priority - a.priority);
    
    if (availableTriggers.length > 0) {
      setActiveIntro(availableTriggers[0]);
    }
  };

  // Calculate user engagement score
  const calculateEngagementScore = (metrics: {
    requestsSubmitted: number;
    requestsCompleted: number;
    tipsGiven: number;
    sharesCreated: number;
    splitTestsCreated: number;
  }) => {
    let score = 0;
    
    // Base activity points
    score += metrics.requestsSubmitted * 10;
    score += metrics.requestsCompleted * 15;
    score += metrics.tipsGiven * 20; // High value action
    score += metrics.sharesCreated * 25; // Viral action
    score += metrics.splitTestsCreated * 15;
    
    // Completion rate bonus
    if (metrics.requestsSubmitted > 0) {
      const completionRate = metrics.requestsCompleted / metrics.requestsSubmitted;
      score += completionRate * 20;
    }
    
    return score;
  };

  // Dismiss a feature intro
  const dismissFeature = async (featureId: string, permanent: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Record the dismissal
    try {
      await (supabase as any)
        .from('user_journey_triggers')
        .upsert({
          user_id: user.id,
          trigger_id: featureId,
          last_shown_at: new Date().toISOString(),
          dismissed_permanently: permanent
        });
    } catch (error) {
      console.log('user_journey_triggers table not found, skipping');
    }

    if (permanent) {
      // Add to dismissed features list
      const currentDismissed = journeyState?.dismissedFeatures || [];
      const updatedDismissed = [...currentDismissed, featureId];
      
      try {
        await (supabase as any)
          .from('profiles')
          .update({ dismissed_features: updatedDismissed })
          .eq('id', user.id);
      } catch (error) {
        console.log('dismissed_features field not found in profiles, skipping');
      }

      setJourneyState(prev => prev ? {
        ...prev,
        dismissedFeatures: updatedDismissed
      } : null);
    }

    setActiveIntro(null);
  };

  // Complete a feature intro (user took action)
  const completeFeature = async (featureId: string, action: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Record the completion
    try {
      await Promise.all([
        (supabase as any)
          .from('user_journey_triggers')
          .upsert({
            user_id: user.id,
            trigger_id: featureId,
            last_shown_at: new Date().toISOString(),
            completed: true,
            completion_action: action
          }),
        
        (supabase as any)
          .from('user_actions')
          .insert({
            user_id: user.id,
            action: 'feature_intro_completed',
            metadata: {
              feature_id: featureId,
              completion_action: action
            }
          })
      ]);
    } catch (error) {
      console.log('Database tables not found for journey tracking, skipping');
    }

    setActiveIntro(null);
  };

  // Trigger a specific intro manually
  const triggerIntro = (triggerId: string) => {
    const trigger = JOURNEY_TRIGGERS.find(t => t.id === triggerId);
    if (trigger) {
      setActiveIntro(trigger);
    }
  };

  return {
    journeyState,
    activeIntro,
    loading,
    dismissFeature,
    completeFeature,
    triggerIntro,
    refreshState: () => {
      if (journeyState) {
        checkForTriggers(journeyState);
      }
    }
  };
}