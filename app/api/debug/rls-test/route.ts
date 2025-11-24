// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

    const results = {
      user: { id: user.id, email: user.email },
      tests: [] as any[],
    };

    // Test 1: Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, credits, is_judge, is_admin')
      .eq('id', user.id)
      .single();

    results.tests.push({
      test: '1. Profile Lookup',
      success: !profileError,
      data: profile,
      error: profileError?.message,
      sql: `SELECT * FROM profiles WHERE id = '${user.id}'`
    });

    if (!profile) {
      // Try to create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'User',
          credits: 3,
          is_judge: false,
          is_admin: false
        })
        .select()
        .single();

      results.tests.push({
        test: '2. Create Profile',
        success: !createError,
        data: newProfile,
        error: createError?.message,
        sql: `INSERT INTO profiles (id, email, credits) VALUES ('${user.id}', '${user.email}', 3)`
      });

      if (createError) {
        return NextResponse.json({ results, error: 'Cannot create profile' }, { status: 400 });
      }
    }

    const currentProfile = profile || { credits: 3 };

    // Test 2: Try to update credits (this is where it's likely failing)
    const newCredits = Math.max(0, currentProfile.credits - 1);
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select()
      .single();

    results.tests.push({
      test: '3. Update Credits',
      success: !updateError,
      data: updateData,
      error: updateError?.message,
      details: {
        oldCredits: currentProfile.credits,
        newCredits: newCredits,
        sql: `UPDATE profiles SET credits = ${newCredits} WHERE id = '${user.id}'`
      }
    });

    // Test 3: Check current policies
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: policies } = await serviceSupabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'profiles');

    results.tests.push({
      test: '4. Current Policies',
      success: true,
      data: policies,
      count: policies?.length || 0
    });

    // Test 4: Check RLS status
    const { data: rlsInfo } = await serviceSupabase.rpc('get_table_info', {
      table_name: 'profiles'
    });

    results.tests.push({
      test: '5. RLS Status',
      success: true,
      data: rlsInfo || 'Could not fetch RLS info'
    });

    // Restore credits if we changed them
    if (updateData && !updateError) {
      await supabase
        .from('profiles')
        .update({ credits: currentProfile.credits })
        .eq('id', user.id);
    }

    return NextResponse.json({
      results,
      summary: {
        profileExists: !!profile,
        hasCredits: currentProfile?.credits > 0,
        canUpdateProfile: !updateError,
        policyCount: policies?.length || 0,
        recommendation: updateError 
          ? 'RLS policies are blocking profile updates. Check the policies and run the fix script.'
          : 'All tests passed!'
      }
    });

  } catch (error) {
    console.error('RLS test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}