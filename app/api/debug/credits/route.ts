import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Debug endpoint to check current user's credits
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, credits, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ 
        error: 'Profile fetch failed', 
        details: profileError 
      }, { status: 500 });
    }

    // Get all users for debugging
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('id, email, credits, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        profile: profile,
        hasProfile: !!profile,
      },
      allRecentUsers: allUsers || [],
      debug: {
        message: 'Debug info for credits issue',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Debug credits error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint to manually add credits (for debugging)
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

    const body = await request.json();
    const { credits = 3, action = 'add' } = body; // action can be 'add' or 'set'

    // Get current credits
    const { data: currentProfile, error: fetchError } = await (supabase as any)
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (fetchError || !currentProfile) {
      return NextResponse.json({ 
        error: 'Failed to fetch current credits', 
        details: fetchError 
      }, { status: 500 });
    }

    const newCredits = action === 'add' 
      ? (currentProfile.credits || 0) + credits
      : credits;

    // Update user's credits
    const { data: updatedProfile, error: updateError } = await (supabase
      .from('profiles')
      .update as any)({ credits: newCredits })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Credits update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update credits', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'add' 
        ? `Added ${credits} credits. New total: ${newCredits}` 
        : `Credits set to ${newCredits}`,
      profile: updatedProfile,
      previousCredits: currentProfile.credits,
      newCredits: newCredits,
    });

  } catch (error) {
    console.error('Debug credits POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}