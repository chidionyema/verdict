'use client';

import { useState } from 'react';
import { Check, Users, Zap, Crown, Plus, Minus } from 'lucide-react';
import { getTierConfig, calculateTierPrice, getAllTiers, TierConfiguration } from '@/lib/pricing/dynamic-pricing';

interface TierSelectorProps {
  selectedTier: string;
  selectedJudgeCount: number;
  onTierChange: (tierId: string) => void;
  onJudgeCountChange: (count: number) => void;
}

export function TierSelector({ 
  selectedTier, 
  selectedJudgeCount, 
  onTierChange, 
  onJudgeCountChange 
}: TierSelectorProps) {
  const tiers = getAllTiers();
  const selectedConfig = getTierConfig(selectedTier);
  const pricing = calculateTierPrice(selectedTier, selectedJudgeCount);

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'community': return <Users className="h-5 w-5" />;
      case 'standard': return <Zap className="h-5 w-5" />;
      case 'expert': return <Crown className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getTierColor = (tierId: string, selected: boolean) => {
    const base = selected ? 'ring-2' : 'border';
    
    switch (tierId) {
      case 'community':
        return `${base} ${selected ? 'ring-blue-500 border-blue-500' : 'border-gray-200'} hover:border-blue-300`;
      case 'standard':
        return `${base} ${selected ? 'ring-purple-500 border-purple-500' : 'border-gray-200'} hover:border-purple-300`;
      case 'expert':
        return `${base} ${selected ? 'ring-gold-500 border-gold-500' : 'border-gray-200'} hover:border-gold-300`;
      default:
        return `${base} ${selected ? 'ring-gray-500 border-gray-500' : 'border-gray-200'} hover:border-gray-300`;
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Tier Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Tier</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            const defaultPricing = calculateTierPrice(tier.id, tier.default_judges);
            
            return (
              <div
                key={tier.id}
                onClick={() => onTierChange(tier.id)}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${getTierColor(tier.id, isSelected)}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    tier.id === 'community' ? 'bg-blue-100 text-blue-600' :
                    tier.id === 'standard' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {getTierIcon(tier.id)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                    <p className="text-sm text-gray-500">{formatPrice(defaultPricing.total_cents)}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                
                <div className="space-y-2">
                  {tier.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  ~{tier.response_time_hours}h response time
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Judge Count Selection */}
      {selectedTier && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Number of Judges</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">Select Judge Count</h4>
                <p className="text-sm text-gray-500">
                  More judges = more diverse perspectives
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onJudgeCountChange(Math.max(selectedConfig.min_judges, selectedJudgeCount - 1))}
                  disabled={selectedJudgeCount <= selectedConfig.min_judges}
                  className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                
                <div className="text-center min-w-[3rem]">
                  <div className="text-xl font-bold text-gray-900">{selectedJudgeCount}</div>
                  <div className="text-xs text-gray-500">judges</div>
                </div>
                
                <button
                  onClick={() => onJudgeCountChange(Math.min(selectedConfig.max_judges, selectedJudgeCount + 1))}
                  disabled={selectedJudgeCount >= selectedConfig.max_judges}
                  className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Quick Select Options */}
            <div className="flex gap-2 mb-4">
              {[3, 5, 8, 10].filter(count => 
                count >= selectedConfig.min_judges && count <= selectedConfig.max_judges
              ).map(count => (
                <button
                  key={count}
                  onClick={() => onJudgeCountChange(count)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedJudgeCount === count
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            
            {/* Price Breakdown */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base price ({selectedConfig.default_judges} judges)</span>
                  <span className="font-medium">{formatPrice(pricing.base_price_cents)}</span>
                </div>
                
                {pricing.additional_judges_price_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Additional judges (+{selectedJudgeCount - selectedConfig.default_judges})
                    </span>
                    <span className="font-medium">{formatPrice(pricing.additional_judges_price_cents)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className={selectedTier === 'community' ? 'text-blue-600' : 'text-purple-600'}>
                    {formatPrice(pricing.total_cents)}
                    {selectedTier === 'community' && pricing.total_cents === 0 && (
                      <span className="text-xs text-gray-500 ml-1">(1 credit)</span>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Profit Margin Warning for Development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="font-medium text-yellow-800">Dev Info:</div>
                  <div className="text-yellow-700">
                    Margin: {formatPrice(pricing.gross_margin_cents)} 
                    ({((pricing.gross_margin_cents / pricing.total_cents) * 100).toFixed(1)}%)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Expert Badge for Expert Tier */}
      {selectedTier === 'expert' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">Expert Verification</h4>
              <p className="text-sm text-yellow-700">
                Your submission will be reviewed exclusively by verified industry experts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}