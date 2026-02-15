import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, VerdictRequest, VerdictResponse } from './database.types';
import { createClient } from '@/lib/supabase/client';
import { createServiceClient } from '@/lib/supabase/server';
import { getProfile, deductCredits, addCredits } from '@/lib/profile';
import { log } from '@/lib/logger';

type DbClient = SupabaseClient<Database>;

export interface CreateRequestInput {
  userId: string;
  email: string | null;
  category: VerdictRequest['category'];
  subcategory?: string | null;
  media_type: VerdictRequest['media_type'];
  media_url?: string | null;
  text_content?: string | null;
  context: string;
  /**
   * Optional tone preference for feedback: 'encouraging', 'honest', or 'brutally_honest'
   * Defaults to 'honest' if not specified
   */
  requestedTone?: 'encouraging' | 'honest' | 'brutally_honest';
  /**
   * Whether this is roast mode (brutal feedback) or help mode (constructive)
   * Defaults to false (help mode)
   */
  roastMode?: boolean;
  /**
   * Whether the submission is public (appears in feed) or private
   * Defaults to 'private'
   */
  visibility?: 'public' | 'private';
  /**
   * Optional override for how many verdicts this request should target.
   * Defaults to 3 to match current pricing.
   */
  targetVerdictCount?: number;
  /**
   * Optional override for how many credits to charge for this request.
   * Defaults to 1 to match current pricing.
   */
  creditsToCharge?: number;
  /**
   * The pricing tier for this request: 'community', 'standard', 'pro', or 'enterprise'
   * Defaults to 'community'
   */
  requestTier?: string;
}

export interface CreateRequestResult {
  request: VerdictRequest;
}

/**
 * Core domain logic for creating a verdict request:
 * - Ensures a profile row exists (with starter credits on first request)
 * - Deducts the configured number of credits (default 1)
 * - Creates the verdict request row with the configured target verdict count (default 3)
 *
 * HTTP/validation concerns stay in the route; this function focuses on data + rules.
 */
