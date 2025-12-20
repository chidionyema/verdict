'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StreamlinedLinkedInVerification } from '@/components/verification/StreamlinedLinkedInVerification';
import { VerifiedBadge } from '@/components/verification/VerifiedBadge';
import { Shield, ArrowLeft, CheckCircle, Star, TrendingUp, Users, Award } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { useRouter } from 'next/navigation';

interface VerificationStatus {
  isVerified: boolean;
  verificationLevel?: 'linkedin' | 'expert' | 'elite';
  verifiedCategory?: 'hr' | 'tech' | 'design' | 'marketing' | 'finance' | 'general';
  verificationDate?: string;
}

export default function JudgeVerifyPage() {
  const [user, setUser] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isVerified: false
  });
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
        router.push('/auth/login');
        return;
      }
      
      setUser(currentUser);

      // Get verification status from judge_reputation
      const { data: reputation, error: repError } = await supabase
        .from('judge_reputation')
        .select('verification_status, verified_category, verified_level, verification_date')
        .eq('user_id', currentUser.id)
        .single();

      if (!repError && reputation) {
        setVerificationStatus({
          isVerified: (reputation as any).verification_status === 'verified',
          verificationLevel: (reputation as any).verified_level || 'linkedin',
          verifiedCategory: (reputation as any).verified_category || 'general',
          verificationDate: (reputation as any).verification_date,
        });
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = (verified: boolean) => {
    if (verified) {
      setVerificationStatus(prev => ({ ...prev, isVerified: true }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <TouchButton
            onClick={() => router.push('/judge')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </TouchButton>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-600 text-white rounded-full p-3">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Verification</h1>
              <p className="text-gray-600">Increase trust and earn higher tips by verifying your professional credentials</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Verification Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* LinkedIn Verification */}
            <StreamlinedLinkedInVerification
              userId={user?.id || ''}
              isVerified={verificationStatus.isVerified}
              onVerificationComplete={handleVerificationUpdate}
            />

            {/* Future Verification Methods */}
            {verificationStatus.isVerified && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Level Up Your Verification
                </h3>
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 opacity-75">
                    <h4 className="font-medium text-purple-900">Expert Level (Coming Soon)</h4>
                    <p className="text-sm text-purple-700">Industry certifications, advanced credentials</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 opacity-75">
                    <h4 className="font-medium text-purple-900">Elite Level (Coming Soon)</h4>
                    <p className="text-sm text-purple-700">Published work, speaking engagements, leadership roles</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Status</h3>
              {verificationStatus.isVerified ? (
                <div className="space-y-3">
                  <VerifiedBadge
                    isVerified={true}
                    level={verificationStatus.verificationLevel}
                    category={verificationStatus.verifiedCategory}
                    size="lg"
                  />
                  <p className="text-sm text-green-700">
                    Verified on {new Date(verificationStatus.verificationDate!).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Not yet verified</p>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Higher Tips</p>
                    <p className="text-xs text-gray-600">Verified judges earn 40% more in tips</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Trust Badge</p>
                    <p className="text-xs text-gray-600">Display expertise on your reviews</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Priority Access</p>
                    <p className="text-xs text-gray-600">First access to relevant submissions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expert Status</p>
                    <p className="text-xs text-gray-600">Be featured as a professional reviewer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Impact</h3>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">85%</div>
                  <p className="text-sm text-gray-600">Users prefer verified reviewers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">40%</div>
                  <p className="text-sm text-gray-600">Higher tips for verified judges</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">2.3x</div>
                  <p className="text-sm text-gray-600">More feedback requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}