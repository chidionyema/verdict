import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { createVerdictRequest } from '@/lib/verdicts';
import { log } from '@/lib/logger';

// POST /api/submit/process-payment - Process submission after successful payment
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const operationId = Math.random().toString(36).substring(2, 15);
  
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { session_id } = body;

    log.info('Processing payment submission', {
      sessionId: session_id,
      operationId,
      timestamp: new Date().toISOString()
    });

    if (!session_id) {
      log.error('Missing session ID in payment processing request', null, {
        operationId,
        body: body,
        severity: 'medium'
      });
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
    
    log.info('Stripe session retrieved', {
      sessionId: session_id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      operationId
    });
    
    if (session.payment_status !== 'paid') {
      log.error('Payment not completed for session', null, {
        sessionId: session_id,
        paymentStatus: session.payment_status,
        operationId,
        severity: 'high'
      });
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      log.error('User ID not found in session metadata', null, {
        sessionId: session_id,
        metadata: session.metadata,
        operationId,
        severity: 'critical'
      });
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Get user details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      log.error('Authorization failed for payment processing', authError, {
        sessionId: session_id,
        requestedUserId: userId,
        actualUserId: user?.id,
        operationId,
        severity: 'high'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract submission data from session metadata
    const submissionQuestion = session.metadata?.submission_question || 'Private submission';
    const submissionCategory = (session.metadata?.submission_category as 'appearance' | 'profile' | 'writing' | 'decision') || 'decision';

    log.info('Creating verdict request for paid submission', {
      sessionId: session_id,
      userId: user.id,
      category: submissionCategory,
      questionLength: submissionQuestion.length,
      operationId
    });

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

    const processingTime = Date.now() - startTime;
    log.info('Payment processing completed successfully', {
      sessionId: session_id,
      userId: user.id,
      requestId: createdRequest.id,
      processingTimeMs: processingTime,
      operationId
    });

    return NextResponse.json({ 
      success: true,
      request_id: createdRequest.id,
      message: 'Submission created successfully'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log.error('Payment processing failed', error, {
      operationId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      actionRequired: 'Investigate payment processing failure'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process submission',
        support_id: operationId // Provide support ID for user to reference
      },
      { status: 500 }
    );
  }
}