'use client';

import { useState } from 'react';
import { Shield, Linkedin, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface LinkedInVerificationProps {
  userId: string;
  isVerified?: boolean;
  onVerificationUpdate?: (verified: boolean) => void;
}

export function LinkedInVerification({ userId, isVerified = false, onVerificationUpdate }: LinkedInVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'start' | 'submitted' | 'verified'>('start');
  const [linkedinProfile, setLinkedinProfile] = useState('');

  const handleSubmitVerification = async () => {
    if (!linkedinProfile.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would:
      // 1. Validate LinkedIn URL format
      // 2. Store verification request in database
      // 3. Trigger manual review process
      // 4. Send notification to admin for review
      
      const response = await fetch('/api/judge/verify-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          linkedinUrl: linkedinProfile,
        }),
      });

      if (response.ok) {
        setVerificationStep('submitted');
        // Optionally show success state
      }
    } catch (error) {
      console.error('Verification submission failed:', error);
      // Handle error
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
            <h3 className="font-semibold text-green-900">Verified Professional</h3>
            <p className="text-sm text-green-700">Your profile has been verified</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <p className="text-sm text-green-700">
          Your reviews now display a verification badge, increasing trust and potentially earning higher tips.
        </p>
      </div>
    );
  }

  if (verificationStep === 'submitted') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-full p-2">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Verification Submitted</h3>
            <p className="text-sm text-blue-700">We&apos;re reviewing your LinkedIn profile</p>
          </div>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Our team will verify your professional credentials within 24-48 hours. You&apos;ll receive an email when approved.
        </p>
        <p className="text-xs text-blue-600">
          Verification helps users trust your expertise and may increase tips by up to 40%.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-600 text-white rounded-full p-2">
          <Linkedin className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-indigo-900">Verify Your Professional Profile</h3>
          <p className="text-sm text-indigo-700">Increase trust and earn higher tips</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Why verify?</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Display expertise badges (e.g., "Verified HR Professional")
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Users more likely to trust your feedback (+40% tips)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Priority access to relevant judgment categories
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
            Your LinkedIn Profile URL
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
            We&apos;ll verify your professional experience and industry expertise
          </p>
        </div>

        <TouchButton
          onClick={handleSubmitVerification}
          disabled={!linkedinProfile.trim() || isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting for Review...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Submit for Verification
            </>
          )}
        </TouchButton>

        <p className="text-xs text-gray-500 text-center">
          Manual review • 24-48 hours • Free for all judges
        </p>
      </div>
    </div>
  );
}