'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { CREDIT_PACKAGES, STANDARD_VERDICT_COUNT } from '@/lib/validations';
import { toast } from '@/components/ui/toast';
// Note: Credit package pricing was removed - using simplified pricing model
import { useLocalizedPricing } from '@/hooks/use-pricing';
import TierUpgradeCard from '@/components/billing/TierUpgradeCard';
import type { Locale } from '@/i18n.config';
import type { Profile } from '@/lib/database.types';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const locale = useLocale() as Locale;

  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Using simplified pricing model
  const pricing = useLocalizedPricing();

  useEffect(() => {
    fetchProfile();
  }, []);

  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();

      if (!res.ok) {
        console.error('Profile fetch failed:', res.status, data);
        if (res.status === 401) {
          // Redirect to login
          router.push('/auth/login?redirect=/account');
          return;
        }
        setError(data.error || 'Failed to load profile');
        return;
      }

      setProfile(data.profile);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);

    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      });

      const data = await res.json();

      if (data.demo) {
        // Demo mode - credits added directly
        toast.success(`Added ${data.credits_added} credits (demo mode)`);
        fetchProfile();
        setPurchasing(null);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
        setPurchasing(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchasing(null);
    }
  };

  const handleTierUpgrade = async (tierId: 'standard' | 'pro') => {
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_id: tierId }),
      });

      const data = await res.json();

      if (data.demo) {
        // Demo mode - tier upgraded directly
        toast.success(`Upgraded to ${data.tier} tier (demo mode)`);
        fetchProfile();
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Tier upgrade error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account</h1>

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-8 flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Payment successful! Your account has been updated.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button
              onClick={() => { setError(null); fetchProfile(); }}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500">Email</label>
              <p className="font-medium">{profile?.email || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Display Name</label>
              <p className="font-medium">{profile?.display_name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Country</label>
              <p className="font-medium">{profile?.country || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Age Range</label>
              <p className="font-medium">{profile?.age_range || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Gender</label>
              <p className="font-medium capitalize">{profile?.gender?.replace('_', ' ') || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Current Tier</label>
              <p className="font-medium capitalize">
                {(profile as any)?.pricing_tier || 'Community'}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Member Since</label>
              <p className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Credits / request balances */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Request credits</h2>
              <p className="text-gray-500">
                Each credit = 1 submission with 3 feedback reports from real people.
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">
                {profile?.credits || 0}
              </p>
              <p className="text-sm text-gray-500">available</p>
            </div>
          </div>

          <h3 className="font-medium text-gray-900 mb-2">Buy More Credits</h3>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold">1 credit = 1 submission</span> (
            {STANDARD_VERDICT_COUNT} feedback reports). Higher tiers use more credits per
            submission but always show you the total before you confirm.
          </p>

          {/* Value Comparison */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Compare:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Therapist:</span>{' '}
                <span className="font-semibold text-gray-900">$200/hour</span>
              </div>
              <div>
                <span className="text-gray-600">Career coach:</span>{' '}
                <span className="font-semibold text-gray-900">$150/hour</span>
              </div>
              <div>
                <span className="text-indigo-600 font-semibold">AskVerdict:</span>{' '}
                <span className="font-bold text-indigo-700">
                  ~{pricing.privatePrice} for{' '}
                  {STANDARD_VERDICT_COUNT} feedback reports
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
              <div
                key={id}
                className={`border rounded-lg p-4 ${
                  id === 'popular' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
                }`}
              >
                {id === 'popular' && (
                  <span className="inline-block bg-indigo-600 text-white text-xs px-2 py-1 rounded mb-2">
                    Most Popular
                  </span>
                )}
                <h4 className="font-semibold text-lg">{pkg.name}</h4>
                <p className="text-3xl font-bold mt-2">
                  {pricing.privatePrice}
                </p>
                <p className="text-gray-500 text-sm">{pkg.credits} credits</p>
                <p className="text-gray-400 text-xs mt-1">
                  Includes {pkg.credits} credits • price shown in your local currency
                </p>
                <button
                  onClick={() => handlePurchase(id)}
                  disabled={purchasing === id}
                  className={`w-full mt-4 py-2 rounded-lg font-medium transition cursor-pointer ${
                    id === 'popular'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${purchasing === id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {purchasing === id ? 'Processing...' : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* How credits, tiers and verdicts work */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">How credits and tiers work</h2>
          <p className="text-sm text-gray-600 mb-4">
            Each request uses credits based on the tier you choose. You always see the total before you pay.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">Tier</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Feedback reports</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Credits used</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2">Basic</td>
                  <td className="px-4 py-2">
                    {STANDARD_VERDICT_COUNT} quick ratings
                  </td>
                  <td className="px-4 py-2">1 credit</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2">Detailed</td>
                  <td className="px-4 py-2">
                    {STANDARD_VERDICT_COUNT} written reviews
                  </td>
                  <td className="px-4 py-2">1 credit</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            You can change tiers for each request on the final step before you submit.
          </p>
        </div>

        {/* Tier Upgrade Section */}
        <TierUpgradeCard 
          currentTier={(profile as any)?.pricing_tier || 'community'}
          onUpgrade={handleTierUpgrade}
          disabled={loading}
        />

        <div className="mt-8" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:text-red-700 cursor-pointer"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
