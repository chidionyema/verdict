'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { StreamlinedLinkedInVerification } from '@/components/verification/StreamlinedLinkedInVerification';
import { VerificationProgress } from '@/components/judge/VerificationProgress';
import { UnifiedVerificationFlow } from '@/components/judge/UnifiedVerificationFlow';
import { Shield, CheckCircle, Star, TrendingUp, Users, Award, ArrowRight, Sparkles, Linkedin } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { useRouter } from 'next/navigation';
import type { VerificationStatus } from '@/lib/judge/verification';
import { TIER_BENEFITS, getTierConfig } from '@/lib/judge/multipliers';

export default function JudgeVerifyPage() {
  const [user, setUser] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserAndVerification();
  }, []);

  const loadUserAndVerification = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        router.push('/auth/login?redirect=/judge/verify');
        return;
      }

      setUser(currentUser);

      // Get verification status from API
      const statusRes = await fetch('/api/judge/verification-status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        setVerificationStatus(status);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = (verified: boolean) => {
    // Reload verification status after LinkedIn connection
    loadUserAndVerification();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isProfileComplete = verificationStatus && verificationStatus.tierIndex >= 2;
  const isLinkedInConnected = verificationStatus && verificationStatus.tierIndex >= 3;
  const isLinkedInVerified = verificationStatus && verificationStatus.tierIndex >= 4;
  const isExpertVerified = verificationStatus && verificationStatus.tierIndex >= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/50">
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton href="/judge" label="Back to Dashboard" className="mb-4" />

          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-lg">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Verification</h1>
              <p className="text-gray-600">Build trust and unlock higher earnings through verification</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Verification Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Progress */}
            {user && (
              <VerificationProgress
                userId={user.id}
                variant="full"
                showCTA={true}
                onVerificationChange={setVerificationStatus}
              />
            )}

            {/* Profile Completion (if profile not done yet) */}
            {!isProfileComplete && user && (
              <UnifiedVerificationFlow
                userId={user.id}
                mode="inline"
                onComplete={loadUserAndVerification}
              />
            )}

            {/* LinkedIn Connection (if profile complete but LinkedIn not connected) */}
            {isProfileComplete && !isLinkedInConnected && (
              <StreamlinedLinkedInVerification
                userId={user?.id || ''}
                isVerified={!!isLinkedInConnected}
                onVerificationComplete={handleVerificationUpdate}
              />
            )}

            {/* Expert Verification CTA (if LinkedIn verified but not expert) */}
            {isLinkedInVerified && !isExpertVerified && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Ready for Expert Verification?</h3>
                    <p className="text-purple-100 text-sm mb-4">
                      You've completed LinkedIn verification. Apply for Expert status to unlock
                      50% bonus earnings and access to premium requests.
                    </p>
                    <Link
                      href="/judge/become-expert"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition"
                    >
                      Apply for Expert
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Expert Verified Success */}
            {isExpertVerified && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-900">Expert Verified</h3>
                    <p className="text-sm text-green-700">You've reached the highest verification tier!</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">50%</p>
                    <p className="text-xs text-green-700">Bonus Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">100</p>
                    <p className="text-xs text-green-700">Max Daily Verdicts</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            {/* Earnings Multiplier */}
            {verificationStatus && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Earnings Multiplier</h3>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-indigo-600 mb-1">
                    {verificationStatus.earnMultiplier > 1
                      ? `${verificationStatus.earnMultiplier}x`
                      : '1x'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {verificationStatus.earnMultiplier > 1
                      ? `+${((verificationStatus.earnMultiplier - 1) * 100).toFixed(0)}% bonus on all verdicts`
                      : 'Complete verification to earn bonus'}
                  </p>
                </div>
              </div>
            )}

            {/* Tier Benefits - Using single source of truth */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Tiers</h3>
              <div className="space-y-3">
                {/* LinkedIn Verified (combines connected + verified since they happen together) */}
                <div className={`p-3 rounded-xl border ${isLinkedInVerified ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isLinkedInVerified ? (
                      <CheckCircle className="h-4 w-4 text-sky-600" />
                    ) : (
                      <Linkedin className="h-4 w-4 text-gray-400" />
                    )}
                    <p className={`font-medium ${isLinkedInVerified ? 'text-sky-900' : 'text-gray-600'}`}>
                      {TIER_BENEFITS.linkedin_verified.title}
                    </p>
                    <span className={`ml-auto text-xs font-bold ${isLinkedInVerified ? 'text-sky-600' : 'text-gray-400'}`}>
                      {TIER_BENEFITS.linkedin_verified.bonus}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-0.5 ml-6">
                    {TIER_BENEFITS.linkedin_verified.benefits.map((benefit, i) => (
                      <li key={i}>• {benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Expert Verified */}
                <div className={`p-3 rounded-xl border ${isExpertVerified ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isExpertVerified ? (
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Award className="h-4 w-4 text-gray-400" />
                    )}
                    <p className={`font-medium ${isExpertVerified ? 'text-purple-900' : 'text-gray-600'}`}>
                      {TIER_BENEFITS.expert_verified.title}
                    </p>
                    <span className={`ml-auto text-xs font-bold ${isExpertVerified ? 'text-purple-600' : 'text-gray-400'}`}>
                      {TIER_BENEFITS.expert_verified.bonus}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-0.5 ml-6">
                    {TIER_BENEFITS.expert_verified.benefits.map((benefit, i) => (
                      <li key={i}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Why Get Verified?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Higher Earnings</p>
                    <p className="text-xs text-gray-600">Up to 50% bonus on all verdicts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Premium Requests</p>
                    <p className="text-xs text-gray-600">Access to expert-tier submissions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">User Trust</p>
                    <p className="text-xs text-gray-600">85% prefer verified judges</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}