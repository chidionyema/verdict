import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

// POST /api/folders/reorder - Reorder folders
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
    const { folder_orders } = body;

    if (!Array.isArray(folder_orders) || folder_orders.length === 0) {
      return NextResponse.json(
        { error: 'folder_orders must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate folder_orders structure
    for (const order of folder_orders) {
      if (!order.id || typeof order.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Each folder order must have id and sort_order' },
          { status: 400 }
        );
      }
    }

    // Verify all folders belong to user
    const folderIds = folder_orders.map(f => f.id);
    const { data: userFolders } = await supabase
      .from('decision_folders')
      .select('id')
      .eq('user_id', user.id)
      .in('id', folderIds);

    if (!userFolders || userFolders.length !== folderIds.length) {
      return NextResponse.json(
        { error: 'Some folders do not exist or do not belong to you' },
        { status: 400 }
      );
    }

    // Update sort orders in a transaction-like manner
    const updates = folder_orders.map(async (order: { id: string; sort_order: number }) => {
      const { error } = await (supabase as any)
        .from('decision_folders')
        .update({ sort_order: order.sort_order })
        .eq('id', order.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    });

    await Promise.all(updates);

    log.info('Folders reordered', {
      userId: user.id,
      folderCount: folder_orders.length,
      orders: folder_orders
    });

    return NextResponse.json({
      success: true,
      updated_count: folder_orders.length
    });

  } catch (error) {
    log.error('Failed to reorder folders', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}