'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader } from 'lucide-react';

// Initialize Stripe outside of component to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  amount: number;
  currency: string;
  description: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      return;
    }

    setLoading(true);

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
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm payment with card
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: card,
        }
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else {
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">You're paying</div>
        <div className="text-2xl font-bold text-gray-900">
          {currency.toUpperCase()} {(amount / 100).toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>

      {/* Card input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card information
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              setCardComplete(event.complete);
            }}
          />
        </div>
      </div>

      {/* Security info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || loading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
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
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  className?: string;
}

export function EmbeddedStripePayment({ 
  amount, 
  currency = 'gbp', 
  description, 
  onSuccess, 
  onError,
  className = '' 
}: EmbeddedStripePaymentProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Secure Payment</h3>
            <p className="text-sm text-gray-500">Complete your purchase instantly</p>
          </div>
        </div>

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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>Powered by Stripe</span>
            <span>•</span>
            <span>PCI Compliant</span>
            <span>•</span>
            <span>SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}