'use client';

import React, { useState } from 'react';
import { Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { useLocalizedPricing } from '@/hooks/use-pricing';

interface TierUpgradeCardProps {
  currentTier: 'community' | 'standard' | 'pro';
  onUpgrade: (tierId: 'standard' | 'pro') => Promise<void>;
  disabled?: boolean;
}

function getTierConfig(pricing: ReturnType<typeof useLocalizedPricing>) {
  const proPrice = pricing.currencyCode === 'GBP' ? '£12' : pricing.currencyCode === 'EUR' ? '€14' : '$15';

  return {
    community: {
      name: 'Community',
      price: 'Free',
      icon: Star,
      features: [
        '1 free credit per day',
        'Community feedback',
        'Basic verdict reports',
        '48h response time'
      ],
      color: 'gray',
      current: true
    },
    standard: {
      name: 'Standard',
      price: pricing.privatePrice,
      priceDetail: 'one-time',
      icon: Zap,
      features: [
        'Instant access',
        'Expert routing priority',
        'Enhanced feedback quality',
        '24h response time',
        'Email notifications'
      ],
      color: 'blue',
      upgradeText: 'Upgrade to Standard'
    },
    pro: {
      name: 'Professional',
      price: proPrice,
      priceDetail: 'one-time',
      icon: Crown,
      features: [
        'Expert-only feedback',
        'LLM synthesis & insights',
        'A/B comparison tool',
        'Decision scoring matrix',
        '12h priority response',
        'Direct expert contact'
      ],
      color: 'purple',
      upgradeText: 'Upgrade to Pro',
      popular: true
    }
  };
}

export default function TierUpgradeCard({ currentTier, onUpgrade, disabled }: TierUpgradeCardProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const pricing = useLocalizedPricing();
  const TIER_CONFIG = getTierConfig(pricing);

  const handleUpgrade = async (tierId: 'standard' | 'pro') => {
    if (disabled || upgrading) return;
    
    setUpgrading(tierId);
    try {
      await onUpgrade(tierId);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgrading(null);
    }
  };

  const getColorClasses = (color: string, variant: 'border' | 'bg' | 'text' | 'button') => {
    const colors = {
      gray: {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        button: 'bg-gray-500 hover:bg-gray-600'
      },
      blue: {
        border: 'border-blue-200 ring-2 ring-blue-100',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        border: 'border-purple-200 ring-2 ring-purple-100',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    return colors[color as keyof typeof colors][variant];
  };

  const canUpgradeToTier = (tier: keyof typeof TIER_CONFIG) => {
    const tierOrder = { community: 0, standard: 1, pro: 2 };
    return tierOrder[currentTier] < tierOrder[tier];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Current Plan</h2>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg ${getColorClasses(TIER_CONFIG[currentTier].color, 'bg')} flex items-center justify-center`}>
            {TIER_CONFIG[currentTier].icon && 
              React.createElement(TIER_CONFIG[currentTier].icon, { 
                className: `w-4 h-4 ${getColorClasses(TIER_CONFIG[currentTier].color, 'text')}` 
              })
            }
          </div>
          <div>
            <h3 className="font-semibold">{TIER_CONFIG[currentTier].name}</h3>
            <p className="text-sm text-gray-500">{TIER_CONFIG[currentTier].price}</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">Available Upgrades</h3>
      
      <div className="grid gap-4">
        {Object.entries(TIER_CONFIG).map(([tierId, config]) => {
          if (tierId === currentTier || tierId === 'community') return null;
          
          const canUpgrade = canUpgradeToTier(tierId as keyof typeof TIER_CONFIG);
          const isUpgrading = upgrading === tierId;
          
          return (
            <div
              key={tierId}
              className={`relative border rounded-lg p-6 ${getColorClasses(config.color, 'border')}`}
            >
              {(config as any).popular && (
                <div className="absolute -top-2 left-6">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${getColorClasses(config.color, 'bg')} flex items-center justify-center`}>
                    {React.createElement(config.icon, { 
                      className: `w-5 h-5 ${getColorClasses(config.color, 'text')}` 
                    })}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{config.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{config.price}</span>
                      {(config as any).priceDetail && (
                        <span className="text-sm text-gray-500">{(config as any).priceDetail}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getColorClasses(config.color, 'bg')}`} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {canUpgrade && (config as any).upgradeText && (
                <button
                  onClick={() => handleUpgrade(tierId as 'standard' | 'pro')}
                  disabled={disabled || isUpgrading}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-2 ${getColorClasses(config.color, 'button')} ${
                    (disabled || isUpgrading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUpgrading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{(config as any).upgradeText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-sm mb-2">Why upgrade?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          <div>• Get feedback from verified experts</div>
          <div>• Faster response times</div>
          <div>• Advanced decision-making tools</div>
          <div>• Higher quality insights</div>
        </div>
      </div>
    </div>
  );
}