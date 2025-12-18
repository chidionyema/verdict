'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, Check, Users, Sparkles } from 'lucide-react';
import { referralService, isValidReferralCode } from '@/lib/referral-system';

interface ReferralSignupFlowProps {
  onReferralApplied?: (referralCode: string) => void;
}

export function ReferralSignupFlow({ onReferralApplied }: ReferralSignupFlowProps) {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  useEffect(() => {
    // Check for referral code in URL params
    const refParam = searchParams.get('ref');
    if (refParam && isValidReferralCode(refParam)) {
      setReferralCode(refParam);
      setIsValid(true);
      setApplied(true);
      onReferralApplied?.(refParam);
    }
  }, [searchParams, onReferralApplied]);

  const handleReferralCodeChange = (code: string) => {
    setReferralCode(code.toUpperCase());
    const valid = isValidReferralCode(code);
    setIsValid(valid);
    
    if (valid) {
      onReferralApplied?.(code);
      setApplied(true);
    }
  };

  const toggleReferralInput = () => {
    setShowInput(!showInput);
  };

  if (applied && isValid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Referral Code Applied! 🎉</h3>
            <p className="text-sm text-green-700">
              You and your friend will both get 1 free credit when you complete signup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Referral Prompt */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Gift className="h-6 w-6 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-purple-900 mb-1">
              Got a referral code?
            </h3>
            <p className="text-sm text-purple-700 mb-3">
              Enter your friend's code to get 1 free credit for both of you!
            </p>
            
            {!showInput ? (
              <button
                onClick={toggleReferralInput}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
              >
                I have a referral code →
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => handleReferralCodeChange(e.target.value)}
                    placeholder="Enter code (e.g., VERAB34)"
                    className={`flex-1 px-3 py-2 border rounded-md text-sm font-mono ${
                      referralCode 
                        ? isValid 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    maxLength={8}
                  />
                  {isValid && (
                    <div className="flex items-center px-3 py-2 bg-green-100 border border-green-300 rounded-md">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
                
                {referralCode && !isValid && (
                  <p className="text-xs text-red-600">
                    Invalid code format. Codes are 8 characters starting with VER.
                  </p>
                )}
                
                <button
                  onClick={() => setShowInput(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Never mind
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral Benefits Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          What happens when you refer friends?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4 text-purple-600" />
            <span>They get 1 free credit instantly</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Gift className="h-4 w-4 text-green-600" />
            <span>You get 1 free credit too</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share your code after signing up to start earning credits!
        </p>
      </div>
    </div>
  );
}

// Hook for managing referral state during signup
export function useReferralSignup() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [isValidReferral, setIsValidReferral] = useState<boolean>(false);

  const applyReferralCode = async (code: string, userEmail: string, userId?: string) => {
    if (!isValidReferralCode(code)) return false;

    try {
      if (userId) {
        const success = await referralService.applyReferralCode(userId, userEmail, code);
        return success;
      }
      
      // Store for later application after user ID is available
      setReferralCode(code);
      setIsValidReferral(true);
      return true;
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      return false;
    }
  };

  const completeReferral = async (userId: string, userEmail: string) => {
    if (referralCode && isValidReferral) {
      return await referralService.applyReferralCode(userId, userEmail, referralCode);
    }
    return false;
  };

  return {
    referralCode,
    isValidReferral,
    applyReferralCode,
    completeReferral,
    clearReferral: () => {
      setReferralCode('');
      setIsValidReferral(false);
    }
  };
}