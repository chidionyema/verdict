'use client';

import { useState } from 'react';
import { X, DollarSign, CreditCard, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { JUDGE_TIER_SYSTEM, GamificationManager } from '@/lib/gamification';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  availableCredits: number;
  tier: 'magistrate' | 'supreme_court';
}

export function PayoutRequestModal({ isOpen, onClose, userId, availableCredits, tier }: PayoutRequestModalProps) {
  const [creditsToConvert, setCreditsToConvert] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'stripe'>('paypal');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'amount' | 'payment' | 'confirmation' | 'success'>('amount');

  const gamification = new GamificationManager();
  const payoutRates = JUDGE_TIER_SYSTEM.PAYOUT_RATES[tier];
  const tierInfo = JUDGE_TIER_SYSTEM.TIERS[tier];

  const payoutCalculation = {
    cashAmount: creditsToConvert * payoutRates.creditToCash,
    processingFee: (creditsToConvert * payoutRates.creditToCash) * payoutRates.processingFee,
    netAmount: (creditsToConvert * payoutRates.creditToCash) * (1 - payoutRates.processingFee),
  };

  const canProceed = creditsToConvert >= payoutRates.minimumPayout && creditsToConvert <= availableCredits;

  const handleSubmitPayout = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    try {
      const result = await gamification.requestPayout(userId, creditsToConvert);
      
      if (result.success) {
        setStep('success');
      } else {
        toast.error(
          result.error || 'Unable to submit your payout request. Please try again.'
        );
      }
    } catch (error) {
      toast.error(
        'An unexpected error occurred while submitting your payout request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setCreditsToConvert(0);
    setPaymentEmail('');
    setStep('amount');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Cash Payout Request
            </h2>
            <button
              onClick={resetModal}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-white/20 text-white border-white/30">
              {tierInfo.icon} {tierInfo.name}
            </Badge>
            <span className="text-green-100 text-sm">
              ${payoutRates.creditToCash} per credit
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">How many credits to convert?</h3>
                <p className="text-gray-600 text-sm">
                  You have {availableCredits} credits available. Minimum payout is {payoutRates.minimumPayout} credits.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits to Convert
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={payoutRates.minimumPayout}
                      max={availableCredits}
                      value={creditsToConvert || ''}
                      onChange={(e) => setCreditsToConvert(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={`Minimum ${payoutRates.minimumPayout} credits`}
                    />
                    <Coins className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2">
                  {[
                    Math.max(payoutRates.minimumPayout, 10),
                    Math.max(payoutRates.minimumPayout, 25),
                    Math.max(payoutRates.minimumPayout, 50),
                    availableCredits
                  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount <= availableCredits)
                   .map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCreditsToConvert(amount)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {amount === availableCredits ? 'All' : amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Breakdown */}
              {creditsToConvert > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-medium text-gray-900">Payout Breakdown</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Credits ({creditsToConvert})</span>
                      <span>${payoutCalculation.cashAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Processing Fee ({(payoutRates.processingFee * 100).toFixed(0)}%)</span>
                      <span>-${payoutCalculation.processingFee.toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between font-bold text-green-700">
                      <span>You'll Receive</span>
                      <span>${payoutCalculation.netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {creditsToConvert > 0 && creditsToConvert < payoutRates.minimumPayout && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Minimum payout is {payoutRates.minimumPayout} credits
                  </span>
                </div>
              )}

              {creditsToConvert > availableCredits && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    You only have {availableCredits} credits available
                  </span>
                </div>
              )}

              <TouchButton
                onClick={() => setStep('payment')}
                disabled={!canProceed}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment Details
              </TouchButton>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Details</h3>
                <p className="text-gray-600 text-sm">
                  Choose how you'd like to receive your ${payoutCalculation.netAmount.toFixed(2)} payout.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                        paymentMethod === 'paypal'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                        PP
                      </div>
                      <div className="text-left">
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-gray-600">Instant transfer to your PayPal account</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                        paymentMethod === 'stripe'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="h-8 w-8 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Bank Account</div>
                        <div className="text-sm text-gray-600">Direct deposit to your bank account</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {paymentMethod === 'paypal' ? 'PayPal Email' : 'Bank Account Email'}
                  </label>
                  <input
                    type="email"
                    value={paymentEmail}
                    onChange={(e) => setPaymentEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder={paymentMethod === 'paypal' ? 'your.email@paypal.com' : 'your.bank.email@example.com'}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <TouchButton
                  onClick={() => setStep('amount')}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Back
                </TouchButton>
                <TouchButton
                  onClick={() => setStep('confirmation')}
                  disabled={!paymentEmail.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Request
                </TouchButton>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Payout Request</h3>
                <p className="text-gray-600 text-sm">
                  Please review your payout details before submitting.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Credits to Convert</span>
                  <span className="font-medium">{creditsToConvert}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Gross Amount</span>
                  <span className="font-medium">${payoutCalculation.cashAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Processing Fee</span>
                  <span className="font-medium">-${payoutCalculation.processingFee.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-green-700">
                  <span>Net Payout</span>
                  <span>${payoutCalculation.netAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-700">Payment Method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Payment Email</span>
                  <span className="font-medium">{paymentEmail}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Processing Information</p>
                    <p>Payouts are processed within 3-5 business days. You'll receive an email confirmation once your request is approved and processed.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <TouchButton
                  onClick={() => setStep('payment')}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Back
                </TouchButton>
                <TouchButton
                  onClick={handleSubmitPayout}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Payout Request'
                  )}
                </TouchButton>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payout Request Submitted!</h3>
                <p className="text-gray-600">
                  Your request for ${payoutCalculation.netAmount.toFixed(2)} has been submitted successfully.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Our team will review your request within 1 business day</li>
                  <li>• You'll receive an email confirmation once approved</li>
                  <li>• Payment will be processed within 3-5 business days</li>
                  <li>• {creditsToConvert} credits have been deducted from your account</li>
                </ul>
              </div>

              <TouchButton
                onClick={resetModal}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Done
              </TouchButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}