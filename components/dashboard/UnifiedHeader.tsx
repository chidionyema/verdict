'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Bell,
  Coins,
  Gavel,
  AlertTriangle,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface UnifiedHeaderProps {
  credits: number;
  unreadNotifications: number;
  displayName?: string;
  onBuyCredits?: () => void;
  className?: string;
}

export function UnifiedHeader({
  credits,
  unreadNotifications,
  displayName,
  onBuyCredits,
  className = '',
}: UnifiedHeaderProps) {
  const greeting = getGreeting();
  const isLowCredits = credits <= 2;
  const isZeroCredits = credits === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Header Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Greeting */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {greeting}{displayName ? `, ${displayName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-gray-600 mt-1">
              Submit requests for feedback <span className="text-gray-400 mx-1">or</span> judge others to earn
            </p>
          </div>

          {/* Right: Stats and Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Credits - Enhanced with status indication */}
            <Link
              href="/credits"
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isZeroCredits
                  ? 'bg-gradient-to-r from-red-100 to-red-50 border border-red-200 focus-visible:ring-red-500'
                  : isLowCredits
                  ? 'bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 focus-visible:ring-amber-500'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 focus-visible:ring-amber-500'
              }`}
              aria-label={`${credits} credits${isLowCredits ? ' - balance is low' : ''}. Click to manage credits.`}
            >
              {isZeroCredits ? (
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              ) : (
                <Coins className={`h-5 w-5 ${isLowCredits ? 'text-amber-600' : 'text-amber-600'}`} aria-hidden="true" />
              )}
              <span className={`font-bold ${isZeroCredits ? 'text-red-700' : 'text-gray-900'}`}>{credits}</span>
              <span className={`text-sm ${isZeroCredits ? 'text-red-600' : 'text-gray-600'}`}>credits</span>
              {isLowCredits && (
                <ArrowRight className="h-4 w-4 text-amber-500 ml-1" aria-hidden="true" />
              )}
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
            >
              <Bell className="h-5 w-5 text-gray-600" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center" aria-hidden="true">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/submit"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">New Request</span>
              </Link>
              <Link
                href="/judge"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                <Gavel className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Judge</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Low Balance Warning Banner */}
      {isLowCredits && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 border ${
            isZeroCredits
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
              : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isZeroCredits ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                {isZeroCredits ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
                ) : (
                  <Coins className="h-5 w-5 text-amber-600" aria-hidden="true" />
                )}
              </div>
              <div>
                <h2 className={`font-semibold ${isZeroCredits ? 'text-red-800' : 'text-amber-800'}`}>
                  {isZeroCredits ? "You're out of credits" : 'Running low on credits'}
                </h2>
                <p className={`text-sm ${isZeroCredits ? 'text-red-700' : 'text-amber-700'}`}>
                  {isZeroCredits
                    ? 'Get credits to submit requests and receive feedback from real people.'
                    : `You have ${credits} credit${credits !== 1 ? 's' : ''} left. Top up to keep submitting.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <Link
                href="/feed?earn=true"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                Earn Free
              </Link>
              <Link
                href="/credits"
                onClick={onBuyCredits}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isZeroCredits
                    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
                    : 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500'
                }`}
              >
                <Coins className="h-4 w-4" aria-hidden="true" />
                Buy Credits
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
