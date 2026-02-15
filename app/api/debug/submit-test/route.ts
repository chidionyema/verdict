import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * DEBUG ENDPOINT - Test each step of request submission
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: {},
  };

  try {
    // Step 1: Check environment variables
    results.steps.env = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serviceKeyIsPlaceholder: process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key',
      serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'MISSING',
    };

    // Step 2: Test regular client auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    results.steps.auth = {
      success: !authError,
      hasUser: !!authData?.user,
      userId: authData?.user?.id?.substring(0, 8) || null,
      error: authError?.message || null,
    };

    if (!authData?.user) {
      results.steps.auth.note = 'User not logged in - cannot test further';
      return NextResponse.json(results);
    }

    const userId = authData.user.id;

    // Step 3: Test service client
    let serviceClient;
    try {
      serviceClient = createServiceClient();
      results.steps.serviceClient = { created: true };
    } catch (e: any) {
      results.steps.serviceClient = { created: false, error: e.message };
      return NextResponse.json(results);
    }

    // Step 4: Test profile read with service client
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, credits, is_judge')
      .eq('id', userId)
      .single();

    results.steps.profileRead = {
      success: !profileError,
      hasProfile: !!profile,
      credits: profile?.credits ?? 'N/A',
      error: profileError?.message || null,
      errorCode: profileError?.code || null,
      errorHint: profileError?.hint || null,
    };

    // Step 5: Test pricing_tiers table
    const { data: tiers, error: tiersError } = await serviceClient
      .from('pricing_tiers')
      .select('tier, credits_required, verdict_count, active')
      .eq('active', true);

    results.steps.pricingTiers = {
      success: !tiersError,
      tiersFound: tiers?.length || 0,
      tiers: tiers?.map(t => ({ tier: t.tier, credits: t.credits_required })) || [],
      error: tiersError?.message || null,
      errorCode: tiersError?.code || null,
    };

    // Step 6: Test verdict_requests table structure
    const { data: testInsert, error: insertError } = await serviceClient
      .from('verdict_requests')
      .select('id')
      .limit(1);

    results.steps.verdictRequestsTable = {
      tableExists: !insertError || insertError.code !== '42P01',
      canQuery: !insertError,
      error: insertError?.message || null,
      errorCode: insertError?.code || null,
    };

    // Step 7: Test credit deduction (DRY RUN - don't actually deduct)
    if (profile && profile.credits >= 1) {
      results.steps.creditDeductionTest = {
        currentCredits: profile.credits,
        wouldSucceed: profile.credits >= 1,
        note: 'Dry run only - no credits deducted',
      };
    } else {
      results.steps.creditDeductionTest = {
        currentCredits: profile?.credits ?? 0,
        wouldSucceed: false,
        reason: 'Insufficient credits',
      };
    }

    // Summary
    const allPassed =
      results.steps.env.hasServiceKey &&
      !results.steps.env.serviceKeyIsPlaceholder &&
      results.steps.auth.success &&
      results.steps.profileRead.success &&
      results.steps.verdictRequestsTable.canQuery;

    results.summary = {
      allChecksPassed: allPassed,
      likelyIssue: !results.steps.env.hasServiceKey || results.steps.env.serviceKeyIsPlaceholder
        ? 'SUPABASE_SERVICE_ROLE_KEY is missing or placeholder'
        : !results.steps.profileRead.success
        ? 'Cannot read profile - RLS or connection issue'
        : !results.steps.verdictRequestsTable.canQuery
        ? 'verdict_requests table issue'
        : results.steps.creditDeductionTest?.wouldSucceed === false
        ? 'User has 0 credits'
        : 'Unknown - check individual steps',
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    results.fatalError = {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    };
    return NextResponse.json(results, { status: 500 });
  }
}