export async function createVerdictRequest(
  supabase: DbClient,
  input: CreateRequestInput
): Promise<CreateRequestResult> {
  const traceId = `vr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  const {
    userId,
    email,
    category,
    subcategory,
    media_type,
    media_url,
    text_content,
    context,
    requestedTone,
    roastMode,
    visibility,
    targetVerdictCount,
    creditsToCharge,
    requestTier,
  } = input;

  const targetCount = targetVerdictCount ?? 3;
  const creditsToUse = creditsToCharge ?? 1;

  log.info(`[TRACE:${traceId}] createVerdictRequest START`, {
    step: '0_init',
    userId: userId.substring(0, 8) + '...',
    category,
    media_type,
    requestTier,
    creditsToUse,
    targetCount,
    hasMediaUrl: !!media_url,
    hasTextContent: !!text_content,
    contextLength: context?.length || 0,
  });

  // STEP 1: Profile lookup
  log.info(`[TRACE:${traceId}] Step 1: Fetching profile`, { step: '1_profile_start' });
  const profileStartTime = Date.now();

  let profileResult;
  try {
    profileResult = await getProfile(supabase, userId);
  } catch (profileError: any) {
    log.error(`[TRACE:${traceId}] Step 1 EXCEPTION: getProfile threw`, {
      step: '1_profile_exception',
      errorMessage: profileError?.message,
      errorCode: profileError?.code,
      errorStack: profileError?.stack?.split('\n').slice(0, 3),
      elapsed: Date.now() - profileStartTime,
    });
    throw new Error(`Profile lookup exception: ${profileError?.message}`);
  }

  log.info(`[TRACE:${traceId}] Step 1: getProfile result`, {
    step: '1_profile_result',
    success: profileResult.success,
    hasData: profileResult.success ? !!profileResult.data : false,
    credits: profileResult.success && profileResult.data ? (profileResult.data as any).credits : 'N/A',
    errorCode: !profileResult.success ? profileResult.error.code : null,
    errorMessage: !profileResult.success ? profileResult.error.message : null,
    elapsed: Date.now() - profileStartTime,
  });

  if (!profileResult.success) {
    log.error(`[TRACE:${traceId}] Step 1 FAILED: Database error`, {
      step: '1_profile_db_error',
      errorCode: profileResult.error.code,
      errorMessage: profileResult.error.message,
      errorDetails: profileResult.error.details,
    });
    throw new Error(`Database error: ${profileResult.error.message}`);
  }

  if (!profileResult.data) {
    log.error(`[TRACE:${traceId}] Step 1 FAILED: Profile not found`, {
      step: '1_profile_not_found',
      userId: userId.substring(0, 8) + '...',
    });
    throw new Error('Profile not found. Please refresh and try again.');
  }

  // STEP 2: Credit deduction
  log.info(`[TRACE:${traceId}] Step 2: Deducting credits`, {
    step: '2_deduct_start',
    currentCredits: (profileResult.data as any).credits,
    creditsToDeduct: creditsToUse,
  });
  const deductStartTime = Date.now();

  let deductResult;
  try {
    deductResult = await deductCredits(supabase, userId, creditsToUse);
  } catch (deductError: any) {
    log.error(`[TRACE:${traceId}] Step 2 EXCEPTION: deductCredits threw`, {
      step: '2_deduct_exception',
      errorMessage: deductError?.message,
      errorCode: deductError?.code,
      errorStack: deductError?.stack?.split('\n').slice(0, 3),
      elapsed: Date.now() - deductStartTime,
    });
    throw new Error(`Credit deduction exception: ${deductError?.message}`);
  }

  log.info(`[TRACE:${traceId}] Step 2: deductCredits result`, {
    step: '2_deduct_result',
    success: deductResult.success,
    newBalance: deductResult.success ? deductResult.data.newBalance : 'N/A',
    previousBalance: deductResult.success ? deductResult.data.previousBalance : 'N/A',
    errorCode: !deductResult.success ? deductResult.error.code : null,
    errorMessage: !deductResult.success ? deductResult.error.message : null,
    elapsed: Date.now() - deductStartTime,
  });

  if (!deductResult.success) {
    if (deductResult.error.code === 'INSUFFICIENT_CREDITS') {
      log.warn(`[TRACE:${traceId}] Step 2 FAILED: Insufficient credits`, {
        step: '2_deduct_insufficient',
        errorMessage: deductResult.error.message,
      });
      const err = new Error(deductResult.error.message);
      // @ts-expect-error augment error
      err.code = 'INSUFFICIENT_CREDITS';
      throw err;
    }
    log.error(`[TRACE:${traceId}] Step 2 FAILED: Deduction error`, {
      step: '2_deduct_error',
      errorCode: deductResult.error.code,
      errorMessage: deductResult.error.message,
      errorDetails: deductResult.error.details,
    });
    throw new Error(`Failed to deduct credits: ${deductResult.error.message}`);
  }

  const creditsAfterDeduction = deductResult.data.newBalance;

  // STEP 3: Create the request
  log.info(`[TRACE:${traceId}] Step 3: Inserting verdict_request`, {
    step: '3_insert_start',
    category,
    media_type,
    requestTier: requestTier || 'community',
    targetCount,
  });
  const insertStartTime = Date.now();

  // NOTE: verdict_requests table does NOT have a visibility column
  // (unlike comparison_requests which does)
  const insertPayload = {
    user_id: userId,
    category,
    subcategory: subcategory || null,
    media_type,
    media_url: media_type === 'photo' || media_type === 'audio' ? media_url || null : null,
    text_content: media_type === 'text' ? text_content || null : null,
    context,
    requested_tone: requestedTone || 'honest',
    status: 'open',
    target_verdict_count: targetCount,
    received_verdict_count: 0,
    request_tier: requestTier || 'community',
  };

  let createRequestError: any = null;
  let newRequest: any = null;

  try {
    const result = await (supabase as any)
      .from('verdict_requests')
      .insert(insertPayload)
      .select()
      .single();

    newRequest = result.data;
    createRequestError = result.error;
  } catch (insertException: any) {
    log.error(`[TRACE:${traceId}] Step 3 EXCEPTION: Insert threw`, {
      step: '3_insert_exception',
      errorMessage: insertException?.message,
      errorCode: insertException?.code,
      errorStack: insertException?.stack?.split('\n').slice(0, 3),
      elapsed: Date.now() - insertStartTime,
    });

    // Refund credits
    log.info(`[TRACE:${traceId}] Refunding credits after exception`, { step: '3_refund' });
    await addCredits(supabase, userId, creditsToUse, 'Refund: request creation exception');

    throw new Error(`Insert exception: ${insertException?.message}`);
  }

  log.info(`[TRACE:${traceId}] Step 3: Insert result`, {
    step: '3_insert_result',
    success: !createRequestError && !!newRequest,
    hasData: !!newRequest,
    requestId: newRequest?.id?.substring(0, 8) || null,
    errorMessage: createRequestError?.message || null,
    errorCode: createRequestError?.code || null,
    errorHint: createRequestError?.hint || null,
    errorDetails: createRequestError?.details || null,
    elapsed: Date.now() - insertStartTime,
  });

  if (createRequestError || !newRequest) {
    log.error(`[TRACE:${traceId}] Step 3 FAILED: Insert failed`, {
      step: '3_insert_failed',
      errorMessage: createRequestError?.message,
      errorCode: createRequestError?.code,
      errorHint: createRequestError?.hint,
      errorDetails: createRequestError?.details,
    });

    // Refund credits on failure
    log.info(`[TRACE:${traceId}] Refunding credits after insert failure`, { step: '3_refund' });
    await addCredits(supabase, userId, creditsToUse, 'Refund: request creation failed');

    throw new Error(`Failed to create request: ${createRequestError?.message}`);
  }

  const totalElapsed = Date.now() - startTime;
  log.info(`[TRACE:${traceId}] createVerdictRequest SUCCESS`, {
    step: '4_complete',
    requestId: newRequest.id,
    totalElapsed,
    creditsDeducted: creditsToUse,
    newBalance: creditsAfterDeduction,
  });

  return { request: newRequest };
}

export interface AddJudgeVerdictInput {
  requestId: string;
  judgeId: string;
  rating: number | null;
  feedback: string;
  tone: VerdictResponse['tone'];
  voiceUrl?: string | null;
}

export interface AddJudgeVerdictResult {
  verdict: VerdictResponse;
  updatedRequest: VerdictRequest;
}

/**
 * Core domain logic for recording a judge verdict:
 * - Validates request is open for verdicts
 * - Prevents double responses from same judge
 * - Inserts verdict
 * - Increments received_verdict_count and closes request if target reached
 */
export async function addJudgeVerdict(
  supabase: DbClient,
  input: AddJudgeVerdictInput
): Promise<AddJudgeVerdictResult> {
  const { requestId, judgeId, rating, feedback, tone, voiceUrl } = input;

  // Fetch the request
  const { data: verdictRequest, error: requestError } = await (supabase as any)
    .from('verdict_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !verdictRequest) {
    const err = new Error('Request not found');
    // @ts-expect-error augment error
    err.code = 'REQUEST_NOT_FOUND';
    throw err;
  }

  // Prevent judges from responding to their own requests
  if (verdictRequest.user_id === judgeId) {
    const err = new Error('You cannot judge your own request');
    // @ts-expect-error augment error
    err.code = 'CANNOT_JUDGE_OWN_REQUEST';
    throw err;
  }

  if (verdictRequest.status !== 'in_progress' && verdictRequest.status !== 'open') {
    const err = new Error('Request is no longer accepting verdicts');
    // @ts-expect-error augment error
    err.code = 'REQUEST_CLOSED';
    throw err;
  }

  // Insert verdict - use database unique constraint for atomic duplicate prevention
  // This is safer than SELECT-then-INSERT which has a race condition window
  const { data: verdict, error: createError } = await (supabase as any)
    .from('verdict_responses')
    .insert({
      request_id: requestId,
      judge_id: judgeId,
      rating: rating ?? null,
      feedback,
      tone,
      voice_url: voiceUrl || null,
    })
    .select()
    .single();

  if (createError) {
    // Check for unique constraint violation (duplicate response)
    // PostgreSQL error code 23505 = unique_violation
    if (createError.code === '23505' ||
        createError.message?.includes('duplicate') ||
        createError.message?.includes('unique constraint')) {
      const err = new Error('Judge has already responded to this request');
      // @ts-expect-error augment error
      err.code = 'ALREADY_RESPONDED';
      throw err;
    }
    throw new Error(`Failed to create verdict: ${createError?.message}`);
  }

  if (!verdict) {
    throw new Error('Failed to create verdict: No data returned');
  }

  // Increment count and possibly close, atomically at the DB level
  const { data: updatedRequest, error: rpcError } = await (supabase.rpc as any)(
    'increment_verdict_count_and_close',
    { p_request_id: requestId }
  );

  if (rpcError || !updatedRequest) {
    throw new Error(`Failed to update request after verdict: ${rpcError?.message}`);
  }

  return { verdict, updatedRequest };
}

// Interface for the new submitRequest function used by the create page
export interface SubmitRequestInput {
  requestType: 'verdict' | 'comparison' | 'split_test';
  category: string;
  context: string;
  textContent?: string;
  mediaType: 'photo' | 'text' | 'audio';
  targetVerdictCount: number;
  creditsToUse: number;
  files?: File[];
  specificQuestions?: string[];
  demographicFilters?: any;
}

export interface SubmitRequestResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

/**
 * Client-side function to submit a new request using the create form
 */
export async function submitRequest(input: SubmitRequestInput): Promise<SubmitRequestResult> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    let mediaUrl: string | null = null;
    let secondMediaUrl: string | null = null;

    // Handle file upload if files are provided
    if (input.files && input.files.length > 0) {
      // Upload first file
      const file = input.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = input.requestType === 'comparison' || input.requestType === 'split_test'
        ? `comparison-requests/${fileName}`
        : `verdict-requests/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Failed to upload file' };
      }

      // Get public URL for first file
      const { data: publicUrl } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);

      mediaUrl = publicUrl.publicUrl;

      // Upload second file if provided (for comparisons and split tests)
      if (input.files.length > 1 && (input.requestType === 'comparison' || input.requestType === 'split_test')) {
        const secondFile = input.files[1];
        const secondFileExt = secondFile.name.split('.').pop();
        const secondFileName = `${user.id}/${Date.now()}_b.${secondFileExt}`;
        const secondFilePath = `comparison-requests/${secondFileName}`;

        const { data: secondUploadData, error: secondUploadError } = await supabase.storage
          .from('user-content')
          .upload(secondFilePath, secondFile);

        if (secondUploadError) {
          console.error('Second file upload error:', secondUploadError);
          return { success: false, error: 'Failed to upload second file' };
        }

        // Get public URL for second file
        const { data: secondPublicUrl } = supabase.storage
          .from('user-content')
          .getPublicUrl(secondFilePath);

        secondMediaUrl = secondPublicUrl.publicUrl;
      }
    }

    // Determine the appropriate table based on request type
    let tableName: string;
    let requestData: any;

    switch (input.requestType) {
      case 'comparison':
        tableName = 'comparison_requests';
        requestData = {
          user_id: user.id,
          title: `Comparison: ${input.category}`,
          description: input.context,
          option_a_url: mediaUrl,
          option_b_url: secondMediaUrl,
          category: input.category,
          target_responses: input.targetVerdictCount,
          credits_used: input.creditsToUse,
          status: 'open',
        };
        break;

      case 'split_test':
        tableName = 'split_test_requests';
        requestData = {
          user_id: user.id,
          title: `Split Test: ${input.category}`,
          description: input.context,
          image_a_url: mediaUrl,
          image_b_url: secondMediaUrl,
          target_demographics: input.demographicFilters || {},
          target_responses: input.targetVerdictCount,
          credits_used: input.creditsToUse,
          status: 'open',
        };
        break;

      default: // verdict
        // Use existing createVerdictRequest function
        const result = await createVerdictRequest(supabase, {
          userId: user.id,
          email: user.email || null,
          category: input.category as any,
          media_type: input.mediaType as any,
          media_url: mediaUrl,
          text_content: input.textContent || null,
          context: input.context,
          targetVerdictCount: input.targetVerdictCount,
          creditsToCharge: input.creditsToUse,
        });

        return { success: true, requestId: result.request.id };
    }

    // For comparison and split test requests, insert directly
    const { data: newRequest, error: insertError } = await (supabase as any)
      .from(tableName)
      .insert(requestData)
      .select('id')
      .single();

    if (insertError || !newRequest) {
      console.error('Insert error:', insertError);
      return { success: false, error: 'Failed to create request' };
    }

    return { success: true, requestId: newRequest.id };
    
  } catch (error) {
    console.error('Submit request error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
