import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';
import { uploadRateLimiter, checkRateLimit } from '@/lib/rate-limiter';

interface CreateSplitTestRequest {
  category: string;
  question: string;
  context?: string;
  photoAFile: {
    name: string;
    type: string;
    size: number;
    data: string; // base64 encoded
  };
  photoBFile: {
    name: string;
    type: string;
    size: number;
    data: string; // base64 encoded
  };
  visibility?: 'public' | 'private';
  targetVerdicts?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for file upload endpoints
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitCheck = await checkRateLimit(uploadRateLimiter, clientIP);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.error,
          retryAfter: rateLimitCheck.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter || 60)
          }
        }
      );
    }

    const {
      category,
      question,
      context,
      photoAFile,
      photoBFile,
      visibility = 'public',
      targetVerdicts = 3,
    }: CreateSplitTestRequest = await request.json();

    // Validate input
    if (!category || !question || !photoAFile || !photoBFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (question.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (targetVerdicts < 1 || targetVerdicts > 10) {
      return NextResponse.json(
        { error: 'Target verdict count must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Validate image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(photoAFile.type) || !allowedTypes.includes(photoBFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    if (photoAFile.size > maxSize || photoBFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user credits (split tests cost 1 credit)
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single() as { data: any; error: any };

    if (!profile || (profile as any)?.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. You need 1 credit to create a split test.' },
        { status: 402 }
      );
    }

    // Upload photos to Supabase Storage
    const serviceSupabase = supabaseServiceClient();
    const splitTestId = crypto.randomUUID();
    
    // Generate unique file paths
    const photoAPath = `split-tests/${splitTestId}/photo-a-${Date.now()}.${photoAFile.type.split('/')[1]}`;
    const photoBPath = `split-tests/${splitTestId}/photo-b-${Date.now()}.${photoBFile.type.split('/')[1]}`;

    // Convert base64 to buffer
    const photoABuffer = Buffer.from(photoAFile.data.split(',')[1], 'base64');
    const photoBBuffer = Buffer.from(photoBFile.data.split(',')[1], 'base64');

    // Upload photo A
    const { data: photoAUpload, error: photoAError } = await serviceSupabase.storage
      .from('split-test-photos')
      .upload(photoAPath, photoABuffer, {
        contentType: photoAFile.type,
        upsert: false,
      });

    if (photoAError) {
      console.error('Error uploading photo A:', photoAError);
      return NextResponse.json(
        { error: 'Failed to upload photo A' },
        { status: 500 }
      );
    }

    // Upload photo B
    const { data: photoBUpload, error: photoBError } = await serviceSupabase.storage
      .from('split-test-photos')
      .upload(photoBPath, photoBBuffer, {
        contentType: photoBFile.type,
        upsert: false,
      });

    if (photoBError) {
      // Clean up photo A if photo B fails
      await serviceSupabase.storage
        .from('split-test-photos')
        .remove([photoAPath]);
      
      console.error('Error uploading photo B:', photoBError);
      return NextResponse.json(
        { error: 'Failed to upload photo B' },
        { status: 500 }
      );
    }

    // Get public URLs
    const { data: photoAUrl } = serviceSupabase.storage
      .from('split-test-photos')
      .getPublicUrl(photoAPath);

    const { data: photoBUrl } = serviceSupabase.storage
      .from('split-test-photos')
      .getPublicUrl(photoBPath);

    // Create split test in database
    let splitTest, dbError;
    try {
      const result = await (supabase as any).rpc('create_split_test', {
        p_user_id: user.id,
        p_category: category,
        p_question: question.trim(),
        p_context: context?.trim() || null,
        p_photo_a_url: photoAUrl.publicUrl,
        p_photo_a_filename: photoAFile.name,
        p_photo_b_url: photoBUrl.publicUrl,
        p_photo_b_filename: photoBFile.name,
        p_visibility: visibility,
        p_target_verdicts: targetVerdicts,
      });
      splitTest = result.data;
      dbError = result.error;
    } catch (error) {
      dbError = error;
    }

    if (dbError) {
      // Clean up uploaded photos if database operation fails
      await Promise.all([
        serviceSupabase.storage.from('split-test-photos').remove([photoAPath]),
        serviceSupabase.storage.from('split-test-photos').remove([photoBPath]),
      ]);

      console.error('Error creating split test:', dbError);
      return NextResponse.json(
        { error: 'Failed to create split test' },
        { status: 500 }
      );
    }

    // Deduct credit from user using unified credit system
    const { data: deductResult, error: creditError } = await (supabase as any).rpc('deduct_credits', {
      p_user_id: user.id,
      p_credits: 1
    });

    if (creditError) {
      // Clean up on credit deduction failure
      await Promise.all([
        serviceSupabase.storage.from('split-test-photos').remove([photoAPath]),
        serviceSupabase.storage.from('split-test-photos').remove([photoBPath]),
        supabase.from('split_test_requests').delete().eq('id', splitTest),
      ]);

      console.error('Error deducting credits:', creditError);
      return NextResponse.json(
        { error: `Failed to deduct credits: ${creditError.message}` },
        { status: 500 }
      );
    }

    // Check if deduction was successful
    const result = deductResult?.[0];
    if (!result || !result.success) {
      // Clean up on insufficient credits
      await Promise.all([
        serviceSupabase.storage.from('split-test-photos').remove([photoAPath]),
        serviceSupabase.storage.from('split-test-photos').remove([photoBPath]),
        supabase.from('split_test_requests').delete().eq('id', splitTest),
      ]);

      return NextResponse.json(
        { error: result?.message || 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Log the creation for analytics (skip if table doesn't exist)
    try {
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action: 'split_test_created',
          metadata: {
            split_test_id: splitTest,
            category,
            target_verdicts: targetVerdicts,
            visibility,
          },
        } as any);
    } catch (error) {
      console.log('user_actions table not found, skipping log');
    }

    return NextResponse.json({
      success: true,
      splitTestId: splitTest,
      photoAUrl: photoAUrl.publicUrl,
      photoBUrl: photoBUrl.publicUrl,
      targetVerdicts,
      estimatedCompletion: new Date(Date.now() + (targetVerdicts * 20 * 60 * 1000)).toISOString(), // 20 min per verdict
    });

  } catch (error) {
    console.error('Error creating split test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}