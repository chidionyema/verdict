import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

interface RouteParams {
  params: {
    folderId: string;
  };
}

// PUT /api/folders/[folderId] - Update folder
async function PUT_Handler(request: NextRequest, { params }: RouteParams) {
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

    // Validate UUID format
    if (!isValidUUID(folderId)) {
      return NextResponse.json({ error: 'Invalid folder ID format' }, { status: 400 });
    }
    const body = await request.json();
    const { name, description, color, icon, sort_order } = body;

    // Validate input
    if (name !== undefined) {
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
    }

    if (description !== undefined && typeof description === 'string' && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex code (e.g., #6366f1)' },
        { status: 400 }
      );
    }

    // Check folder ownership
    const { data: existingFolder } = await supabase
      .from('decision_folders')
      .select('id, user_id')
      .eq('id', folderId)
      .single() as { data: { id: string; user_id: string } | null };

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (existingFolder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update folder
    const { data: folder, error: updateError } = await (supabase as any)
      .from('decision_folders')
      .update(updateData)
      .eq('id', folderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A folder with this name already exists' },
          { status: 400 }
        );
      }
      throw updateError;
    }

    // Get request count
    const { data: requests } = await (supabase as any)
      .from('verdict_requests')
      .select('id, status')
      .eq('folder_id', folderId);

    const requestCount = requests?.length || 0;
    const completedCount = requests?.filter((r: any) => r.status === 'completed').length || 0;

    log.info('Folder updated', { userId: user.id, folderId, changes: Object.keys(updateData) });

    return NextResponse.json({
      folder: {
        ...(folder as any),
        request_count: requestCount,
        completed_count: completedCount,
        completion_rate: requestCount > 0 ? (completedCount / requestCount) * 100 : 0
      }
    });

  } catch (error) {
    log.error('Failed to update folder', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[folderId] - Delete folder
async function DELETE_Handler(request: NextRequest, { params }: RouteParams) {
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

    // Validate UUID format
    if (!isValidUUID(folderId)) {
      return NextResponse.json({ error: 'Invalid folder ID format' }, { status: 400 });
    }

    // Check folder ownership
    const { data: existingFolder } = await (supabase as any)
      .from('decision_folders')
      .select('id, user_id, name')
      .eq('id', folderId)
      .single();

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (existingFolder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if folder has requests
    const { data: requests } = await (supabase as any)
      .from('verdict_requests')
      .select('id')
      .eq('folder_id', folderId)
      .limit(1);

    if (requests && requests.length > 0) {
      // Move requests to null (unorganized) before deleting folder
      await (supabase as any)
        .from('verdict_requests')
        .update({ folder_id: null })
        .eq('folder_id', folderId);
    }

    // Delete folder
    const { error: deleteError } = await (supabase as any)
      .from('decision_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    log.info('Folder deleted', { 
      userId: user.id, 
      folderId, 
      folderName: existingFolder.name,
      requestsMovedToUnorganized: requests?.length || 0
    });

    return NextResponse.json({ 
      success: true, 
      requests_moved: requests?.length || 0
    });

  } catch (error) {
    log.error('Failed to delete folder', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to folder endpoints
export const PUT = withRateLimit(PUT_Handler, rateLimitPresets.default);
export const DELETE = withRateLimit(DELETE_Handler, rateLimitPresets.default);