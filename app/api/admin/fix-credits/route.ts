import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess, auditAdminAction } from '@/lib/admin-guard';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminAuth = await verifyAdminAccess(request);
    
    if (!adminAuth.authorized) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const supabase = await createClient();

    // Parse request body for target user
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id || adminAuth.user!.id; // Default to admin's own account

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits, email')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Always set credits to 5 for testing
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ credits: 5 })
      .eq('id', targetUserId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to fix credits' }, { status: 500 });
    }

    // Audit the action
    await auditAdminAction(adminAuth.user!, 'fix_credits', {
      target_user_id: targetUserId,
      target_email: (profile as any).email,
      old_credits: (profile as any).credits,
      new_credits: 5
    });

    return NextResponse.json({ 
      message: 'Credits set to 5',
      target_user: targetUserId,
      old_credits: (profile as any).credits,
      new_credits: 5
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to fix credits' });
}