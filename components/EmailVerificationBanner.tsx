'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Mail, CheckCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmailVerificationBannerProps {
  className?: string;
}

export default function EmailVerificationBanner({ className = '' }: EmailVerificationBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single();

      const verified = Boolean((profile as { email_verified: boolean } | null)?.email_verified);
      setIsVerified(verified);
      setShowBanner(!verified);
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  const sendVerificationEmail = async () => {
    setIsSending(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        setLastSent(new Date());
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // Store dismissal in localStorage to avoid showing again this session
    localStorage.setItem('verification-banner-dismissed', 'true');
  };

  // Don't show if verified or dismissed this session
  if (!showBanner || isVerified) return null;

  const canResend = !lastSent || (Date.now() - lastSent.getTime()) > 30000; // 30 second cooldown

  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Please verify your email address to create requests or become a judge. 
                  Check your inbox for a verification link.
                </p>
                
                {error && (
                  <p className="mt-2 text-red-600 text-sm">{error}</p>
                )}
                
                {lastSent && (
                  <p className="mt-2 text-green-600 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verification email sent! Check your inbox.
                  </p>
                )}
              </div>
              
              <div className="mt-3">
                <button
                  onClick={sendVerificationEmail}
                  disabled={isSending || !canResend}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-amber-800 bg-amber-200 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-amber-800 border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {lastSent ? 'Resend Email' : 'Send Verification Email'}
                    </>
                  )}
                </button>
                
                {!canResend && lastSent && (
                  <span className="ml-3 text-xs text-amber-600">
                    Wait {Math.ceil((30000 - (Date.now() - lastSent.getTime())) / 1000)}s to resend
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={dismissBanner}
              className="ml-4 flex-shrink-0 text-amber-400 hover:text-amber-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}