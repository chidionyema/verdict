/**
 * Dynamic Role Elevation - Natural Progression System
 * 
 * Removes judge onboarding friction by treating judging as natural progression
 * instead of a "job application" process.
 */

export interface UserJourney {
  phase: 'explorer' | 'contributor' | 'helper' | 'judge' | 'expert' | 'master';
  actions_available: string[];
  next_unlock: {
    action: string;
    requirement: string;
    progress: number;
    total: number;
  };
}

export interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  unlock_condition: {
    type: 'engagement' | 'contribution' | 'quality' | 'time' | 'social';
    metric: string;
    threshold: number;
  };
  unlocks: {
    action: string;
    benefit: string;
  }[];
  celebration: {
    title: string;
    message: string;
    badge?: string;
    credits_bonus?: number;
  };
}

export const PROGRESSION_MILESTONES: ProgressionMilestone[] = [
  {
    id: 'first_request',
    name: 'First Explorer',
    description: 'Made your first request for feedback',
    unlock_condition: {
      type: 'engagement',
      metric: 'requests_created',
      threshold: 1
    },
    unlocks: [
      { action: 'view_other_requests', benefit: 'See how others ask for feedback' },
      { action: 'react_to_responses', benefit: 'Like and comment on verdicts' }
    ],
    celebration: {
      title: 'Welcome to AskVerdict! 🎉',
      message: 'You\'ve taken the first step. Now see how the community helps each other.',
      credits_bonus: 0
    }
  },
  
  {
    id: 'engaged_reader',
    name: 'Engaged Reader', 
    description: 'Actively reads and reacts to community content',
    unlock_condition: {
      type: 'engagement',
      metric: 'verdicts_read',
      threshold: 5
    },
    unlocks: [
      { action: 'casual_judging_prompt', benefit: 'Try giving quick feedback yourself' },
      { action: 'quality_metrics_visible', benefit: 'See what makes great feedback' }
    ],
    celebration: {
      title: 'Getting the Hang of It! 📖',
      message: 'You\'ve seen how good feedback works. Ready to try helping someone?',
      credits_bonus: 0
    }
  },

  {
    id: 'first_helper',
    name: 'First-Time Helper',
    description: 'Gave your first piece of feedback',
    unlock_condition: {
      type: 'contribution',
      metric: 'judgments_given',
      threshold: 1
    },
    unlocks: [
      { action: 'judgment_feedback', benefit: 'See how helpful your feedback was' },
      { action: 'credit_earning', benefit: 'Start earning credits for helping others' },
      { action: 'public_request_ability', benefit: 'Ask questions without spending credits' }
    ],
    celebration: {
      title: 'You\'re a Helper Now! 🤝',
      message: 'That felt good, didn\'t it? Your first judgment earned you 1 point toward a credit.',
      credits_bonus: 1
    }
  },

  {
    id: 'helpful_contributor',
    name: 'Helpful Contributor',
    description: 'Consistently provides helpful feedback',
    unlock_condition: {
      type: 'quality',
      metric: 'average_helpfulness_score',
      threshold: 3.5 // Out of 5
    },
    unlocks: [
      { action: 'priority_request_queue', benefit: 'See new requests before others' },
      { action: 'follow_users', benefit: 'Follow interesting request creators' },
      { action: 'private_request_discount', benefit: '50% off private requests' }
    ],
    celebration: {
      title: 'People Love Your Help! ⭐',
      message: 'Your feedback consistently helps people. You\'re becoming trusted.',
      badge: 'Helpful Contributor',
      credits_bonus: 1.0
    }
  },

  {
    id: 'community_judge',
    name: 'Community Judge',
    description: 'Regular, quality contributor to the community',
    unlock_condition: {
      type: 'contribution',
      metric: 'judgments_given',
      threshold: 10
    },
    unlocks: [
      { action: 'category_specialization', benefit: 'Specialize in topics you love' },
      { action: 'mentor_new_users', benefit: 'Help newcomers get started' },
      { action: 'enhanced_analytics', benefit: 'See detailed impact of your help' }
    ],
    celebration: {
      title: 'You\'re a Community Judge! ⚖️',
      message: 'You\'ve helped 10 people make better decisions. That\'s real impact.',
      badge: 'Community Judge',
      credits_bonus: 2.0
    }
  },

  {
    id: 'trusted_advisor',
    name: 'Trusted Advisor',
    description: 'High-quality feedback with strong community trust',
    unlock_condition: {
      type: 'quality',
      metric: 'consensus_rate',
      threshold: 0.75 // 75% agreement with other judges
    },
    unlocks: [
      { action: 'expert_queue_access', benefit: 'Judge requests that ask for experts' },
      { action: 'detailed_breakdown_tools', benefit: 'Advanced formatting for feedback' },
      { action: 'verdict_impact_tracking', benefit: 'See outcomes from your advice' }
    ],
    celebration: {
      title: 'You\'re a Trusted Advisor! 🏆',
      message: 'Your advice consistently aligns with community wisdom. People trust you.',
      badge: 'Trusted Advisor',
      credits_bonus: 3.0
    }
  },

  {
    id: 'expert_judge',
    name: 'Expert Judge',
    description: 'Recognized expert with significant impact',
    unlock_condition: {
      type: 'social',
      metric: 'verdict_implementations',
      threshold: 5 // 5 people followed their advice
    },
    unlocks: [
      { action: 'expert_judge_privileges', benefit: 'Access to highest-value requests' },
      { action: 'case_study_participation', benefit: 'Be featured in success stories' },
      { action: 'new_judge_mentoring', benefit: 'Guide the next generation' }
    ],
    celebration: {
      title: 'You\'re an Expert Judge! 👨‍⚖️',
      message: 'People don\'t just listen to you - they act on your advice. You change lives.',
      badge: 'Expert Judge',
      credits_bonus: 5.0
    }
  }
];

