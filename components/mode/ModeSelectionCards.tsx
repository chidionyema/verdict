'use client';

import { ModeCard } from './ModeCard';
import { ModeButton } from './ModeButton';
import { ArrowRight, Eye, Lock } from 'lucide-react';
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
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
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

