import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

interface RouteParams {
  params: {
    folderId: string;
  };
}

// GET /api/folders/[folderId]/requests - Get requests in folder
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check folder ownership
    const { data: folder } = await supabase
      .from('decision_folders')
      .select('id, name, user_id')
      .eq('id', folderId)
      .single() as { data: { id: string; name: string; user_id: string } | null };

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get requests in folder
    const { data: requests, error: requestsError } = await supabase
      .from('verdict_requests')
      .select(`
        id,
        category,
        subcategory,
        media_type,
        text_content,
        context,
        status,
        request_tier,
        created_at,
        updated_at,
        verdict_count:verdicts(count),
        avg_rating:verdicts(rating)
      `)
      .eq('user_id', user.id)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (requestsError) {
      throw requestsError;
    }

    // Process the data to calculate averages
    const processedRequests = (requests || []).map((request: any) => {
      const verdictCount = Array.isArray((request as any).verdict_count) 
        ? (request as any).verdict_count.length 
        : 0;
      
      const ratings = Array.isArray((request as any).avg_rating)
        ? (request as any).avg_rating.map((v: any) => v.rating).filter((r: any) => r !== null)
        : [];
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
        : null;

      return {
        ...request,
        verdict_count: verdictCount,
        avg_rating: avgRating
      };
    });

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('verdict_requests')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('folder_id', folderId);

    return NextResponse.json({
      requests: processedRequests,
      folder: {
        id: folder.id,
        name: folder.name
      },
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (totalCount || 0) > offset + limit
      }
    });

  } catch (error) {
    log.error('Failed to fetch folder requests', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/folders/[folderId]/requests - Move requests to folder
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;
    const body = await request.json();
    const { request_ids } = body;

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return NextResponse.json(
        { error: 'request_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check folder ownership
    const { data: folder } = await (supabase as any)
      .from('decision_folders')
      .select('id, user_id')
      .eq('id', folderId)
      .single();

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify all requests belong to user
    const { data: userRequests } = await supabase
      .from('verdict_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('id', request_ids);

    if (!userRequests || userRequests.length !== request_ids.length) {
      return NextResponse.json(
        { error: 'Some requests do not exist or do not belong to you' },
        { status: 400 }
      );
    }

    // Move requests to folder
    const { error: updateError } = await (supabase as any)
      .from('verdict_requests')
      .update({ folder_id: folderId })
      .eq('user_id', user.id)
      .in('id', request_ids);

    if (updateError) {
      throw updateError;
    }

    log.info('Requests moved to folder', {
      userId: user.id,
      folderId,
      requestIds: request_ids,
      count: request_ids.length
    });

    return NextResponse.json({
      success: true,
      moved_count: request_ids.length
    });

  } catch (error) {
    log.error('Failed to move requests to folder', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}