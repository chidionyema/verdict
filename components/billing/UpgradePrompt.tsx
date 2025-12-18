'use client';

import { ArrowRight, Crown, Zap, X } from 'lucide-react';
import { useState } from 'react';

interface UpgradePromptProps {
  trigger: 'no_credits' | 'tier_limit' | 'feature_locked';
  currentTier: 'community' | 'standard' | 'pro';
  targetTier: 'standard' | 'pro';
  feature?: string;
  onClose?: () => void;
  onUpgrade: (tierId: 'standard' | 'pro') => void;
  className?: string;
}

const PROMPTS = {
  no_credits: {
    title: 'Out of Credits',
    description: 'You\'ve used up your daily free credit. Upgrade to get instant access to more requests.',
  },
  tier_limit: {
    title: 'Feature Limited',
    description: 'This feature is only available with a higher tier plan.',
  },
  feature_locked: {
    title: 'Premium Feature',
    description: 'Unlock this feature with a plan upgrade.',
  }
};

const TIER_INFO = {
  standard: {
    name: 'Standard',
    price: '£3',
    icon: Zap,
    benefits: [
      'Expert routing priority',
      'Enhanced feedback quality',
      '24h response time'
    ],
    color: 'blue'
  },
  pro: {
    name: 'Professional', 
    price: '£12',
    icon: Crown,
    benefits: [
      'Expert-only feedback',
      'LLM synthesis & insights',
      'A/B comparison tool',
      'Decision scoring matrix'
    ],
    color: 'purple'
  }
};

export default function UpgradePrompt({ 
  trigger, 
  currentTier, 
  targetTier, 
  feature,
  onClose,
  onUpgrade,
  className = ''
}: UpgradePromptProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const prompt = PROMPTS[trigger];
  const tierInfo = TIER_INFO[targetTier];
  
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      onUpgrade(targetTier);
    } catch (error) {
      setIsUpgrading(false);
    }
  };

  const getColorClasses = (color: string) => ({
    bg: color === 'blue' ? 'bg-blue-50' : 'bg-purple-50',
    border: color === 'blue' ? 'border-blue-200' : 'border-purple-200',
    text: color === 'blue' ? 'text-blue-700' : 'text-purple-700',
    button: color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700',
    icon: color === 'blue' ? 'text-blue-600' : 'text-purple-600'
  });

  const colors = getColorClasses(tierInfo.color);

  return (
    <div className={`border rounded-lg p-6 ${colors.border} ${colors.bg} ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center`}>
            <tierInfo.icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
            <p className="text-sm text-gray-600">
              {feature ? `${feature} requires ${tierInfo.name} tier` : prompt.description}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">{tierInfo.name}</span>
          <div className="text-right">
            <span className="text-xl font-bold">{tierInfo.price}</span>
            <span className="text-sm text-gray-500 ml-1">one-time</span>
          </div>
        </div>
        
        <ul className="text-sm text-gray-700 space-y-1">
          {tierInfo.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center space-x-2">
              <div className={`w-1 h-1 rounded-full ${colors.button.includes('blue') ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-2 ${colors.button} ${
          isUpgrading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUpgrading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Upgrade to {tierInfo.name}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {trigger === 'no_credits' && currentTier === 'community' && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Or wait for your next daily credit in {Math.ceil((24 - new Date().getHours()) / 24 * 24)} hours
        </p>
      )}
    </div>
  );
}