import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Simple endpoint to fix credits
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'You need to be logged in first',
        solution: 'Please sign up or log in, then visit this page again'
      }, { status: 401 });
    }

    // Create a service client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user has a profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist (using service role to bypass RLS)
      const { data: newProfile, error: createError } = await serviceSupabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          credits: 3,
          display_name: user.email?.split('@')[0] || 'User',
          is_judge: false,
          is_admin: false,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create profile',
          details: createError,
          suggestion: 'Run the SQL migration: 017_fix_profile_creation_policy.sql'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '✅ Profile created with 3 free credits!',
        profile: newProfile,
        action: 'created_profile',
        note: 'Used service role to bypass RLS'
      });
    }

    // Profile exists, update credits if they're 0
    if (profile.credits < 3) {
      const { data: updatedProfile, error: updateError } = await serviceSupabase
        .from('profiles')
        .update({ credits: 3 })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ 
          error: 'Failed to update credits',
          details: updateError 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `✅ Credits updated from ${profile.credits} to 3!`,
        profile: updatedProfile,
        action: 'updated_credits',
        note: 'Used service role to bypass RLS'
      });
    }

    // User already has credits
    return NextResponse.json({
      success: true,
      message: `✅ You already have ${profile.credits} credits!`,
      profile: profile,
      action: 'no_change_needed'
    });

  } catch (error) {
    console.error('Fix credits error:', error);
    return NextResponse.json({ 
      error: 'Something went wrong',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try running the SQL migration in your Supabase dashboard'
    }, { status: 500 });
  }
}