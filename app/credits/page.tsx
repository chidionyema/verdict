'use client';

// Force dynamic rendering to prevent SSG issues with Supabase
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  description?: string;
}

const features = [
  'Get feedback from real people in minutes',
  'Anonymous and honest opinions',
  'No subscription required',
  '100% money-back guarantee'
];

export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchUser();
    fetchPackages();
  }, []);

  const fetchUser = async () => {
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
      // For now, use the default packages from the schema
      // In a real app, you'd fetch from the database
      const defaultPackages: CreditPackage[] = [
        {
          id: '1',
          name: 'Starter',
          credits: 10,
          price: 9.99,
          popular: false,
          description: 'Perfect for trying out the platform'
        },
        {
          id: '2',
          name: 'Popular',
          credits: 25,
          price: 19.99,
          popular: true,
          description: 'Most popular choice for regular users'
        },
        {
          id: '3',
          name: 'Pro',
          credits: 60,
          price: 39.99,
          popular: false,
          description: 'Great value for power users'
        },
        {
          id: '4',
          name: 'Enterprise',
          credits: 150,
          price: 89.99,
          popular: false,
          description: 'Maximum value for heavy usage'
        }
      ];
      
      setPackages(defaultPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageData: CreditPackage) => {
    if (!user) {
      router.push('/auth/login?redirect=/credits');
      return;
    }

    setPurchasing(packageData.id);
    
    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit_purchase',
          package_id: packageData.id,
          success_url: `${window.location.origin}/dashboard?purchase=success`,
          cancel_url: `${window.location.origin}/credits?purchase=cancelled`
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start purchase. Please try again.');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-center">
                <div className="flex-shrink-0 mx-auto mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">{feature}</p>
              </div>
            ))}
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
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    pkg.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pkg.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Purchase Credits'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-3 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
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