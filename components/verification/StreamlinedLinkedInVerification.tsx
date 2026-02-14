'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, Linkedin, CheckCircle, AlertCircle, Zap, Lock, RefreshCw, HelpCircle, Clipboard } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface StreamlinedLinkedInVerificationProps {
  userId: string;
  isVerified?: boolean;
  onVerificationComplete?: (verified: boolean, expertise?: string) => void;
}

type ErrorType = 'validation' | 'network' | 'not_found' | 'private' | 'generic';

interface ErrorState {
  type: ErrorType;
  message: string;
}

// Smart LinkedIn URL normalization - handles all input formats
function normalizeLinkedInUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Starts with linkedin.com
  if (trimmed.startsWith('linkedin.com') || trimmed.startsWith('www.linkedin.com')) {
    return `https://${trimmed}`;
  }

  // Just the username or /in/username
  if (trimmed.startsWith('/in/')) {
    return `https://linkedin.com${trimmed}`;
  }

  if (trimmed.startsWith('in/')) {
    return `https://linkedin.com/${trimmed}`;
  }

  // Plain username - could be "john-doe" or "johndoe123"
  // Only prepend if it looks like a username (alphanumeric with dashes)
  if (/^[a-zA-Z0-9-]+$/.test(trimmed) && trimmed.length >= 2) {
    return `https://linkedin.com/in/${trimmed}`;
  }

  // Return as-is for validation to catch
  return trimmed;
}

// Extract username for display
function extractUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  return match ? match[1] : null;
}

// Real-time validation
function validateLinkedInInput(input: string): { valid: boolean; hint?: string; normalized?: string } {
  if (!input.trim()) {
    return { valid: false };
  }

  const normalized = normalizeLinkedInUrl(input);
  const username = extractUsername(normalized);

  if (username) {
    return { valid: true, normalized, hint: `Will verify: linkedin.com/in/${username}` };
  }

  // Partial input hints
  if (input.length < 3) {
    return { valid: false, hint: 'Enter your LinkedIn username or profile URL' };
  }

  return { valid: false, hint: 'Example: linkedin.com/in/your-name or just your-name' };
}

// Error type detection for better recovery suggestions
function categorizeError(errorMessage: string, statusCode?: number): ErrorType {
  if (statusCode === 404 || errorMessage.toLowerCase().includes('not found')) {
    return 'not_found';
  }
  if (errorMessage.toLowerCase().includes('private') || errorMessage.toLowerCase().includes('restricted')) {
    return 'private';
  }
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
    return 'network';
  }
  return 'generic';
}

