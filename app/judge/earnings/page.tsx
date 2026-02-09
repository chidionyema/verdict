'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Wallet,
  ExternalLink,
  RefreshCw,
  Globe,
  ChevronDown,
} from 'lucide-react';

// Supported countries for Stripe Connect Express (matching API)
const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'EE', name: 'Estonia' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
] as const;
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import Breadcrumb from '@/components/Breadcrumb';
import { BackButton } from '@/components/ui/BackButton';

interface PayoutAccount {
  id: string;
  stripe_account_id: string;
  payouts_enabled: boolean;
  country: string;
  created_at: string;
}

interface Payout {
  id: string;
  gross_amount_cents: number;
  fee_amount_cents: number;
  net_amount_cents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

interface EarningsSummary {
  total_earned: number;
  available_amount: number;
  pending_amount: number;
  paid_amount: number;
}

export default function JudgeEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [minimumPayout, setMinimumPayout] = useState(2000); // $20 default
  const [earnings, setEarnings] = useState<EarningsSummary>({
    total_earned: 0,
    available_amount: 0,
    pending_amount: 0,
    paid_amount: 0,
  });
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login?redirect=/judge/earnings');
        return;
      }

      setUser(user);

      // Fetch payouts data
      const payoutsRes = await fetch('/api/judge/payouts');
      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts || []);
        setAvailableAmount(data.available_amount || 0);
        setPayoutAccount(data.payout_account || null);
        setMinimumPayout(data.minimum_payout || 2000);
      }

      // Fetch earnings stats (API returns values in dollars)
      const statsRes = await fetch('/api/judge/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        // Convert dollars to cents for consistent display with formatCurrency
        setEarnings({
          total_earned: (statsData.total_earnings || 0) * 100,
          available_amount: (statsData.available_for_payout || 0) * 100,
          pending_amount: (statsData.pending_earnings || 0) * 100,
          paid_amount: (statsData.paid_earnings || 0) * 100,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load earnings data');
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/judge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe account');
    }
    setConnectingStripe(false);
  };

  const handleRequestPayout = async () => {
    if (availableAmount < minimumPayout) {
      toast.error(`Minimum payout is $${(minimumPayout / 100).toFixed(2)}`);
      return;
    }

    setRequestingPayout(true);
    try {
      const res = await fetch('/api/judge/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: availableAmount,
          payout_method: 'stripe_express',
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Payout request submitted successfully!');
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    }
    setRequestingPayout(false);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      processing: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb
          className="mb-6"
          customItems={[
            { label: 'Home', href: '/' },
            { label: 'Judge', href: '/judge' },
            { label: 'Earnings', href: '/judge/earnings' },
          ]}
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <BackButton useHistory label="Back" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Earnings & Payouts</h1>
            <p className="text-gray-600">Manage your judge earnings and request payouts</p>
          </div>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.total_earned)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(availableAmount)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.pending_amount)}</p>
            <p className="text-xs text-gray-500 mt-1">7-day maturation</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">Paid Out</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.paid_amount)}</p>
          </div>
        </div>

        {/* Payout Account Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payout Account</h2>
            <p className="text-sm text-gray-600">Connect your bank account to receive payouts</p>
          </div>

          <div className="p-6">
            {payoutAccount ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Stripe Connected</p>
                      <p className="text-sm text-green-600">
                        {payoutAccount.payouts_enabled ? 'Ready for payouts' : 'Verification pending'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://dashboard.stripe.com/express"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800"
                  >
                    Manage <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {payoutAccount.payouts_enabled && availableAmount >= minimumPayout && (
                  <button
                    onClick={handleRequestPayout}
                    disabled={requestingPayout}
                    className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {requestingPayout ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Request Payout ({formatCurrency(availableAmount)})
                      </>
                    )}
                  </button>
                )}

                {availableAmount < minimumPayout && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Minimum payout: {formatCurrency(minimumPayout)}. You need {formatCurrency(minimumPayout - availableAmount)} more.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payout Account</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your Stripe account to receive payouts for your judge work.
                </p>

                {/* Country Selector */}
                <div className="mb-6 max-w-xs mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Select your country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-left">
                    This determines which bank accounts you can connect.
                  </p>
                </div>

                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300"
                >
                  {connectingStripe ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Connect Stripe Account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
          </div>

          {payouts.length > 0 ? (
            <div className="divide-y">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">{formatCurrency(payout.gross_amount_cents)}</p>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Net: {formatCurrency(payout.net_amount_cents)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Fee: {formatCurrency(payout.fee_amount_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600">No payouts yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Your payout history will appear here
              </p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">How Payouts Work</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Earnings become available 7 days after you submit a verdict</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Minimum payout is {formatCurrency(minimumPayout)}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Payouts typically arrive within 2-3 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>A small processing fee (2.9% + $0.30) is deducted from each payout</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
