'use client';

import { useState } from 'react';
import { X, Heart, DollarSign, Star, Coffee, Sparkles } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { VerifiedBadge } from '@/components/verification/VerifiedBadge';
import { toast } from '@/components/ui/toast';
import { FeatureErrorBoundary } from '@/components/ui/error-boundary';

interface TipReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewer: {
    id: string;
    verdictResponseId: string;
    name: string;
    isVerified: boolean;
    verifiedCategory?: 'hr' | 'tech' | 'design' | 'marketing' | 'finance' | 'general';
    verifiedLevel?: 'linkedin' | 'expert' | 'elite';
    specialization: string;
    feedbackSnippet: string;
  };
  onTipSubmit: (amount: number, message: string, clientSecret?: string, paymentIntentId?: string) => Promise<void>;
}

const TIP_PRESETS = [
  { amount: 1, label: '$1', icon: Coffee, description: 'Coffee tip', color: 'from-amber-500 to-orange-500' },
  { amount: 3, label: '$3', icon: Heart, description: 'Helpful advice', color: 'from-pink-500 to-rose-500' },
  { amount: 5, label: '$5', icon: Star, description: 'Great feedback', color: 'from-blue-500 to-indigo-500' },
  { amount: 10, label: '$10', icon: Sparkles, description: 'Life-changing!', color: 'from-purple-500 to-violet-500' },
];

const TIP_MESSAGES = [
  "Thank you for the helpful advice!",
  "Your feedback was exactly what I needed!",
  "This really helped me see things differently.",
  "Your expertise made all the difference!",
  "I appreciate the time you took to help me.",
];

export function TipReviewerModal({ isOpen, onClose, reviewer, onTipSubmit }: TipReviewerModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(3);
  const [customAmount, setCustomAmount] = useState('');
  const [tipMessage, setTipMessage] = useState(TIP_MESSAGES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const isValidAmount = finalAmount >= 1 && finalAmount <= 50;

  const handleSubmitTip = async () => {
    if (!isValidAmount) return;

    setIsSubmitting(true);
    try {
      // Create tip and get payment intent
      const response = await fetch('/api/tips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: reviewer.id,
          verdictResponseId: reviewer.verdictResponseId,
          amountCents: Math.round(finalAmount * 100),
          tipMessage: tipMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tip');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Call the parent handler with payment details
      await onTipSubmit(finalAmount, tipMessage, clientSecret, paymentIntentId);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting tip:', error);
      toast.error(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSelectedAmount(3);
    setCustomAmount('');
    setTipMessage(TIP_MESSAGES[0]);
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FeatureErrorBoundary>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6" />
              Tip Reviewer
            </h2>
            <button
              onClick={resetModal}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-pink-100 mt-2">Show appreciation for exceptional feedback</p>
        </div>

        <div className="p-6">
          {!showSuccess ? (
            <div className="space-y-6">
              {/* Reviewer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">
                      {reviewer.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{reviewer.name}</span>
                      {reviewer.isVerified && (
                        <VerifiedBadge
                          isVerified={true}
                          level={reviewer.verifiedLevel}
                          category={reviewer.verifiedCategory}
                          size="sm"
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{reviewer.specialization}</p>
                  </div>
                </div>
                <blockquote className="text-sm text-gray-700 italic border-l-3 border-indigo-300 pl-3">
                  "{reviewer.feedbackSnippet}"
                </blockquote>
              </div>

              {/* Tip Amount Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Choose tip amount</h3>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-2 gap-3">
                  {TIP_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedAmount === preset.amount && !customAmount;
                    
                    return (
                      <button
                        key={preset.amount}
                        onClick={() => {
                          setSelectedAmount(preset.amount);
                          setCustomAmount('');
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${preset.color} flex items-center justify-center`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="font-bold text-lg">{preset.label}</div>
                          <div className="text-sm text-gray-600">{preset.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom amount ($1 - $50)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.50"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0); // Clear preset selection
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter custom amount"
                    />
                  </div>
                </div>
              </div>

              {/* Tip Message */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Add a message (optional)
                </label>
                <div className="space-y-2">
                  {TIP_MESSAGES.slice(0, 3).map((message) => (
                    <button
                      key={message}
                      onClick={() => setTipMessage(message)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                        tipMessage === message
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      "{message}"
                    </button>
                  ))}
                </div>
                <textarea
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={2}
                  placeholder="Or write your own message..."
                />
              </div>

              {/* Summary */}
              {isValidAmount && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-900 font-medium">
                      Tip for {reviewer.name}
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${finalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    100% goes to the reviewer • Helps attract quality feedback
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <TouchButton
                onClick={handleSubmitTip}
                disabled={!isValidAmount || isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending Tip...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Send ${finalAmount.toFixed(2)} Tip
                  </>
                )}
              </TouchButton>

              <p className="text-xs text-gray-500 text-center">
                Tips encourage quality feedback and help build a better community
              </p>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tip Sent!</h3>
              <p className="text-gray-600 mb-4">
                Your ${finalAmount.toFixed(2)} tip has been sent to {reviewer.name}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Thank you for supporting quality feedback! Your tip helps incentivize thoughtful, helpful responses.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </FeatureErrorBoundary>
  );
}