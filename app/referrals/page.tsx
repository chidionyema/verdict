import { Suspense } from 'react';
import { ReferralLandingContent } from './ReferralLandingContent';

export default function ReferralsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-purple-600">Loading referral program...</div>
      </div>
    }>
      <ReferralLandingContent />
    </Suspense>
  );
}