'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Coins, Zap, CreditCard, ArrowRight, AlertCircle, Check, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
  currentCredits: number;
  onPurchaseSuccess?: () => void;
  onEarnCreditsClick?: () => void; // Called before navigating to earn credits
  returnUrl?: string; // URL to return to after earning credits (default: /submit)
}

// Package IDs must match CREDIT_PACKAGES in lib/validations.ts
const defaultPackages: CreditPackage[] = [
  { id: 'starter', name: 'Starter', credits: 5, price: 17.45 },
  { id: 'popular', name: 'Popular', credits: 10, price: 34.90, popular: true },
  { id: 'value', name: 'Value Pack', credits: 25, price: 87.25 },
];

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  requiredCredits,
  currentCredits,
  onPurchaseSuccess,
  onEarnCreditsClick,
  returnUrl = '/submit',
}: InsufficientCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>(defaultPackages);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const router = useRouter();

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const creditsNeeded = requiredCredits - currentCredits;

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  // Store previously focused element and restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Focus the close button when modal opens
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  }, [isOpen]);

  // Escape key to close modal and focus trap (WCAG accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: Tab key cycles through focusable elements
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchPackages = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from('credit_packages')
        .select('id, name, credits, price, popular')
        .order('credits', { ascending: true })
        .limit(3);

      if (!error && data && data.length > 0) {
        setCreditPackages((data as any[]).map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          credits: pkg.credits,
          price: Number(pkg.price),
          popular: pkg.popular || false
        })));
      }
    } catch (err) {
      // Silently fall back to defaults
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(pkg.id);
    setError('');

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          credits: pkg.credits + (pkg.bonus || 0),
        }),
      });

      const data = await response.json();

      if (data.demo) {
        // Demo mode - credits added directly, show success ceremony
        const pkg = creditPackages.find(p => p.id === loading);
        setPurchasedCredits(pkg ? pkg.credits + (pkg.bonus || 0) : 0);
        setShowSuccess(true);
        setLoading(null);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  // Success ceremony view
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* Celebration particles */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-white/90 text-lg">
                {purchasedCredits} credits added to your account
              </p>
            </div>
          </div>

          <div className="p-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700 mb-1">Your new balance</p>
              <p className="text-4xl font-bold text-green-800">
                {currentCredits + purchasedCredits} credits
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                onPurchaseSuccess?.();
                onClose();
              }}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition"
            >
              Continue to Submit
            </button>

            <p className="text-xs text-gray-500 mt-4">
              A receipt has been sent to your email
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h2 id="credits-modal-title" className="text-2xl font-bold mb-2">You need more credits</h2>
            <p className="text-white/90">
              This request requires <strong>{requiredCredits} credits</strong>, but you have <strong>{currentCredits}</strong>.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Credit explanation */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-indigo-800">
              <strong>1 credit = 1 submission with 3 honest feedback reports</strong>
            </p>
          </div>

          {/* Credits needed indicator */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">You need {creditsNeeded} more credit{creditsNeeded !== 1 ? 's' : ''}</p>
              <p className="text-sm text-amber-700">Choose a package below or earn for free</p>
            </div>
          </div>

          {/* Earn credits option */}
          <button
            onClick={() => {
              // Call callback to save draft before navigating
              onEarnCreditsClick?.();
              onClose();
              router.push(`/feed?earn=true&return=${encodeURIComponent(returnUrl)}`);
            }}
            className="block w-full p-4 mb-6 bg-green-50 border-2 border-green-200 rounded-xl hover:border-green-400 transition text-center"
          >
            <p className="font-bold text-green-800">🎯 Earn 1 Credit Free (~15 min)</p>
            <p className="text-sm text-green-700 mt-1">
              Review 3 submissions from others to earn 1 credit
            </p>
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Credit packages */}
          <div className="space-y-3 mb-6">
            {creditPackages.map((pkg) => {
              const totalCredits = pkg.credits + (pkg.bonus || 0);
              const meetsRequirement = totalCredits >= creditsNeeded;

              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading !== null}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                    pkg.popular
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  } ${loading === pkg.id ? 'opacity-75' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pkg.popular ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        {pkg.popular ? (
                          <Sparkles className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <Coins className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{pkg.credits} credits</span>
                          {pkg.bonus && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              +{pkg.bonus} bonus
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{pkg.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {meetsRequirement && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <Check className="h-4 w-4" />
                          <span>Enough</span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${pkg.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-700">
                          ${(pkg.price / totalCredits).toFixed(2)}/credit
                        </p>
                      </div>
                      {loading === pkg.id ? (
                        <Spinner size="sm" variant="primary" label="Processing payment" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-between text-sm">
            <Link
              href="/credits"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View all packages
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-700">
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Instant delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