/**
 * Natural Progression Calculator
 * Determines user's current phase and next milestone
 */
export function calculateUserProgression(userData: {
  requests_created: number;
  verdicts_read: number;
  judgments_given: number;
  average_helpfulness_score: number;
  consensus_rate: number;
  verdict_implementations: number;
  days_active: number;
}): UserJourney {
  
  // Find completed milestones
  const completedMilestones = PROGRESSION_MILESTONES.filter(milestone => {
    const condition = milestone.unlock_condition;
    const userValue = userData[condition.metric as keyof typeof userData] || 0;
    return userValue >= condition.threshold;
  });

  // Find next milestone
  const nextMilestone = PROGRESSION_MILESTONES.find(milestone => {
    const condition = milestone.unlock_condition;
    const userValue = userData[condition.metric as keyof typeof userData] || 0;
    return userValue < condition.threshold;
  });

  // Determine current phase
  let phase: UserJourney['phase'] = 'explorer';
  if (completedMilestones.length >= 6) phase = 'master';
  else if (completedMilestones.length >= 5) phase = 'expert';
  else if (completedMilestones.length >= 4) phase = 'judge';
  else if (completedMilestones.length >= 2) phase = 'helper';
  else if (completedMilestones.length >= 1) phase = 'contributor';

  // Calculate available actions
  const actions_available = completedMilestones.reduce((actions, milestone) => {
    const newActions = milestone.unlocks.map(unlock => unlock.action);
    return [...actions, ...newActions];
  }, ['create_request'] as string[]); // Everyone can create requests

  // Calculate next unlock progress
  let next_unlock = {
    action: 'Complete your journey',
    requirement: 'You\'ve unlocked everything!',
    progress: 100,
    total: 100
  };

  if (nextMilestone) {
    const condition = nextMilestone.unlock_condition;
    const userValue = userData[condition.metric as keyof typeof userData] || 0;
    next_unlock = {
      action: nextMilestone.unlocks[0].action,
      requirement: nextMilestone.description,
      progress: userValue,
      total: condition.threshold
    };
  }

  return {
    phase,
    actions_available,
    next_unlock
  };
}

