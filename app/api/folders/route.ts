import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// GET /api/folders - Get user's decision folders with stats
async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get folders with request counts
    const { data: folders, error: foldersError } = await supabase
      .from('decision_folders')
      .select(`
        id,
        name,
        description,
        color,
        icon,
        sort_order,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (foldersError) {
      throw foldersError;
    }

    // Get request counts for each folder
    const folderStats = await Promise.all(
      (folders || []).map(async (folder) => {
        const { data: requests } = await (supabase as any)
          .from('verdict_requests')
          .select('id, status')
          .eq('folder_id', (folder as any).id);

        const requestCount = requests?.length || 0;
        const completedCount = requests?.filter((r: any) => r.status === 'completed').length || 0;

        return {
          ...(folder as any),
          request_count: requestCount,
          completed_count: completedCount,
          completion_rate: requestCount > 0 ? (completedCount / requestCount) * 100 : 0
        };
      })
    );

    // Get unorganized requests count
    const { data: unorganizedRequests } = await (supabase as any)
      .from('verdict_requests')
      .select('id')
      .eq('user_id', user.id)
      .is('folder_id', null);

    return NextResponse.json({
      folders: folderStats,
      unorganized_count: unorganizedRequests?.length || 0
    });

  } catch (error) {
    log.error('Failed to fetch folders', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a new folder
async function POST_Handler(request: NextRequest) {
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
    const { name, description, color, icon } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Folder name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate color format if provided
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex code (e.g., #6366f1)' },
        { status: 400 }
      );
    }

    // Get current max sort order
    const { data: maxOrderResult } = await (supabase as any)
      .from('decision_folders')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = ((maxOrderResult as any)?.[0]?.sort_order || -1) + 1;

    // Create folder
    const { data: folder, error: createError } = await (supabase as any)
      .from('decision_folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6366f1',
        icon: icon || 'folder',
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A folder with this name already exists' },
          { status: 400 }
        );
      }
      throw createError;
    }

    log.info('Folder created', { userId: user.id, folderId: (folder as any).id, name: (folder as any).name });

    return NextResponse.json({
      folder: {
        ...(folder as any),
        request_count: 0,
        completed_count: 0,
        completion_rate: 0
      }
    });

  } catch (error) {
    log.error('Failed to create folder', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to folder endpoints
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);