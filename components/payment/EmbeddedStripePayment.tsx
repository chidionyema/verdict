'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader, AlertCircle, RefreshCw, Shield, CheckCircle } from 'lucide-react';

// Initialize Stripe outside of component to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// User-friendly error messages for common Stripe errors
const ERROR_MESSAGES: Record<string, { title: string; message: string; recoverable: boolean }> = {
  'card_declined': {
    title: 'Card Declined',
    message: 'Your card was declined. Please try a different card or contact your bank.',
    recoverable: true
  },
  'insufficient_funds': {
    title: 'Insufficient Funds',
    message: 'Your card has insufficient funds. Please try a different card.',
    recoverable: true
  },
  'expired_card': {
    title: 'Card Expired',
    message: 'Your card has expired. Please use a different card.',
    recoverable: true
  },
  'incorrect_cvc': {
    title: 'Incorrect Security Code',
    message: 'The security code (CVC) is incorrect. Please check and try again.',
    recoverable: true
  },
  'processing_error': {
    title: 'Processing Error',
    message: 'There was an issue processing your payment. Please try again.',
    recoverable: true
  },
  'rate_limit': {
    title: 'Too Many Attempts',
    message: 'Too many payment attempts. Please wait a moment and try again.',
    recoverable: true
  },
  'network_error': {
    title: 'Connection Issue',
    message: 'We couldn\'t connect to our payment provider. Please check your internet and try again.',
    recoverable: true
  },
  'default': {
    title: 'Payment Failed',
    message: 'We couldn\'t process your payment. Please check your card details and try again, or use a different payment method.',
    recoverable: true
  }
};

interface StripeErrorLike {
  code?: string;
  decline_code?: string;
  message?: string;
}

function getErrorDetails(error: StripeErrorLike | null | undefined): { title: string; message: string; recoverable: boolean } {
  const code = error?.code || error?.decline_code || 'default';

  if (code === 'card_declined' && error?.decline_code) {
    return ERROR_MESSAGES[error.decline_code] || ERROR_MESSAGES['card_declined'];
  }

  if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    return ERROR_MESSAGES['network_error'];
  }

  return ERROR_MESSAGES[code] || ERROR_MESSAGES['default'];
}

interface PaymentFormProps {
  amount: number;
  currency: string;
  description: string;
  onSuccess: (paymentIntent: Record<string, unknown>) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface PaymentError {
  title: string;
  message: string;
  recoverable: boolean;
  retryCount: number;
}

function PaymentForm({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  loading,
  setLoading
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleSubmit = useCallback(async (event?: React.FormEvent, isRetry: boolean = false) => {
    if (event) {
      event.preventDefault();
    }

    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Create payment intent on the server
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 503) {
          throw { code: 'rate_limit', message: errorData.message };
        }
        if (response.status === 402) {
          throw { code: 'card_declined', message: errorData.message };
        }
        throw { code: 'processing_error', message: errorData.error || 'Failed to create payment intent' };
      }

      const { client_secret, demo } = await response.json();

      // Handle demo mode
      if (demo) {
        onSuccess({ id: 'demo_payment', status: 'succeeded' } as Record<string, unknown>);
        return;
      }

      // Confirm payment with card
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: card,
        }
      });

      if (result.error) {
        const errorDetails = getErrorDetails(result.error as StripeErrorLike);
        const newRetryCount = isRetry ? retryCount : retryCount + 1;
        setRetryCount(newRetryCount);

        setPaymentError({
          ...errorDetails,
          retryCount: newRetryCount
        });

        onError(result.error.message || 'Payment failed');
      } else {
        setRetryCount(0);
        setPaymentError(null);
        onSuccess(result.paymentIntent as unknown as Record<string, unknown>);
      }
    } catch (error: unknown) {
      const stripeError = error as StripeErrorLike;
      const errorDetails = getErrorDetails(stripeError);
      const newRetryCount = isRetry ? retryCount : retryCount + 1;
      setRetryCount(newRetryCount);

      setPaymentError({
        ...errorDetails,
        retryCount: newRetryCount
      });

      const errorMessage = stripeError?.message || (error instanceof Error ? error.message : 'Payment failed');
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, amount, currency, description, onSuccess, onError, setLoading, retryCount]);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      handleSubmit(undefined, true);
    }
  }, [handleSubmit, retryCount]);

  const handleClearError = useCallback(() => {
    setPaymentError(null);
    // Clear and reset the card element
    const card = elements?.getElement(CardElement);
    if (card) {
      card.clear();
    }
    setCardComplete(false);
    setCardError(null);
  }, [elements]);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#666ee8',
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#fa755a'
      }
    },
    hidePostalCode: false,
  };

  // Error recovery UI
  if (paymentError && !loading) {
    return (
      <div className="space-y-4">
        {/* Error display */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">{paymentError.title}</h3>
              <p className="text-sm text-red-700">{paymentError.message}</p>
            </div>
          </div>
        </div>

        {/* Recovery actions */}
        <div className="space-y-3">
          {paymentError.recoverable && retryCount < maxRetries && (
            <button
              onClick={handleRetry}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              aria-label="Try payment again"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}

          <button
            onClick={handleClearError}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            aria-label="Use a different card"
          >
            <CreditCard className="h-4 w-4" />
            Try a Different Card
          </button>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {retryCount >= maxRetries
              ? 'Maximum retry attempts reached. Please try a different card or contact support.'
              : 'Having trouble? Contact support for help.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">You&apos;re paying</div>
        <div className="text-2xl font-bold text-gray-900">
          {currency.toUpperCase()} {(amount / 100).toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>

      {/* Card input */}
      <div className="space-y-2">
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700">
          Card information
        </label>
        <div
          className={`border rounded-lg p-3 bg-white transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${
            cardError ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        >
          <CardElement
            id="card-element"
            options={cardElementOptions}
            onChange={(event) => {
              setCardComplete(event.complete);
              setCardError(event.error ? event.error.message : null);
            }}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {cardError}
          </p>
        )}
      </div>

      {/* Security info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || loading || !!cardError}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        aria-label={loading ? 'Processing payment' : `Pay ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`}
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Pay {currency.toUpperCase()} {(amount / 100).toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
}

interface EmbeddedStripePaymentProps {
  amount: number; // Amount in cents
  currency: string;
  description: string;
  onSuccess: (paymentIntent: Record<string, unknown>) => void;
  onError: (error: string) => void;
  className?: string;
  showPricingInfo?: boolean;
}

export function EmbeddedStripePayment({
  amount,
  currency = 'gbp',
  description,
  onSuccess,
  onError,
  className = '',
  showPricingInfo = true
}: EmbeddedStripePaymentProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Secure Payment</h3>
              <p className="text-white/80 text-sm">Complete your purchase instantly</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Pricing clarity section */}
          {showPricingInfo && (
            <div className="mb-6 space-y-3">
              {/* Total breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-medium text-gray-900">{description}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {currency.toUpperCase()} {(amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* No hidden fees notice */}
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>No hidden fees or charges</span>
              </div>
            </div>
          )}

          <Elements stripe={stripePromise}>
            <PaymentForm
              amount={amount}
              currency={currency}
              description={description}
              onSuccess={onSuccess}
              onError={onError}
              loading={loading}
              setLoading={setLoading}
            />
          </Elements>

          {/* Trust indicators */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5 text-green-500" />
                <span>Encrypted</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-xs text-gray-500">Powered by Stripe</span>
            </div>

            {/* Refund policy */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                100% money-back guarantee. Not satisfied?{' '}
                <a href="/help#refunds" className="text-indigo-600 hover:text-indigo-700 underline">
                  Get a refund
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}