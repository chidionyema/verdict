'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Star, Zap, Shield, Clock, RefreshCw, ArrowRight, Coins, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import { CreditHistory } from '@/components/credits';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  description?: string;
}

const features = [
  { text: 'Get feedback from real people in minutes', icon: 'clock' },
  { text: 'Anonymous and honest opinions', icon: 'shield' },
  { text: 'No subscription required', icon: 'check' },
  { text: '100% money-back guarantee', icon: 'refund' },
];

export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Only initialize Supabase client in browser
    if (typeof window !== 'undefined') {
      fetchUser();
      fetchPackages();
    }
  }, []);

  const fetchUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      setCurrentCredits((profile as { credits: number } | null)?.credits || 0);
    }
  };

  const fetchPackages = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from('credit_packages')
        .select('id, name, credits, price, popular, description')
        .order('credits', { ascending: true });

      if (error) {
        console.error('Error fetching packages from database:', error);
        // Fallback to default packages if database fetch fails
        setPackages(getDefaultPackages());
        return;
      }

      if (data && data.length > 0) {
        setPackages((data as any[]).map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          credits: pkg.credits,
          price: Number(pkg.price),
          popular: pkg.popular || false,
          description: pkg.description || undefined
        })));
      } else {
        // No packages in database, use defaults
        setPackages(getDefaultPackages());
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages(getDefaultPackages());
    } finally {
      setLoading(false);
    }
  };

  // Package IDs must match CREDIT_PACKAGES in lib/validations.ts
  const getDefaultPackages = (): CreditPackage[] => [
    {
      id: 'starter',
      name: 'Starter',
      credits: 5,
      price: 17.45,
      popular: false,
      description: 'Perfect for trying out the platform'
    },
    {
      id: 'popular',
      name: 'Popular',
      credits: 10,
      price: 34.90,
      popular: true,
      description: 'Most popular choice for regular users'
    },
    {
      id: 'value',
      name: 'Value',
      credits: 25,
      price: 87.25,
      popular: false,
      description: 'Great value for regular users'
    },
    {
      id: 'pro',
      name: 'Pro',
      credits: 50,
      price: 174.50,
      popular: false,
      description: 'Maximum value for power users'
    }
  ];

  const handlePurchase = async (packageData: CreditPackage) => {
    if (!user) {
      router.push('/auth/login?redirect=/credits');
      return;
    }

    setPurchasing(packageData.id);
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageData.id,
          credits: packageData.credits,
        })
      });

      const data = await response.json();

      if (data.demo) {
        // Demo mode - credits added directly
        toast.success(`Added ${data.credits_added} credits (demo mode)`);
        fetchUser();
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      // Provide user-friendly error based on what went wrong
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to connect to payment processor. Please check your internet connection and try again.');
      } else if (errorMessage.includes('card') || errorMessage.includes('payment')) {
        toast.error('Payment could not be processed. Please try a different payment method or contact your bank.');
      } else {
        toast.error('We couldn\'t start the checkout. Please refresh the page and try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const getPricePerCredit = (credits: number, price: number) => {
    return (price / credits).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Purchase Credits
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Get honest feedback from real people in minutes. No subscription required.
          </p>
          
          {user && (
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-lg">
              <Zap className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-indigo-800 font-medium">
                Current balance: {currentCredits} credits
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  {feature.icon === 'clock' && <Clock className="w-5 h-5 text-green-600" />}
                  {feature.icon === 'shield' && <Shield className="w-5 h-5 text-green-600" />}
                  {feature.icon === 'check' && <Check className="w-5 h-5 text-green-600" />}
                  {feature.icon === 'refund' && <RefreshCw className="w-5 h-5 text-green-600" />}
                </div>
                <p className="text-sm text-gray-700 font-medium">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earn Credits Alternative */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-green-900 mb-1">Prefer to earn credits for free?</h3>
                <p className="text-green-700 mb-4">
                  Review 3 submissions from others to earn 1 credit. It's a great way to help the community and save money!
                </p>
                <Link
                  href="/feed?earn=true"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  Start Earning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
                pkg.popular ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${pkg.price}
                    </span>
                  </div>
                  <div className="text-lg font-medium text-indigo-600 mb-2">
                    {pkg.credits} Credits
                  </div>
                  <div className="text-sm text-gray-500">
                    ${getPricePerCredit(pkg.credits, pkg.price)} per credit
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-3">{pkg.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.id}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg focus-visible:ring-indigo-500'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus-visible:ring-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={purchasing === pkg.id ? 'Processing purchase' : `Purchase ${pkg.credits} credits for $${pkg.price}`}
                >
                  {purchasing === pkg.id ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" aria-hidden="true" />
                      Processing...
                    </span>
                  ) : (
                    'Purchase Credits'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit History - only show for logged in users */}
        {user && (
          <div className="mt-12 max-w-3xl mx-auto">
            <CreditHistory userId={user.id} />
          </div>
        )}

        {/* Pricing Clarity Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 text-center">Clear, Simple Pricing</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* No Hidden Fees */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">No hidden fees</p>
                  <p className="text-sm text-gray-600">The price you see is the price you pay. No surprises.</p>
                </div>
              </div>

              {/* Credits Never Expire */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Credits never expire</p>
                  <p className="text-sm text-gray-600">Use your credits whenever you want. No time limits.</p>
                </div>
              </div>

              {/* Money-Back Guarantee */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">100% money-back guarantee</p>
                  <p className="text-sm text-gray-600">
                    Not satisfied? Contact us within 30 days for a full refund on unused credits.{' '}
                    <Link href="/help#refunds" className="text-indigo-600 hover:text-indigo-700 underline">
                      Refund policy
                    </Link>
                  </p>
                </div>
              </div>

              {/* What You Get */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Coins className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">1 credit = 3 honest feedback reports</p>
                  <p className="text-sm text-gray-600">Each submission gets reviewed by 3 real people who provide detailed, actionable feedback.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-5 py-3 bg-green-50 border border-green-200 rounded-xl">
            <Shield className="h-5 w-5 text-green-600 mr-3" aria-hidden="true" />
            <span className="text-green-800 text-sm font-medium">
              Secure payments powered by Stripe. Your payment information is encrypted and protected.
            </span>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Purchase Credits</h3>
              <p className="text-gray-600 text-sm">
                Choose a credit package that fits your needs. No subscription required.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit Requests</h3>
              <p className="text-gray-600 text-sm">
                Upload photos or text and get feedback from real people.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600 text-sm">
                Receive honest, actionable feedback in minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}