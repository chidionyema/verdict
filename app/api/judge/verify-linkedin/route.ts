import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

const verificationSchema = z.object({
  userId: z.string().uuid(),
  linkedinUrl: z.string().url().refine(
    (url) => url.includes('linkedin.com'),
    'Must be a valid LinkedIn URL'
  ),
});

async function POST_Handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, linkedinUrl } = verificationSchema.parse(body);

    const supabase = await createClient();

    // Verify the user is authenticated and matches the userId
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a judge
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_judge')
      .eq('id', userId)
      .single() as { 
        data: Pick<Database['public']['Tables']['profiles']['Row'], 'is_judge'> | null; 
        error: any 
      };

    if (profileError || !profile || !profile.is_judge) {
      return NextResponse.json(
        { error: 'User must be a judge to verify' },
        { status: 400 }
      );
    }

    try {
      // Check if already verified or has pending verification
      const { data: existingVerification, error: verificationError } = await supabase
        .from('judge_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!verificationError && existingVerification) {
        if ((existingVerification as any).status === 'approved') {
          return NextResponse.json(
            { error: 'Already verified' },
            { status: 400 }
          );
        }
        if ((existingVerification as any).status === 'pending') {
          return NextResponse.json(
            { error: 'Verification already submitted' },
            { status: 400 }
          );
        }
      }

      // Create or update verification request
      const { error: insertError } = await supabase
        .from('judge_verifications')
        .upsert({
          user_id: userId,
          linkedin_url: linkedinUrl,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          verification_type: 'linkedin',
        } as any);

      if (insertError) {
        console.error('Error inserting verification:', insertError);
        return NextResponse.json(
          { error: 'Failed to submit verification' },
          { status: 500 }
        );
      }

      // Create admin notification
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'linkedin_verification',
          title: 'New LinkedIn Verification Request',
          message: `User ${userId} submitted LinkedIn profile for verification: ${linkedinUrl}`,
          data: {
            userId,
            linkedinUrl,
            submittedAt: new Date().toISOString(),
          },
          priority: 'medium',
        } as any);

      if (notificationError) {
        console.error('Error creating admin notification:', notificationError);
        // Don't fail the request if notification fails
      }

      return NextResponse.json(
        { 
          success: true,
          message: 'Verification request submitted successfully',
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error - tables may not exist yet:', dbError);
      
      // Return helpful error about missing tables
      return NextResponse.json(
        { 
          error: 'Database tables not yet created',
          message: 'Please run the database migration first: database/migrations/001_add_judge_verification_tables.sql',
          success: false
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error in LinkedIn verification:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting to verification endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);