'use client';

import { useState, useEffect } from 'react';
import { Check, Star, Zap, Shield, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TouchButton } from '@/components/ui/touch-button';
import UpgradePrompt from '@/components/billing/UpgradePrompt';

export type RequestTier = 'community' | 'standard' | 'pro' | 'enterprise';

interface PricingTier {
  tier: RequestTier;
  display_name: string;
  price_pence: number;
  credits_required: number;
  verdict_count: number;
  features: string[];
  reviewer_requirements: {
    min_reputation: number;
    expert_only: boolean;
    industry_match?: boolean;
  };
  turnaround_minutes: number;
}

interface PricingTiersProps {
  selectedTier: RequestTier;
  onSelectTier: (tier: RequestTier) => void;
  userCredits?: number;
  showRecommended?: boolean;
  compact?: boolean;
  currentUserTier?: 'community' | 'standard' | 'pro';
  onUpgrade?: (tierId: 'standard' | 'pro') => void;
}

const tierIcons = {
  community: Zap,
  standard: Star, 
  pro: Shield,
  enterprise: MessageSquare
};

const tierColors = {
  community: 'border-gray-200 bg-gray-50',
  standard: 'border-blue-200 bg-blue-50',
  pro: 'border-purple-200 bg-purple-50',
  enterprise: 'border-gold-200 bg-gold-50'
};

const tierHighlightColors = {
  community: 'border-gray-400 bg-white shadow-lg',
  standard: 'border-blue-400 bg-white shadow-lg',
  pro: 'border-purple-400 bg-white shadow-lg',
  enterprise: 'border-gold-400 bg-white shadow-lg'
};

