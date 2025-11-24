// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test each step of the request creation process
    const results = {
      user: { id: user.id, email: user.email },
      steps: [] as any[],
    };

    // Step 1: Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', user.id)
      .single();

    results.steps.push({
      step: 'Get Profile',
      success: !profileError,
      data: profile,
      error: profileError,
    });

    if (!profile) {
      return NextResponse.json({ results, error: 'No profile found' }, { status: 400 });
    }

    // Step 2: Try to update credits (this is where it's failing)
    const newCredits = profile.credits - 1;
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select()
      .single();

    results.steps.push({
      step: 'Update Credits',
      success: !updateError,
      data: updateData,
      error: updateError,
      details: {
        oldCredits: profile.credits,
        newCredits: newCredits,
        query: `UPDATE profiles SET credits = ${newCredits} WHERE id = '${user.id}'`,
      },
    });

    // Step 3: Test insert into verdict_requests
    const testRequest = {
      user_id: user.id,
      category: 'test',
      media_type: 'text',
      text_content: 'Test request',
      context: 'Testing request creation',
      status: 'open',
        target_verdict_count: 3, // Reduced to 3 for 40%+ profit margin (standard tier)
      received_verdict_count: 0,
    };

    const { data: requestData, error: requestError } = await supabase
      .from('verdict_requests')
      .insert(testRequest)
      .select()
      .single();

    results.steps.push({
      step: 'Create Request',
      success: !requestError,
      data: requestData,
      error: requestError,
    });

    // Cleanup: Delete test request if created
    if (requestData) {
      await supabase
        .from('verdict_requests')
        .delete()
        .eq('id', requestData.id);
      
      // Restore credits
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id);
    }

    return NextResponse.json({
      results,
      summary: {
        profileFound: !!profile,
        hasCredits: profile?.credits > 0,
        canUpdateProfile: !updateError,
        canCreateRequest: !requestError,
      },
      recommendation: updateError 
        ? 'Profile update failed - likely RLS policy issue. Run the migration to fix.'
        : 'All steps passed successfully!',
    });

  } catch (error) {
    console.error('Debug test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}