/**
 * Contextual Progression Prompts
 * Non-intrusive prompts that appear at natural moments
 */
export interface ProgressionPrompt {
  id: string;
  trigger_context: string;
  title: string;
  message: string;
  action_text: string;
  action_url: string;
  dismissible: boolean;
}

export function getContextualPrompt(
  userProgression: UserJourney,
  currentContext: string
): ProgressionPrompt | null {
  
  const prompts: Record<string, ProgressionPrompt[]> = {
    'viewing_verdict': [
      {
        id: 'first_judgment_prompt',
        trigger_context: 'viewing_verdict',
        title: 'You could help too!',
        message: 'You understand this topic. Want to share your perspective?',
        action_text: 'Add Your Take',
        action_url: '#respond',
        dismissible: true
      }
    ],
    
    'request_completed': [
      {
        id: 'help_others_prompt',
        trigger_context: 'request_completed',
        title: 'Pay it forward?',
        message: 'You just got great help. Help someone else get the same feeling.',
        action_text: 'Help Someone',
        action_url: '/judge',
        dismissible: true
      }
    ],

    'dashboard_idle': [
      {
        id: 'judge_suggestion',
        trigger_context: 'dashboard_idle',
        title: 'People need your expertise',
        message: 'There are 3 requests in your specialty waiting for input.',
        action_text: 'Take a Look',
        action_url: '/judge?category=your_specialty',
        dismissible: true
      }
    ]
  };

  const contextPrompts = prompts[currentContext] || [];
  
  // Filter prompts based on user progression
  const availablePrompts = contextPrompts.filter(prompt => {
    if (prompt.id === 'first_judgment_prompt' && userProgression.phase !== 'explorer') {
      return false; // Only show to explorers
    }
    
    if (prompt.id === 'help_others_prompt' && userProgression.actions_available.includes('casual_judging_prompt')) {
      return true; // Show to users who can judge
    }
    
    return true;
  });

  return availablePrompts[0] || null;
}

/**
 * Micro-Interactions for Progression
 * Small UI elements that encourage natural progression
 */
export function getProgressionMicroInteractions(userProgression: UserJourney) {
  const interactions = [];

  // Show reading progress for explorers
  if (userProgression.phase === 'explorer') {
    interactions.push({
      type: 'reading_progress',
      message: `You've read ${userProgression.next_unlock.progress}/${userProgression.next_unlock.total} verdicts`,
      visual: 'progress_bar'
    });
  }

  // Show helpful score for new helpers
  if (userProgression.phase === 'helper') {
    interactions.push({
      type: 'helpfulness_score',
      message: 'People found your feedback helpful!',
      visual: 'star_animation'
    });
  }

  // Show impact metrics for judges
  if (userProgression.phase === 'judge' || userProgression.phase === 'expert') {
    interactions.push({
      type: 'impact_counter',
      message: '3 people implemented your advice this week',
      visual: 'impact_graph'
    });
  }

  return interactions;
}

/**
 * Anti-Patterns to Avoid
 */
export const PROGRESSION_ANTI_PATTERNS = {
  // DON'T: Gate basic features behind judging
  gating_basic_features: false,
  
  // DON'T: Require "applications" or "interviews"
  require_applications: false,
  
  // DON'T: Make judging feel like work
  work_like_language: false,
  
  // DON'T: Overwhelming onboarding flows
  complex_onboarding: false,
  
  // DO: Natural, gradual progression
  natural_progression: true,
  
  // DO: Immediate value from first action
  immediate_value: true,
  
  // DO: Celebration of contributions
  celebrate_contributions: true
};

/**
 * Implementation Notes:
 * 
 * 1. REMOVE current judge "application" process
 * 2. REPLACE with automatic progression system
 * 3. SHOW progression status in dashboard
 * 4. ADD contextual prompts throughout app
 * 5. CELEBRATE each milestone with micro-animations
 * 6. TRACK progression metrics in analytics
 */