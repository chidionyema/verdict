'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_PREFERENCES_KEY = 'verdict_cookie_preferences';

/**
 * Analytics Provider
 *
 * Privacy-friendly analytics (no consent needed):
 * - Vercel Analytics (if on Vercel - automatic)
 * - Vercel Speed Insights (Web Vitals)
 * - Microsoft Clarity (if NEXT_PUBLIC_CLARITY_PROJECT_ID is set)
 *
 * Consent-required analytics:
 * - Google Analytics (if NEXT_PUBLIC_GOOGLE_ANALYTICS is set)
 * - PostHog (if NEXT_PUBLIC_POSTHOG_KEY is set)
 */
export function AnalyticsProvider() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    // Check initial consent
    const checkConsent = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          const prefs: CookiePreferences = JSON.parse(savedPrefs);
          setAnalyticsConsent(prefs.analytics === true);
        } catch {
          setAnalyticsConsent(false);
        }
      }
    };

    checkConsent();

    // Listen for consent updates
    const handleConsentUpdate = (e: CustomEvent<CookiePreferences>) => {
      setAnalyticsConsent(e.detail.analytics === true);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  return (
    <>
      {/* Privacy-friendly analytics - no consent needed */}

      {/* Vercel Analytics - only works on Vercel, no-op elsewhere */}
      <Analytics />

      {/* Vercel Speed Insights - Web Vitals tracking */}
      <SpeedInsights />

      {/* Microsoft Clarity - privacy-friendly session recordings */}
      {clarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}

      {/* Consent-required analytics */}
      {analyticsConsent && (
        <>
          {/* Google Analytics */}
          {gaId && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                    anonymize_ip: true
                  });
                `}
              </Script>
            </>
          )}

          {/* PostHog */}
          {posthogKey && (
            <Script id="posthog-analytics" strategy="afterInteractive">
              {`
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${posthogKey}', {
                  api_host: '${posthogHost}',
                  capture_pageview: true,
                  capture_pageleave: true,
                  disable_session_recording: true
                });
              `}
            </Script>
          )}
        </>
      )}
    </>
  );
}

/**
 * Hook to track events only when analytics is consented
 */
export function useAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          const prefs: CookiePreferences = JSON.parse(savedPrefs);
          setHasConsent(prefs.analytics === true);
        } catch {
          setHasConsent(false);
        }
      }
    };

    checkConsent();

    const handleConsentUpdate = (e: CustomEvent<CookiePreferences>) => {
      setHasConsent(e.detail.analytics === true);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
    if (!hasConsent) return;

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventName, properties);
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
    if (!hasConsent) return;

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', { user_id: userId });
    }

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.identify(userId, traits);
    }
  };

  return {
    hasConsent,
    trackEvent,
    identifyUser,
  };
}
