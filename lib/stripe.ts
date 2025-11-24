import Stripe from 'stripe';

// Check if we're in demo mode
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

// Check if Stripe is properly configured
function isStripeConfigured(): boolean {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  return !!(stripeKey && stripeKey.startsWith('sk_') && stripeKey !== 'sk_test_placeholder');
}

// Only initialize Stripe if properly configured and not in demo mode
export const stripe = (() => {
  if (isDemoMode() || !isStripeConfigured()) {
    // Return null for demo mode or when Stripe is not configured
    return null;
  }
  
  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
})();
