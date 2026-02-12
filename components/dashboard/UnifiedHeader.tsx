'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Bell,
  Coins,
  Gavel,
  ChevronRight,
  Sparkles,
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

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 ${className}`}>
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
          {/* Credits */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Coins className="h-5 w-5 text-amber-600" />
            <span className="font-bold text-gray-900">{credits}</span>
            <span className="text-sm text-gray-600">credits</span>
            {credits < 3 && onBuyCredits && (
              <button
                onClick={onBuyCredits}
                className="ml-2 text-xs font-medium text-amber-700 hover:text-amber-800 underline"
              >
                Get more
              </button>
            )}
          </div>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Request</span>
            </Link>
            <Link
              href="/judge"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">Judge</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
