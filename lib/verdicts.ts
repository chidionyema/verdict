// @ts-nocheck
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
   * Optional override for how many verdicts this request should target.
   * Defaults to 3 to match current pricing.
   */
  targetVerdictCount?: number;
  /**
   * Optional override for how many credits to charge for this request.
   * Defaults to 1 to match current pricing.
   */
  creditsToCharge?: number;
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
    targetVerdictCount,
    creditsToCharge,
  } = input;

  const targetCount = targetVerdictCount ?? 3;
  const creditsToUse = creditsToCharge ?? 1;

  // Ensure profile exists and fetch credits
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "row not found"
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  // Create profile with starter credits if it doesn't exist
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        display_name: email?.split('@')[0] || 'User',
        credits: 3,
        is_judge: false,
        is_admin: false,
      })
      .select('credits')
      .single();

    if (createError || !newProfile) {
      throw new Error(`Failed to create user profile: ${createError?.message}`);
    }

    profile = newProfile;
  }

  if (profile.credits < creditsToUse) {
    const err = new Error('Insufficient credits');
    // @ts-expect-error augment error
    err.code = 'INSUFFICIENT_CREDITS';
    throw err;
  }

  // Deduct credits
  const { error: creditError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits - creditsToUse })
    .eq('id', userId);

  if (creditError) {
    throw new Error(`Failed to deduct credits: ${creditError.message}`);
  }

  // Create the request
  const { data: newRequest, error: createRequestError } = await supabase
    .from('verdict_requests')
    .insert({
      user_id: userId,
      category,
      subcategory: subcategory || null,
      media_type,
      media_url: media_type === 'photo' ? media_url || null : null,
      text_content: media_type === 'text' ? text_content || null : null,
      context,
      status: 'in_progress',
      target_verdict_count: targetCount,
      received_verdict_count: 0,
    })
    .select()
    .single();

  if (createRequestError || !newRequest) {
    // Attempt best-effort credit refund
    await supabase
      .from('profiles')
      .update({ credits: profile.credits })
      .eq('id', userId);

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
  const { requestId, judgeId, rating, feedback, tone } = input;

  // Fetch the request
  const { data: verdictRequest, error: requestError } = await supabase
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
  const { data: existingResponse } = await supabase
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
  const { data: verdict, error: createError } = await supabase
    .from('verdict_responses')
    .insert({
      request_id: requestId,
      judge_id: judgeId,
      rating: rating ?? null,
      feedback,
      tone,
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


