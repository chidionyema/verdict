'use client';

import { ModeCard } from './ModeCard';
import { ModeButton } from './ModeButton';
import { ExpertCredentialsBadge } from '@/components/experts/ExpertCredentialsBadge';
import { ArrowRight, Eye, Lock, Shield, Star } from 'lucide-react';
import { useLocalizedPricing } from '@/hooks/use-pricing';
import type { Mode } from '@/lib/mode-colors';

interface ModeSelectionCardsProps {
  onSelectMode: (mode: Mode) => void;
  selectedMode?: Mode;
  className?: string;
}

const COMMUNITY_FEATURES = [
  '✅ No payment required',
  '✅ Community participation',
  '✅ Earn unlimited credits',
  '⏱️ Requires ~15 minutes (judging)',
  '👁️ Public (appears in feed)',
];

const EXPERT_FEATURES = [
  '🎯 Industry professionals only',
  '⚡ Premium quality feedback',
  '🛡️ Verified expert credentials',
  '⏰ Fast turnaround (under 1 hour)',
  '🔒 Completely private',
];


export function ModeSelectionCards({ 
  onSelectMode, 
  selectedMode,
  className = '' 
}: ModeSelectionCardsProps) {
  const pricing = useLocalizedPricing();

  const privateFeatures = [
    '✅ No time required',
    '✅ Completely private', 
    '✅ Faster responses (within 2 hours)',
    '✅ Skip judging entirely',
    `💰 Costs ${pricing.privatePrice} per request`,
  ];

  const expertFeatures = [
    ...EXPERT_FEATURES,
    `💰 Costs £8.99 per request`,
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Community Mode Card */}
      <ModeCard
        mode="community"
        title="Public Submission"
        description="Judge others to earn credits. Use credits to submit your own requests. Perfect if you have time and want to participate."
        features={COMMUNITY_FEATURES}
        onClick={() => onSelectMode('community')}
        selected={selectedMode === 'community'}
      >
        <ModeButton
          mode="community"
          onClick={(e) => {
            e.stopPropagation();
            onSelectMode('community');
          }}
          className="w-full mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <Eye className="h-5 w-5" />
            Start Judging (Free)
            <ArrowRight className="h-4 w-4" />
          </span>
        </ModeButton>
      </ModeCard>

      {/* Expert Mode Card */}
      <ModeCard
        mode="expert" 
        title="Expert Feedback"
        description="Get feedback from verified industry professionals with proven expertise in your field."
        features={expertFeatures}
        onClick={() => onSelectMode('expert' as Mode)}
        selected={selectedMode === 'expert'}
      >
        <div className="mt-3 mb-4">
          <ExpertCredentialsBadge showDetails={false} />
        </div>
        
        <ModeButton
          mode="expert"
          onClick={(e) => {
            e.stopPropagation();
            onSelectMode('expert' as Mode);
          }}
          className="w-full mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Get Expert Feedback (£8.99)
            <ArrowRight className="h-4 w-4" />
          </span>
        </ModeButton>

        {/* Expert Credentials Preview */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-900 font-medium mb-2">
            🎯 You'll get feedback from experts like:
          </div>
          <div className="space-y-1 text-xs text-blue-800">
            <div>• Google UX Designer (4.9★, 127 reviews)</div>
            <div>• Stripe Marketing Head (4.8★, 89 reviews)</div>
            <div>• Stanford Psychologist (5.0★, 156 reviews)</div>
          </div>
        </div>
      </ModeCard>

      {/* Private Mode Card */}
      <ModeCard
        mode="private"
        title="Private Submission"
        description={`Pay ${pricing.privatePrice} to skip judging and submit privately. Get instant, confidential results. Perfect if you're in a hurry or need privacy.`}
        features={privateFeatures}
        onClick={() => onSelectMode('private')}
        selected={selectedMode === 'private'}
      >
        <ModeButton
          mode="private"
          onClick={(e) => {
            e.stopPropagation();
            onSelectMode('private');
          }}
          className="w-full mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Submit Privately ({pricing.privatePrice})
            <ArrowRight className="h-4 w-4" />
          </span>
        </ModeButton>
      </ModeCard>
    </div>
  );
}

