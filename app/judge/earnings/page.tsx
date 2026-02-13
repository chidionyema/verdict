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
  Info,
  Shield,
  Banknote,
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
import { RoleIndicator } from '@/components/ui/RoleIndicator';

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
          <RoleIndicator role="reviewer" />
        </div>

        {/* Payout Progress - Clear visual toward goal */}
        {earnings.total_earned > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Progress to Next Payout</h3>
                  <p className="text-sm text-green-700">
                    {availableAmount >= minimumPayout
                      ? 'Ready to cash out!'
                      : `${formatCurrency(minimumPayout - availableAmount)} more to reach minimum`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{formatCurrency(availableAmount)}</p>
                <p className="text-xs text-green-600">of {formatCurrency(minimumPayout)} minimum</p>
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  availableAmount >= minimumPayout
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-green-400 to-emerald-400'
                }`}
                style={{ width: `${Math.min((availableAmount / minimumPayout) * 100, 100)}%` }}
              />
            </div>
            {availableAmount >= minimumPayout && payoutAccount?.payouts_enabled && (
              <p className="text-center text-sm font-medium text-green-700 mt-3">
                You've reached the minimum! Request your payout below.
              </p>
            )}
          </div>
        )}

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

          <div className="bg-white rounded-xl p-6 shadow-sm border group relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-600">Available</span>
              <div className="relative ml-auto">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-3 w-3 text-green-400" />
                    <span className="font-semibold">Ready to withdraw</span>
                  </div>
                  <p>These earnings have cleared the 7-day quality protection period. Request a payout anytime!</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(availableAmount)}</p>
            <p className="text-xs text-green-600 mt-1">Ready for payout</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border group relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Pending</span>
              <div className="relative ml-auto">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3 w-3 text-yellow-400" />
                    <span className="font-semibold">Protected earnings</span>
                  </div>
                  <p>Earnings are held for 7 days to ensure verdict quality. This protects both you and seekers. After 7 days, they automatically move to "Available."</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.pending_amount)}</p>
            <p className="text-xs text-yellow-600 mt-1">Clears in 7 days</p>
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
                {/* Account Status Card */}
                <div className={`p-4 rounded-xl border ${
                  payoutAccount.payouts_enabled
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {payoutAccount.payouts_enabled ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                      )}
                      <div>
                        <p className={`font-semibold ${payoutAccount.payouts_enabled ? 'text-green-800' : 'text-yellow-800'}`}>
                          {payoutAccount.payouts_enabled ? 'Stripe Connected' : 'Verification In Progress'}
                        </p>
                        <p className={`text-sm ${payoutAccount.payouts_enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                          {payoutAccount.payouts_enabled
                            ? 'Your account is ready to receive payouts'
                            : 'Please complete verification to receive payouts'}
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://dashboard.stripe.com/express"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-2 py-1 ${
                        payoutAccount.payouts_enabled
                          ? 'text-green-700 hover:text-green-800 focus-visible:ring-green-500'
                          : 'text-yellow-700 hover:text-yellow-800 focus-visible:ring-yellow-500'
                      }`}
                      aria-label="Manage Stripe account (opens in new tab)"
                    >
                      {payoutAccount.payouts_enabled ? 'Manage' : 'Complete Setup'} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>

                  {/* Verification Steps - Show if not fully verified */}
                  {!payoutAccount.payouts_enabled && (
                    <div className="mt-4 pt-4 border-t border-yellow-200">
                      <p className="text-sm text-yellow-700 mb-3">Complete these steps to start receiving payouts:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">Create Stripe account</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-4 w-4 border-2 border-yellow-400 rounded-full" />
                          <span className="text-gray-700">Verify your identity</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                          <span className="text-gray-400">Add bank account</span>
                        </div>
                      </div>
                      <a
                        href="https://dashboard.stripe.com/express"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                      >
                        Continue Verification
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Payout Button - Only when verified and has enough */}
                {payoutAccount.payouts_enabled && availableAmount >= minimumPayout && (
                  <button
                    onClick={handleRequestPayout}
                    disabled={requestingPayout}
                    className="w-full py-4 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                    aria-label={requestingPayout ? 'Processing payout request' : `Request payout of ${formatCurrency(availableAmount)}`}
                  >
                    {requestingPayout ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Processing your payout...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5" aria-hidden="true" />
                        Request Payout ({formatCurrency(availableAmount)})
                      </>
                    )}
                  </button>
                )}

                {/* Progress to minimum payout */}
                {payoutAccount.payouts_enabled && availableAmount < minimumPayout && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-indigo-800">Almost there!</p>
                        <p className="text-sm text-indigo-700 mb-3">
                          You need {formatCurrency(minimumPayout - availableAmount)} more to reach the {formatCurrency(minimumPayout)} minimum payout.
                        </p>
                        <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((availableAmount / minimumPayout) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-indigo-600">
                          {Math.round((availableAmount / minimumPayout) * 100)}% to minimum payout
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8">
                {/* Icon and Title */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Banknote className="h-10 w-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Set Up Payouts</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Connect your bank account through Stripe to receive your judge earnings securely.
                  </p>
                </div>

                {/* Benefits List */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Secure & Fast Payouts
                  </h4>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      Direct deposit to your bank
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      2-3 business day transfers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      Powered by Stripe (trusted by millions)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      No monthly fees
                    </li>
                  </ul>
                </div>

                {/* Country Selector */}
                <div className="mb-6 max-w-sm mx-auto">
                  <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    <Globe className="h-4 w-4 inline mr-1" aria-hidden="true" />
                    Select your country
                  </label>
                  <div className="relative">
                    <select
                      id="country-select"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      aria-describedby="country-help"
                    >
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  </div>
                  <p id="country-help" className="text-xs text-gray-500 mt-2 text-left">
                    This determines which bank accounts you can connect.
                  </p>
                </div>

                {/* Connect Button */}
                <div className="text-center">
                  <button
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    aria-label={connectingStripe ? 'Setting up Stripe account' : 'Connect Stripe account to receive payouts'}
                  >
                    {connectingStripe ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" aria-hidden="true" />
                        Connect Stripe Account
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Takes about 5 minutes to complete
                  </p>
                </div>
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

        {/* Payout Journey Timeline */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-6 text-center">Your Earnings Journey</h3>
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-yellow-200 to-green-200 hidden sm:block" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-md">
                  <Shield className="h-7 w-7 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mt-3 text-sm">Submit Verdict</h4>
                <p className="text-xs text-gray-500 mt-1">Provide quality feedback</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-md">
                  <Clock className="h-7 w-7 text-yellow-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mt-3 text-sm">7-Day Hold</h4>
                <p className="text-xs text-gray-500 mt-1">Quality protection period</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-md">
                  <Wallet className="h-7 w-7 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mt-3 text-sm">Becomes Available</h4>
                <p className="text-xs text-gray-500 mt-1">Min {formatCurrency(minimumPayout)} to withdraw</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-md">
                  <Banknote className="h-7 w-7 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mt-3 text-sm">Get Paid</h4>
                <p className="text-xs text-gray-500 mt-1">Direct to your bank</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">Quick Facts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Earnings clear after 7 days</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Minimum payout: {formatCurrency(minimumPayout)}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Arrives in 2-3 business days</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Processing fee: 2.9% + $0.30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
