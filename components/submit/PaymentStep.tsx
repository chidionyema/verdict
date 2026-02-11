'use client';

import { CheckCircle } from 'lucide-react';
import { EmbeddedStripePayment } from '@/components/payment/EmbeddedStripePayment';
import { toast } from '@/components/ui/toast';
import type { SubmissionData } from './types';

interface PaymentStepProps {
  privatePrice: string;
  submissionData: SubmissionData;
  onPaymentSuccess: (paymentData: any) => void;
}

export function PaymentStep({ privatePrice, submissionData, onPaymentSuccess }: PaymentStepProps) {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
      <p className="text-gray-600 mb-8">
        Pay {privatePrice} for private, instant feedback on your submission.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-2">Your Submission</h3>
        <p className="text-gray-700 mb-2">{submissionData.question}</p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Category:</span> {submissionData.category || 'General'}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Private feedback (3 reports)</span>
            <span className="font-bold">{privatePrice}</span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Completely confidential</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Results in under 1 hour</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No reviewing required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">100% Satisfaction Guarantee</h4>
            <p className="text-sm text-green-700 mt-1">
              Get 3 quality feedback reports within 24 hours or receive a{' '}
              <strong>full refund</strong>. Most requests complete in under 2 hours.
            </p>
          </div>
        </div>
      </div>

      <EmbeddedStripePayment
        amount={Math.round(parseFloat(privatePrice.replace(/[£$]/g, '')) * 100)}
        currency="gbp"
        description={`Private feedback: ${submissionData.question?.substring(0, 50)}...`}
        onSuccess={onPaymentSuccess}
        onError={(error: string) => toast.error(`Payment failed: ${error}`)}
        className="mt-6"
      />
    </div>
  );
}
