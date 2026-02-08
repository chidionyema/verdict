import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';
import { uploadRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { log } from '@/lib/logger';
import { ExpertRoutingService } from '@/lib/expert-routing';
import { safeDeductCredits, safeRefundCredits } from '@/lib/credit-guard';

interface ComparisonOption {
  title: string;
  description: string;
  image?: {
    name: string;
    type: string;
    size: number;
    data: string; // base64 encoded
  };
}

interface DecisionContext {
  timeframe: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  budget?: string;
  goals: string[];
}

interface CreateComparisonRequest {
  question: string;
  category: string;
  optionA: ComparisonOption;
  optionB: ComparisonOption;
  context: DecisionContext;
  requestTier: 'community' | 'standard' | 'pro';
  visibility?: 'public' | 'private';
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for comparison requests
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
      question,
      category,
      optionA,
      optionB,
      context,
      requestTier = 'standard',
      visibility = 'private',
    }: CreateComparisonRequest = await request.json();

    // Validate input
    if (!question || !category || !optionA || !optionB || !context) {
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

    if (!optionA.title || !optionA.description || !optionB.title || !optionB.description) {
      return NextResponse.json(
        { error: 'Both options must have titles and descriptions' },
        { status: 400 }
      );
    }

    if (!context.timeframe || !context.goals?.some(g => g.trim())) {
      return NextResponse.json(
        { error: 'Context must include timeframe and at least one goal' },
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

    // Get pricing tier configuration
    const { data: pricingTier } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('tier', requestTier)
      .eq('active', true)
      .single();
    
    if (!pricingTier) {
      return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 });
    }

    const creditsRequired = (pricingTier as any).credits_required;
    const verdictCount = (pricingTier as any).verdict_count;

    // Generate comparison ID early for credit deduction tracking
    const comparisonId = crypto.randomUUID();

    // ATOMIC CREDIT DEDUCTION FIRST (prevents race conditions and double-spending)
    const creditResult = await safeDeductCredits(user.id, creditsRequired, comparisonId);

    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.message || `Insufficient credits. You need ${creditsRequired} credits for this tier.` },
        { status: creditResult.message.includes('Insufficient') ? 402 : 400 }
      );
    }

    log.info('Credits deducted atomically', {
      userId: user.id,
      comparisonId,
      credits: creditsRequired,
      newBalance: creditResult.newBalance
    });

    // Handle image uploads if present
    const serviceSupabase = supabaseServiceClient();
    let imageUrls: { optionA?: string; optionB?: string } = {};

    const uploadImage = async (option: ComparisonOption, optionKey: 'A' | 'B') => {
      if (!option.image) return null;

      // Validate image
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(option.image.type)) {
        throw new Error(`Invalid file type for option ${optionKey}. Only JPEG, PNG, and WebP are allowed.`);
      }

      if (option.image.size > maxSize) {
        throw new Error(`File size for option ${optionKey} must be less than 10MB`);
      }

      const imagePath = `comparisons/${comparisonId}/option-${optionKey.toLowerCase()}-${Date.now()}.${option.image.type.split('/')[1]}`;
      const imageBuffer = Buffer.from(option.image.data.split(',')[1], 'base64');

      const { data: upload, error: uploadError } = await serviceSupabase.storage
        .from('comparison-images')
        .upload(imagePath, imageBuffer, {
          contentType: option.image.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image for option ${optionKey}`);
      }

      const { data: urlData } = serviceSupabase.storage
        .from('comparison-images')
        .getPublicUrl(imagePath);

      return urlData.publicUrl;
    };

    try {
      // Upload images concurrently if they exist
      const [urlA, urlB] = await Promise.all([
        uploadImage(optionA, 'A'),
        uploadImage(optionB, 'B')
      ]);

      if (urlA) imageUrls.optionA = urlA;
      if (urlB) imageUrls.optionB = urlB;

    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Create comparison request in database
    let comparisonRequest, dbError;
    try {
      const { data, error } = await (supabase as any)
        .from('comparison_requests')
        .insert({
          id: comparisonId,
          user_id: user.id,
          question: question.trim(),
          category,
          option_a_title: optionA.title,
          option_a_description: optionA.description,
          option_a_image_url: imageUrls.optionA || null,
          option_b_title: optionB.title,
          option_b_description: optionB.description,
          option_b_image_url: imageUrls.optionB || null,
          decision_context: {
            timeframe: context.timeframe,
            importance: context.importance,
            budget: context.budget || null,
            goals: context.goals.filter(g => g.trim())
          },
          request_tier: requestTier as 'community' | 'standard' | 'pro',
          visibility: visibility as 'public' | 'private',
          target_verdict_count: verdictCount,
          status: 'open' as const,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      comparisonRequest = data;
      dbError = error;
    } catch (error) {
      dbError = error;
    }

    if (dbError) {
      // CRITICAL: Refund credits since request creation failed
      log.error('Error creating comparison request, initiating refund:', dbError);

      const refundResult = await safeRefundCredits(
        user.id,
        creditsRequired,
        `Comparison request ${comparisonId} creation failed: ${dbError}`
      );

      if (!refundResult.success) {
        log.error('CRITICAL: Credit refund failed after comparison creation error', {
          userId: user.id,
          comparisonId,
          credits: creditsRequired,
          refundError: refundResult.message
        });
      }

      // Clean up uploaded images
      const cleanupTasks = [];
      if (imageUrls.optionA) {
        const pathA = imageUrls.optionA.split('/').slice(-2).join('/');
        cleanupTasks.push(serviceSupabase.storage.from('comparison-images').remove([pathA]));
      }
      if (imageUrls.optionB) {
        const pathB = imageUrls.optionB.split('/').slice(-2).join('/');
        cleanupTasks.push(serviceSupabase.storage.from('comparison-images').remove([pathB]));
      }
      await Promise.all(cleanupTasks);

      return NextResponse.json(
        { error: 'Failed to create comparison request' },
        { status: 500 }
      );
    }

    // Log the creation for analytics
    try {
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action: 'comparison_created',
          metadata: {
            comparison_id: comparisonId,
            category,
            request_tier: requestTier,
            target_verdicts: verdictCount,
            visibility,
            has_images: !!(imageUrls.optionA || imageUrls.optionB)
          },
        } as any);
    } catch (error) {
      log.info('user_actions table not found, skipping log');
    }

    // Calculate estimated completion time based on tier
    const minutesPerVerdict = requestTier === 'pro' ? 15 : requestTier === 'standard' ? 30 : 45;
    const estimatedCompletion = new Date(Date.now() + (verdictCount * minutesPerVerdict * 60 * 1000));

    // Trigger expert routing for Pro and Standard tiers (async, don't block response)
    if (requestTier === 'pro' || requestTier === 'standard') {
      const expertRouting = new ExpertRoutingService(supabase as any);
      
      // Route asynchronously using the comparison ID as if it's a verdict request
      // Note: This is a simplified approach - in production you might want separate routing for comparisons
      expertRouting.routeRequest(comparisonId).catch(error => {
        log.error('Comparison expert routing failed (non-blocking)', { 
          comparisonId, 
          tier: requestTier, 
          error 
        });
      });

      log.info('Comparison expert routing initiated', { 
        comparisonId, 
        tier: requestTier 
      });
    }

    return NextResponse.json({
      success: true,
      comparisonId: comparisonId,
      targetVerdicts: verdictCount,
      requestTier,
      estimatedCompletion: estimatedCompletion.toISOString(),
      imageUrls,
    });

  } catch (error) {
    log.error('Error creating comparison request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}