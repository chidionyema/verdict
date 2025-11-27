'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Shield, BarChart3, Target, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_PREFERENCES_KEY = 'verdict_cookie_preferences';

export default function CookiePolicyPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences({ ...parsed, essential: true });
      } catch {
        // Invalid JSON
      }
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem('verdict_cookie_consent', new Date().toISOString());
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: preferences }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cookie className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cookies are small text files that are stored on your device when you visit a website.
              They help websites remember your preferences, understand how you use the site, and
              provide personalized experiences.
            </p>
            <p className="text-gray-600 leading-relaxed">
              At Verdict, we use cookies and similar technologies to ensure our platform works
              correctly, analyze how you use our services, and improve your experience.
            </p>
          </section>

          {/* Types of Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Types of Cookies We Use</h2>

            {/* Essential */}
            <div className="mb-6 p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-600 mb-4">
                    These cookies are necessary for the website to function and cannot be disabled.
                    They include cookies for authentication, security, and basic functionality.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-200">
                        <th className="text-left py-2 text-gray-700">Cookie Name</th>
                        <th className="text-left py-2 text-gray-700">Purpose</th>
                        <th className="text-left py-2 text-gray-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-green-100">
                        <td className="py-2 font-mono text-xs">sb-*-auth-token</td>
                        <td className="py-2">Supabase authentication session</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-b border-green-100">
                        <td className="py-2 font-mono text-xs">__stripe_mid</td>
                        <td className="py-2">Stripe fraud prevention</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr className="border-b border-green-100">
                        <td className="py-2 font-mono text-xs">__stripe_sid</td>
                        <td className="py-2">Stripe session identifier</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">verdict_cookie_consent</td>
                        <td className="py-2">Records your cookie preferences</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-gray-600 mb-4">
                    These cookies help us understand how visitors interact with our website by
                    collecting and reporting information anonymously. They help us improve our services.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-200">
                        <th className="text-left py-2 text-gray-700">Cookie Name</th>
                        <th className="text-left py-2 text-gray-700">Purpose</th>
                        <th className="text-left py-2 text-gray-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-blue-100">
                        <td className="py-2 font-mono text-xs">_ga</td>
                        <td className="py-2">Google Analytics - distinguishes users</td>
                        <td className="py-2">2 years</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 font-mono text-xs">_ga_*</td>
                        <td className="py-2">Google Analytics - maintains session state</td>
                        <td className="py-2">2 years</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">ph_*</td>
                        <td className="py-2">PostHog - product analytics</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                  <p className="text-gray-600 mb-4">
                    These cookies are used to track visitors across websites to display relevant
                    advertisements. They may be set by our advertising partners.
                  </p>
                  <p className="text-gray-500 text-sm italic">
                    We currently do not use marketing cookies, but may in the future to improve
                    our advertising effectiveness.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You can manage your cookie preferences at any time using the controls below or through
              your browser settings. Note that disabling certain cookies may affect the functionality
              of our website.
            </p>

            {/* Cookie Settings */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Your Cookie Settings</h3>
              </div>

              <div className="space-y-4">
                {/* Essential - Always on */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Essential Cookies</p>
                    <p className="text-sm text-gray-500">Required for basic functionality</p>
                  </div>
                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    Always Active
                  </span>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Analytics Cookies</p>
                    <p className="text-sm text-gray-500">Help us improve our services</p>
                  </div>
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

                {/* Marketing */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Cookies</p>
                    <p className="text-sm text-gray-500">Personalized advertisements</p>
                  </div>
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
              </div>

              <div className="mt-4 flex items-center gap-4">
                <Button onClick={savePreferences} variant="primary">
                  Save Preferences
                </Button>
                {saved && (
                  <span className="text-sm text-green-600">Preferences saved!</span>
                )}
              </div>
            </div>
          </section>

          {/* Browser Settings */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browser Cookie Settings</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings. Here are links
              to cookie management instructions for popular browsers:
            </p>
            <ul className="space-y-2">
              {[
                { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
                { name: 'Apple Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac' },
                { name: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
              ].map((browser) => (
                <li key={browser.name}>
                  <a
                    href={browser.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    {browser.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Updates */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for operational, legal, or regulatory reasons. We will notify you of any material
              changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600">
                <strong>Email:</strong> privacy@verdict.com
              </p>
            </div>
          </section>
        </div>

        {/* Related Links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/legal/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/legal/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/legal/community-guidelines" className="text-indigo-600 hover:underline">
            Community Guidelines
          </Link>
        </div>
      </div>
    </div>
  );
}
