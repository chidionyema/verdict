'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie, Shield, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'verdict_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'verdict_cookie_preferences';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid layout shift on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences({ ...preferences, ...parsed, essential: true });
          // Emit event for analytics components to check
          window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: parsed }));
        } catch {
          // Invalid JSON, reset
        }
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const finalPrefs = { ...prefs, essential: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    setShowBanner(false);
    setShowSettings(false);

    // Emit event for analytics components
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: finalPrefs }));

    // Record consent via API if user is logged in
    recordConsentToServer(finalPrefs);
  };

  const recordConsentToServer = async (prefs: CookiePreferences) => {
    try {
      // Record each consent type
      const consentTypes = [
        { type: 'cookies', given: true },
        { type: 'marketing', given: prefs.marketing },
      ];

      for (const consent of consentTypes) {
        await fetch('/api/legal/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consent_type: consent.type,
            given: consent.given,
            version: '1.0',
          }),
        }).catch(() => {
          // Silently fail if not logged in
        });
      }
    } catch {
      // User might not be logged in, that's fine
    }
  };

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  };

  const acceptEssentialOnly = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={() => {}} />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {!showSettings ? (
            // Main Banner
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                    By clicking "Accept All", you consent to our use of cookies. You can customize your preferences
                    or learn more in our{' '}
                    <Link href="/legal/cookies" className="text-indigo-600 hover:underline">
                      Cookie Policy
                    </Link>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={acceptAll} variant="primary">
                      Accept All
                    </Button>
                    <Button onClick={acceptEssentialOnly} variant="secondary">
                      Essential Only
                    </Button>
                    <Button onClick={() => setShowSettings(true)} variant="ghost">
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Essential Cookies */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Essential Cookies</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Always Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Required for the website to function. These cannot be disabled as they handle
                      authentication, security, and basic functionality.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us understand how visitors interact with our website. This data is anonymized
                      and used to improve our services.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Used to deliver personalized advertisements and measure the effectiveness of
                      advertising campaigns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button onClick={acceptEssentialOnly} variant="ghost">
                  Reject All
                </Button>
                <Button onClick={saveCustomPreferences} variant="primary">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Hook to check cookie consent
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const checkConsent = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          setConsent(JSON.parse(savedPrefs));
        } catch {
          setConsent(null);
        }
      }
    };

    checkConsent();

    // Listen for consent updates
    const handleConsentUpdate = (e: CustomEvent<CookiePreferences>) => {
      setConsent(e.detail);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  return consent;
}

// Utility to check if analytics is allowed
export function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!savedPrefs) return false;
  try {
    const prefs = JSON.parse(savedPrefs);
    return prefs.analytics === true;
  } catch {
    return false;
  }
}

// Utility to check if marketing is allowed
export function isMarketingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!savedPrefs) return false;
  try {
    const prefs = JSON.parse(savedPrefs);
    return prefs.marketing === true;
  } catch {
    return false;
  }
}