export function StreamlinedLinkedInVerification({
  userId,
  isVerified = false,
  onVerificationComplete
}: StreamlinedLinkedInVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'start' | 'processing' | 'verified' | 'failed'>('start');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [detectedExpertise, setDetectedExpertise] = useState<string>('');
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [validationState, setValidationState] = useState<{ valid: boolean; hint?: string; normalized?: string }>({ valid: false });
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time validation as user types
  useEffect(() => {
    const state = validateLinkedInInput(linkedinInput);
    setValidationState(state);
    // Clear errors when user starts typing valid input
    if (state.valid && errorState?.type === 'validation') {
      setErrorState(null);
    }
  }, [linkedinInput, errorState?.type]);

  // Handle paste - smart normalization
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const normalized = normalizeLinkedInUrl(pasted);
    setLinkedinInput(normalized);
  };

  // Mobile paste button
  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const normalized = normalizeLinkedInUrl(text);
      setLinkedinInput(normalized);
      inputRef.current?.focus();
    } catch {
      // Clipboard API not available or permission denied
      inputRef.current?.focus();
    }
  };

  const handleInstantVerification = async () => {
    const normalized = validationState.normalized || normalizeLinkedInUrl(linkedinInput);

    if (!normalized || !validationState.valid) {
      setErrorState({
        type: 'validation',
        message: 'Please enter a valid LinkedIn profile URL or username'
      });
      return;
    }

    setIsSubmitting(true);
    setVerificationStep('processing');
    setErrorState(null);

    try {
      const response = await fetch('/api/judge/instant-verify-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          linkedinUrl: normalized,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStep('verified');
        setDetectedExpertise(data.expertise || 'Professional');
        onVerificationComplete?.(true, data.expertise);
      } else {
        const errorType = categorizeError(data.error || '', response.status);
        setVerificationStep('failed');
        setErrorState({
          type: errorType,
          message: data.error || 'Unable to verify this LinkedIn profile'
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationStep('failed');
      setErrorState({
        type: 'network',
        message: 'Connection error. Please check your internet connection.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 text-white rounded-full p-2">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Verified Expert</h3>
            <p className="text-sm text-green-700">Your expertise is verified</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <p className="text-sm text-green-700">
          You now qualify for expert-tier judgments and higher compensation.
        </p>
      </div>
    );
  }

  if (verificationStep === 'processing') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-full p-2 animate-pulse">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Instant Verification</h3>
            <p className="text-sm text-blue-700">Checking your LinkedIn profile...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Validating profile authenticity
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            Detecting expertise areas
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            Verifying professional experience
          </div>
        </div>
      </div>
    );
  }

  if (verificationStep === 'verified') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 text-white rounded-full p-2">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Verification Complete!</h3>
            <p className="text-sm text-green-700">Detected expertise: {detectedExpertise}</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-green-700">
            🎉 You're now a verified expert! This unlocks:
          </p>
          <ul className="space-y-1 text-sm text-green-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Priority routing to relevant judgments
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Higher compensation for expert judgments
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Trust badge on all your feedback
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (verificationStep === 'failed') {
    // Context-specific error messages and recovery options
    const errorContent = {
      not_found: {
        title: "Profile Not Found",
        subtitle: "We couldn't find this LinkedIn profile",
        suggestions: [
          "Double-check your LinkedIn username is correct",
          "Make sure your profile URL includes /in/your-name",
          "Try copying the URL directly from your LinkedIn profile page"
        ]
      },
      private: {
        title: "Profile is Private",
        subtitle: "This profile has restricted visibility",
        suggestions: [
          "Temporarily set your LinkedIn profile to public",
          "Go to LinkedIn Settings > Visibility > Edit your public profile",
          "Try again after updating your settings"
        ]
      },
      network: {
        title: "Connection Issue",
        subtitle: "We couldn't reach our verification service",
        suggestions: [
          "Check your internet connection",
          "Wait a moment and try again",
          "If the problem persists, contact support"
        ]
      },
      validation: {
        title: "Invalid Format",
        subtitle: "Please check your LinkedIn URL",
        suggestions: [
          "Enter your LinkedIn username (e.g., john-doe)",
          "Or paste your full profile URL",
          "Example: linkedin.com/in/your-name"
        ]
      },
      generic: {
        title: "Verification Issue",
        subtitle: "Something went wrong",
        suggestions: [
          "Double-check your LinkedIn URL is correct",
          "Try again in a few moments",
          "Contact support if the issue continues"
        ]
      }
    };

    const content = errorContent[errorState?.type || 'generic'];

    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-600 text-white rounded-full p-2">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900">{content.title}</h3>
            <p className="text-sm text-orange-700">{content.subtitle}</p>
          </div>
        </div>

        {/* Specific error message if available */}
        {errorState?.message && errorState.type !== 'validation' && (
          <p className="text-sm text-orange-700 mb-3 bg-orange-100 rounded-lg px-3 py-2">
            {errorState.message}
          </p>
        )}

        {/* Recovery suggestions */}
        <div className="mb-4">
          <p className="text-xs font-medium text-orange-800 mb-2">Try this:</p>
          <ul className="space-y-1">
            {content.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery actions - multiple pathways */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setVerificationStep('start');
              setErrorState(null);
              setLinkedinInput('');
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <div className="flex gap-2">
            <a
              href="https://linkedin.com/in/me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-white border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 transition text-sm font-medium text-center"
            >
              Open My LinkedIn
            </a>
            <a
              href="mailto:support@verdict.app?subject=LinkedIn Verification Issue"
              className="flex-1 py-2.5 px-4 bg-white border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 transition text-sm font-medium text-center flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Get Help
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-full p-2">
          <Linkedin className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sky-900">Connect Your LinkedIn</h3>
          <p className="text-sm text-sky-700">Instant verification, unlock higher earnings</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Why connect LinkedIn?</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-sky-600" />
            <span><strong>+25% earnings</strong> on all verdicts</span>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-600" />
            <span><strong>Verified badge</strong> increases your credibility</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-sky-600" />
            <span><strong>Priority queue</strong> access to more requests</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <div className="relative flex gap-2">
            {/* Smart input with mobile optimization */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="url"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                id="linkedin-url"
                value={linkedinInput}
                onChange={(e) => setLinkedinInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="your-username or full URL"
                className={`w-full pl-4 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errorState?.type === 'validation'
                    ? 'border-red-300 bg-red-50'
                    : validationState.valid
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-300'
                }`}
              />
              {/* Validation indicator */}
              {linkedinInput && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationState.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Linkedin className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* Mobile paste button */}
            <button
              type="button"
              onClick={handlePasteButton}
              className="px-3 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center min-h-[48px] shrink-0"
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Real-time validation hint */}
          {errorState?.type === 'validation' ? (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorState.message}
            </p>
          ) : validationState.hint ? (
            <p className={`mt-1.5 text-xs ${validationState.valid ? 'text-green-600' : 'text-gray-500'}`}>
              {validationState.valid && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {validationState.hint}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Paste your profile URL or just enter your username
            </p>
          )}
        </div>

        <TouchButton
          onClick={handleInstantVerification}
          disabled={!validationState.valid || isSubmitting}
          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white disabled:opacity-50 min-h-[48px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <Linkedin className="h-4 w-4 mr-2" />
              Verify & Unlock +25%
            </>
          )}
        </TouchButton>

        {/* Trust & Privacy - Expandable */}
        <div className="pt-2 border-t border-sky-200/50">
          <button
            type="button"
            onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition py-1"
          >
            <Lock className="h-3 w-3" />
            <span>Your privacy is protected</span>
            <span className={`transition-transform ${showPrivacyInfo ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showPrivacyInfo && (
            <div className="mt-2 p-3 bg-white/60 rounded-lg text-xs text-gray-600 space-y-2">
              <p className="flex items-start gap-2">
                <Shield className="h-3 w-3 text-sky-600 mt-0.5 shrink-0" />
                <span>We only verify your profile exists and extract your professional title. We don't store your connections, posts, or private data.</span>
              </p>
              <p className="flex items-start gap-2">
                <Lock className="h-3 w-3 text-sky-600 mt-0.5 shrink-0" />
                <span>Your LinkedIn URL is encrypted and never shared with other users or third parties.</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-sky-600 mt-0.5 shrink-0" />
                <span>You can disconnect LinkedIn anytime from your account settings.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}