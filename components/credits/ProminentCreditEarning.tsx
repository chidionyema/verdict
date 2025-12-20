'use client';

import { useState } from 'react';
import { 
  Coins, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface ProminentCreditEarningProps {
  userCredits?: number;
  className?: string;
  showFullDetails?: boolean;
}

export function ProminentCreditEarning({ 
  userCredits = 0, 
  className = '',
  showFullDetails = true 
}: ProminentCreditEarningProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const creditEarningRules = [
    {
      action: "Judge 3 submissions",
      reward: "1 credit",
      icon: MessageSquare,
      time: "~15 minutes",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      action: "Complete judge training",
      reward: "1 bonus credit",
      icon: Star,
      time: "~5 minutes",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50", 
      borderColor: "border-yellow-200"
    },
    {
      action: "Get verified as expert",
      reward: "3 bonus credits",
      icon: Zap,
      time: "~2 minutes",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  ];

  if (!showFullDetails) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Coins className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Need Credits?</h3>
              <p className="text-sm text-green-700">Judge 3 submissions = 1 credit</p>
            </div>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            <span>Start Earning</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Earn Credits for Free</h3>
        <p className="text-gray-600">Help others and earn credits to submit your own requests</p>
      </div>

      {/* Current Credits Display */}
      {userCredits !== undefined && (
        <div className="bg-white rounded-lg border border-green-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Coins className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <span className="text-sm text-gray-600">Your credits</span>
                <div className="text-2xl font-bold text-green-600">{userCredits}</div>
              </div>
            </div>
            {userCredits === 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Ready to earn your first?</div>
                <div className="text-xs text-green-600 font-medium">Judge 3 → Get 1 credit</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earning Methods */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          How to Earn Credits
        </h4>
        
        <div className="space-y-3">
          {creditEarningRules.map((rule, index) => {
            const IconComponent = rule.icon;
            return (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 ${rule.bgColor} border ${rule.borderColor} rounded-lg`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <IconComponent className={`h-4 w-4 ${rule.color}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{rule.action}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rule.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${rule.color}`}>{rule.reward}</div>
                  {index === 0 && (
                    <div className="text-xs text-gray-500">Most popular</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/feed"
          className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start Judging to Earn Credits
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full text-sm text-green-700 hover:text-green-800 font-medium"
        >
          {showBreakdown ? 'Hide details' : 'Show earning breakdown'}
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
          <h5 className="font-medium text-gray-900 mb-3">Earning Breakdown</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Each judgment takes ~5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Credits never expire</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>1 credit = 1 feedback request</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Quality judgments earn bonus reputation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}