import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, VerdictRequest, VerdictResponse } from './database.types';

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

  // Ensure profile exists first
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, credits')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "row not found"
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  // Create profile with starter credits if it doesn't exist
  if (!profile) {
    const { data: newProfile, error: createError } = await (supabase as any)
      .from('profiles')
      .insert({
        id: userId,
        email,
        display_name: email?.split('@')[0] || 'User',
        credits: 3,
        is_judge: false,
        is_admin: false,
      })
      .select('id, credits')
      .single();

    if (createError || !newProfile) {
      throw new Error(`Failed to create user profile: ${createError?.message}`);
    }

    profile = newProfile;
  }

  // Use atomic deduct_credits function to prevent race conditions
  const { data: deductResult, error: deductError } = await (supabase.rpc as any)('deduct_credits', {
    p_user_id: userId,
    p_credits: creditsToUse
  });

  if (deductError) {
    throw new Error(`Failed to deduct credits: ${deductError.message}`);
  }

  // Check if deduction was successful
  const result = (deductResult as any)?.[0];
  if (!result || !result.success) {
    const err = new Error(result?.message || 'Insufficient credits');
    // @ts-expect-error augment error
    err.code = 'INSUFFICIENT_CREDITS';
    throw err;
  }

  // Create the request
  const { data: newRequest, error: createRequestError } = await (supabase as any)
    .from('verdict_requests')
    .insert({
      user_id: userId,
      category,
      subcategory: subcategory || null,
      media_type,
      media_url: media_type === 'photo' || media_type === 'audio' ? media_url || null : null,
      text_content: media_type === 'text' ? text_content || null : null,
      context,
      question: context, // For now, context serves as question
      requested_tone: requestedTone || 'honest',
      roast_mode: roastMode || false,
      visibility: visibility || 'private',
      status: 'in_progress',
      target_verdict_count: targetCount,
      received_verdict_count: 0,
      request_tier: requestTier || 'community',
    })
    .select()
    .single();

  if (createRequestError || !newRequest) {
    // Atomic credit refund on failure
    await (supabase.rpc as any)('refund_credits', {
      p_user_id: userId,
      p_credits: creditsToUse,
      p_reason: 'Request creation failed'
    });

    throw new Error(`Failed to create request: ${createRequestError?.message}`);
  }

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

  // Prevent double response by same judge
  const { data: existingResponse } = await (supabase as any)
    .from('verdict_responses')
    .select('id')
    .eq('request_id', requestId)
    .eq('judge_id', judgeId)
    .single();

  if (existingResponse) {
    const err = new Error('Judge has already responded to this request');
    // @ts-expect-error augment error
    err.code = 'ALREADY_RESPONDED';
    throw err;
  }

  // Insert verdict
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

  if (createError || !verdict) {
    throw new Error(`Failed to create verdict: ${createError?.message}`);
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


