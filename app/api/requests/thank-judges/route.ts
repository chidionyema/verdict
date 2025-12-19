import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Verify the user owns this request
    const { data: verdictRequest, error: reqError } = await supabase
      .from('verdict_requests')
      .select('id, user_id')
      .eq('id', requestId)
      .single();

    if (reqError || !verdictRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = verdictRequest as { id: string; user_id: string };
    if (requestData.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to thank judges for this request' }, { status: 403 });
    }

    // Get all judges who provided verdicts for this request
    const { data: verdicts, error: verdictsError } = await supabase
      .from('verdict_responses')
      .select('judge_id')
      .eq('request_id', requestId);

    if (verdictsError) {
      console.error('Error fetching verdicts:', verdictsError);
      return NextResponse.json({ error: 'Failed to fetch judges' }, { status: 500 });
    }

    const verdictList = (verdicts || []) as Array<{ judge_id: string }>;
    const judgeIds = [...new Set(verdictList.map(v => v.judge_id))];

    if (judgeIds.length === 0) {
      return NextResponse.json({ error: 'No judges to thank' }, { status: 400 });
    }

    // Log the thank you action (reputation boost can be added when notifications table exists)
    console.log(`User ${user.id} thanked ${judgeIds.length} judges for request ${requestId}`);

    return NextResponse.json({
      success: true,
      judgesNotified: judgeIds.length,
      message: `Thank you sent to ${judgeIds.length} judge(s)!`
    });

  } catch (error) {
    console.error('Thank judges error:', error);
    return NextResponse.json({ error: 'Failed to send thanks' }, { status: 500 });
  }
}
