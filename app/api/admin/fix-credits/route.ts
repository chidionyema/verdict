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

    // EMERGENCY FIX: Use safe credit operations instead of direct database manipulation
    // Import the safe credit functions
    const { safeRefundCredits, safeDeductCredits } = require('@/lib/credit-guard');
    
    const currentCredits = (profile as any).credits || 0;
    const targetCredits = body.credits || 5; // Allow custom credit amount from request body
    
    let result;
    if (targetCredits > currentCredits) {
      // Need to add credits - use refund function
      const creditsToAdd = targetCredits - currentCredits;
      result = await safeRefundCredits(targetUserId, creditsToAdd, `Admin credit adjustment by ${adminAuth.user!.id}`);
    } else if (targetCredits < currentCredits) {
      // Need to deduct credits
      const creditsToRemove = currentCredits - targetCredits;
      const requestId = `admin_fix_${Date.now()}_${adminAuth.user!.id}`;
      result = await safeDeductCredits(targetUserId, creditsToRemove, requestId);
    } else {
      // Credits already at target amount
      result = { success: true, newBalance: currentCredits, message: 'Credits already at target amount' };
    }
    
    if (!result.success) {
      return NextResponse.json({ error: `Failed to adjust credits: ${result.message}` }, { status: 500 });
    }

    // Audit the action
    await auditAdminAction(adminAuth.user!, 'fix_credits', {
      target_user_id: targetUserId,
      target_email: (profile as any).email,
      old_credits: currentCredits,
      new_credits: result.newBalance
    });

    return NextResponse.json({ 
      message: `Credits adjusted successfully`,
      target_user: targetUserId,
      old_credits: currentCredits,
      new_credits: result.newBalance
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to fix credits' });
}