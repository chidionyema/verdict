'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, LogOut, Check } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/validations';
import type { Profile } from '@/lib/database.types';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const { profile: profileData } = await res.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
        alert(`Added ${data.credits_added} credits (demo mode)`);
        fetchProfile();
        setPurchasing(null);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Failed to create checkout session');
        setPurchasing(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchasing(null);
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
            Payment successful! Your credits have been added.
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500">Email</label>
              <p className="font-medium">{profile?.email || '-'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Display Name</label>
              <p className="font-medium">{profile?.display_name || '-'}</p>
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

        {/* Credits Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Credits</h2>
              <p className="text-gray-500">Use credits to get verdict feedback</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">
                {profile?.credits || 0}
              </p>
              <p className="text-sm text-gray-500">available</p>
            </div>
          </div>

          <h3 className="font-medium text-gray-900 mb-4">Buy More Credits</h3>

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
                <span className="text-indigo-600 font-semibold">Verdict:</span>{' '}
                <span className="font-bold text-indigo-700">$4.99 for 10 perspectives</span>
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
                  ${(pkg.price_cents / 100).toFixed(2)}
                </p>
                <p className="text-gray-500 text-sm">{pkg.credits} credits</p>
                <p className="text-gray-400 text-xs mt-1">
                  ${((pkg.price_cents / 100) / pkg.credits).toFixed(2)}/credit
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