export function PricingTiers({ 
  selectedTier, 
  onSelectTier, 
  userCredits = 0,
  showRecommended = true,
  compact = false,
  currentUserTier = 'community',
  onUpgrade
}: PricingTiersProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<RequestTier | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadTiers() {
      try {
        const { data, error } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('active', true)
          .order('price_pence', { ascending: true });

        if (error) throw error;
        
        setTiers(data || []);
      } catch (error) {
        console.error('Error loading pricing tiers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTiers();
  }, []);

  const formatPrice = (pence: number) => {
    if (pence === 0) return 'Free';
    return `£${(pence / 100).toFixed(2)}`;
  };

  const canAffordTier = (tier: PricingTier) => {
    if (tier.price_pence > 0) return true; // Paid tiers always "affordable" via Stripe
    return userCredits >= tier.credits_required;
  };

  const canAccessTier = (tier: PricingTier) => {
    const tierOrder = { community: 0, standard: 1, pro: 2, enterprise: 3 };
    return tierOrder[currentUserTier] >= tierOrder[tier.tier as keyof typeof tierOrder];
  };

  const handleTierSelect = (tier: PricingTier) => {
    if (!canAccessTier(tier) && tier.tier !== 'community') {
      // Show upgrade prompt for locked tiers
      setShowUpgradePrompt(tier.tier);
      return;
    }
    
    if (canAffordTier(tier)) {
      onSelectTier(tier.tier);
    }
  };

  const handleUpgradeFromPrompt = (tierId: 'standard' | 'pro') => {
    setShowUpgradePrompt(null);
    if (onUpgrade) {
      onUpgrade(tierId);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {tiers.filter(t => t.tier !== 'enterprise').map((tier) => {
          const Icon = tierIcons[tier.tier];
          const isSelected = selectedTier === tier.tier;
          const affordable = canAffordTier(tier);
          
          return (
            <label key={tier.tier} className="relative block">
              <input
                type="radio"
                name="tier"
                value={tier.tier}
                checked={isSelected}
                onChange={() => handleTierSelect(tier)}
                className="sr-only"
                disabled={!affordable && tier.credits_required > 0}
              />
              <div className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all
                ${isSelected ? tierHighlightColors[tier.tier] : tierColors[tier.tier]}
                ${!affordable && tier.credits_required > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${
                      tier.tier === 'pro' ? 'text-purple-600' :
                      tier.tier === 'standard' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{tier.display_name}</h3>
                      <p className="text-sm text-gray-600">
                        {tier.verdict_count} reviews • {tier.turnaround_minutes} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {tier.price_pence === 0 ? (
                        <span className="text-gray-900">{tier.credits_required} credit</span>
                      ) : (
                        <span className="text-gray-900">{formatPrice(tier.price_pence)}</span>
                      )}
                    </div>
                    {tier.tier === 'pro' && (
                      <span className="text-xs text-purple-600 font-medium">Expert only</span>
                    )}
                  </div>
                </div>
              </div>
              {tier.tier === 'pro' && showRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Recommended
                </span>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.filter(t => t.tier !== 'enterprise').map((tier) => {
        const Icon = tierIcons[tier.tier];
        const isSelected = selectedTier === tier.tier;
        const affordable = canAffordTier(tier);
        const isRecommended = tier.tier === 'pro';
        
        return (
          <div key={tier.tier} className="relative">
            {isRecommended && showRecommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-purple-600 text-white text-sm px-4 py-1 rounded-full font-medium shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className={`
              h-full p-6 rounded-xl border-2 transition-all cursor-pointer
              ${isSelected ? tierHighlightColors[tier.tier] : 'border-gray-200 bg-white'}
              ${!affordable && tier.credits_required > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              ${isRecommended ? 'ring-2 ring-purple-200' : ''}
            `}
            onClick={() => handleTierSelect(tier)}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  tier.tier === 'pro' ? 'bg-purple-100' :
                  tier.tier === 'standard' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    tier.tier === 'pro' ? 'text-purple-600' :
                    tier.tier === 'standard' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.display_name}</h3>
                
                <div className="text-3xl font-bold text-gray-900">
                  {tier.price_pence === 0 ? (
                    <span>{tier.credits_required} Credit</span>
                  ) : (
                    <span>{formatPrice(tier.price_pence)}</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  {tier.verdict_count} expert reviews
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      tier.tier === 'pro' ? 'text-purple-600' :
                      tier.tier === 'standard' ? 'text-blue-600' :
                      'text-green-600'
                    }`} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Reviewer Quality */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{tier.turnaround_minutes} min turnaround</span>
                </div>
                
                {tier.reviewer_requirements.expert_only && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 mt-2">
                    <Shield className="h-4 w-4" />
                    <span>Verified experts only</span>
                  </div>
                )}
                
                {tier.reviewer_requirements.min_reputation > 0 && !tier.reviewer_requirements.expert_only && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                    <Star className="h-4 w-4" />
                    <span>{tier.reviewer_requirements.min_reputation}+ rating required</span>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <TouchButton
                className={`w-full mt-6 ${
                  isSelected 
                    ? 'bg-gray-900 text-white' 
                    : tier.tier === 'pro' 
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                disabled={!affordable && tier.credits_required > 0}
              >
                {isSelected ? 'Selected' : 'Select'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </TouchButton>
            </div>
          </div>
        );
      })}
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && showUpgradePrompt !== 'community' && onUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <UpgradePrompt
              trigger="tier_limit"
              currentTier={currentUserTier}
              targetTier={showUpgradePrompt as 'standard' | 'pro'}
              feature={showUpgradePrompt === 'pro' ? 'Professional tier features' : 'Standard tier features'}
              onClose={() => setShowUpgradePrompt(null)}
              onUpgrade={handleUpgradeFromPrompt}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified tier selector for mobile
export function TierSelector({ 
  selectedTier, 
  onSelectTier,
  disabled = false
}: {
  selectedTier: RequestTier;
  onSelectTier: (tier: RequestTier) => void;
  disabled?: boolean;
}) {
  const tierOptions: Array<{value: RequestTier, label: string, price: string}> = [
    { value: 'community', label: 'Community', price: '1 credit' },
    { value: 'standard', label: 'Standard', price: '£3' },
    { value: 'pro', label: 'Professional', price: '£12' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
      {tierOptions.map(option => (
        <button
          key={option.value}
          onClick={() => !disabled && onSelectTier(option.value)}
          disabled={disabled}
          className={`
            py-2 px-3 rounded-md text-sm font-medium transition-all
            ${selectedTier === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div>{option.label}</div>
          <div className="text-xs opacity-75">{option.price}</div>
        </button>
      ))}
    </div>
  );
}