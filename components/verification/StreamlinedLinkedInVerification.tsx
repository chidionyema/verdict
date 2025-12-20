'use client';

import { useState } from 'react';
import { Shield, Linkedin, CheckCircle, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface StreamlinedLinkedInVerificationProps {
  userId: string;
  isVerified?: boolean;
  onVerificationComplete?: (verified: boolean, expertise?: string) => void;
}

export function StreamlinedLinkedInVerification({ 
  userId, 
  isVerified = false, 
  onVerificationComplete 
}: StreamlinedLinkedInVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'start' | 'processing' | 'verified' | 'failed'>('start');
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [detectedExpertise, setDetectedExpertise] = useState<string>('');

  const handleInstantVerification = async () => {
    if (!linkedinProfile.trim()) return;
    
    setIsSubmitting(true);
    setVerificationStep('processing');
    
    try {
      const response = await fetch('/api/judge/instant-verify-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          linkedinUrl: linkedinProfile,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStep('verified');
        setDetectedExpertise(data.expertise || 'Professional');
        onVerificationComplete?.(true, data.expertise);
      } else {
        setVerificationStep('failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationStep('failed');
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
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-600 text-white rounded-full p-2">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900">Verification Not Complete</h3>
            <p className="text-sm text-orange-700">Unable to verify this profile automatically</p>
          </div>
        </div>
        <p className="text-sm text-orange-700 mb-4">
          Please ensure your LinkedIn profile is public and includes professional experience information.
        </p>
        <button
          onClick={() => setVerificationStep('start')}
          className="w-full py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-2">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-indigo-900">Instant Expert Verification</h3>
          <p className="text-sm text-indigo-700">Get verified in seconds, not days</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Why become a verified expert?</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span><strong>2x higher compensation</strong> for expert judgments</span>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span><strong>Trust badge</strong> increases your credibility</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-indigo-600" />
            <span><strong>Priority routing</strong> to your expertise areas</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="linkedin-url"
              value={linkedinProfile}
              onChange={(e) => setLinkedinProfile(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            We'll automatically detect your professional expertise from your profile
          </p>
        </div>

        <TouchButton
          onClick={handleInstantVerification}
          disabled={!linkedinProfile.trim() || isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Instant Verification (Free)
            </>
          )}
        </TouchButton>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Zap className="h-3 w-3 text-indigo-600" />
          <span>Instant • Automatic • No manual review needed</span>
        </div>
      </div>
    </div>
  );
}