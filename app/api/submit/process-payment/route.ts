import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { createVerdictRequest } from '@/lib/verdicts';
import { log } from '@/lib/logger';

// POST /api/submit/process-payment - Process submission after successful payment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // In demo mode, just return success
    if (isDemoMode() || !stripe) {
      return NextResponse.json({ 
        success: true, 
        demo: true,
        message: 'Demo mode - submission would be processed'
      });
    }

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Get user details
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract submission data from session metadata
    const submissionQuestion = session.metadata?.submission_question || 'Private submission';
    const submissionCategory = (session.metadata?.submission_category as 'appearance' | 'profile' | 'writing' | 'decision') || 'decision';

    // Create the verdict request
    const { request: createdRequest } = await createVerdictRequest(
      supabase as any,
      {
        userId: user.id,
        email: user.email || null,
        category: submissionCategory,
        subcategory: null,
        media_type: 'text', // Default for now
        media_url: null,
        text_content: submissionQuestion,
        context: submissionQuestion,
        requestedTone: 'honest',
        roastMode: false,
        visibility: 'private',
        creditsToCharge: 0, // No credits charged for paid submissions
        targetVerdictCount: 3,
      }
    );

    return NextResponse.json({ 
      success: true,
      request_id: createdRequest.id,
      message: 'Submission created successfully'
    });

  } catch (error) {
    log.error('Payment processing failed', error);
    
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}