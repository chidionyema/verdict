import { NextRequest, NextResponse } from 'next/server';
import { getPricingConfig } from '@/lib/pricing-config';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

/**
 * API endpoint for fetching current pricing
 * GET /api/pricing
 * 
 * This could be extended to:
 * - Fetch prices from a database
 * - Implement A/B testing logic
 * - Apply user-specific pricing
 * - Handle promotional codes
 */
async function GET_Handler(request: NextRequest) {
  try {
    // Get user's preferred currency from headers or query params
    const currency = request.headers.get('X-Currency') || 
                    request.nextUrl.searchParams.get('currency') || 
                    'gbp';
    
    // Get pricing configuration
    const pricing = getPricingConfig();
    
    // In the future, this could:
    // - Check user's A/B test group
    // - Apply promotional discounts
    // - Fetch from database instead of env vars
    
    return NextResponse.json({
      success: true,
      pricing: pricing.private_submission,
      currency: currency.toLowerCase(),
      // Include experiment data for analytics
      experiment: {
        group: 'control',
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pricing',
        // Return defaults as fallback
        pricing: {
          gbp: { amount: 3.00, currency: 'GBP', formatted: '£3' },
          usd: { amount: 3.99, currency: 'USD', formatted: '$3.99' },
          eur: { amount: 3.50, currency: 'EUR', formatted: '€3.50' }
        }
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to pricing endpoint
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);