/**
 * Multi-user simulation helpers for Verdict
 *
 * These helpers call the same domain logic used by the app (lib/verdicts),
 * but via a standalone Supabase client using the service role key.
 *
 * Usage (example):
 *  import { runFullFlow } from './full-verdict-flow';
 *  runFullFlow();
 */

import { createClient } from '@supabase/supabase-js';
import type { Database, VerdictRequest, VerdictResponse, Profile } from '@/lib/database.types';
import { createVerdictRequest, addJudgeVerdict } from '@/lib/verdicts';
import { VERDICT_TIERS } from '@/lib/validations';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for simulator');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export type SimUser = {
  id: string;
  email: string;
  role: 'seeker' | 'judge';
};

export async function createTestUser(role: 'seeker' | 'judge', index = 1): Promise<SimUser> {
  const email = `sim-${role}${index}@demo.verdict.app`;

  // 1) Try to find existing profile by email
  const { data: existingProfile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingProfile) {
    // Ensure judge flag is set for judge users
    if (role === 'judge') {
      await (supabase as any)
        .from('profiles')
        .update({ is_judge: true })
        .eq('id', (existingProfile as any).id);
    }

    return { id: (existingProfile as any).id, email, role };
  }

  // 2) No profile – create or reconcile auth user, then create profile
  const { data: userResult, error } = await (supabase.auth.admin as any).createUser({
    email,
    password: 'sim123456',
    email_confirm: true,
    user_metadata: { full_name: `Sim ${role} ${index}` },
  });

  let userId: string | null = null;

  if (error) {
    // If the user already exists in auth, fetch via listUsers and then create profile
    if (error.message?.includes('already been registered')) {
      const { data: listResult } = await (supabase.auth.admin as any).listUsers({
        page: 1,
        perPage: 100,
      });

      const existingUser =
        listResult?.users?.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase()) ||
        null;

      if (!existingUser) {
        throw new Error(
          `Auth user for ${email} exists but could not be found via listUsers; please reconcile manually.`
        );
      }

      userId = existingUser.id;
    } else {
      throw new Error(`Failed to create test user (${role}): ${error.message}`);
    }
  } else {
    const user = userResult.user;
    if (!user) {
      throw new Error('Auth user creation failed with no user returned');
    }
    userId = user.id;
  }

  if (!userId) {
    throw new Error(`Unable to resolve user id for sim user ${email}`);
  }

  // Ensure a profile exists for this auth user
  const { error: insertError } = await (supabase as any).from('profiles').insert({
    id: userId,
    email,
    is_admin: false,
    is_judge: role === 'judge',
  } as Profile);

  // Ignore duplicate insert errors (e.g. if a previous run created the row)
  if (insertError && insertError.code !== '23505') {
    throw new Error(`Failed to create profile for ${email}: ${insertError.message}`);
  }

  if (role === 'judge') {
    await (supabase as any)
      .from('profiles')
      .update({ is_judge: true })
      .eq('id', userId);
  }

  return { id: userId, email, role };
}

export async function createTestJudges(count: number): Promise<SimUser[]> {
  const judges: SimUser[] = [];
  for (let i = 0; i < count; i++) {
    judges.push(await createTestUser('judge', i + 1));
  }
  return judges;
}

export async function createRequest(
  seeker: SimUser,
  payload: Pick<VerdictRequest, 'category' | 'media_type' | 'context'> & {
    subcategory?: string | null;
    media_url?: string | null;
    text_content?: string | null;
  }
): Promise<VerdictRequest> {
  const { category, media_type, context, subcategory, media_url, text_content } = payload;

  // Ensure seeker has enough credits for simulation (top-up if needed)
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('credits')
    .eq('id', seeker.id)
    .single();

  if (!profile || ((profile as any).credits ?? 0) < 1) {
    await (supabase as any)
      .from('profiles')
      .update({ credits: 10 })
      .eq('id', seeker.id);
  }

  const { request } = await createVerdictRequest(supabase, {
    userId: seeker.id,
    email: seeker.email,
    category,
    subcategory: subcategory ?? null,
    media_type,
    media_url: media_url ?? null,
    text_content: text_content ?? null,
    context,
    creditsToCharge: 1,
    targetVerdictCount: VERDICT_TIERS.basic.verdicts,
  });

  return request;
}

export function generateVerdict(): { rating: number; feedback: string; tone: VerdictResponse['tone'] } {
  const tones: VerdictResponse['tone'][] = ['honest', 'constructive', 'encouraging'];
  const tone = tones[Math.floor(Math.random() * tones.length)];
  const rating = Math.floor(Math.random() * 4) + 7; // 7–10
  const feedback =
    tone === 'encouraging'
      ? 'This looks great overall. You are on the right track—small tweaks could make it even stronger.'
      : tone === 'constructive'
      ? 'There are a few areas you could tighten up. Focus on clarity and what outcome you really want.'
      : 'Honestly, this might not land the way you hope. Consider re-framing it from the other side’s perspective.';

  return { rating, feedback, tone };
}

export async function judgeRespond(
  judge: SimUser,
  requestId: string,
  verdictPayload = generateVerdict()
): Promise<VerdictResponse> {
  const { verdict } = await addJudgeVerdict(supabase, {
    requestId,
    judgeId: judge.id,
    rating: verdictPayload.rating,
    feedback: verdictPayload.feedback,
    tone: verdictPayload.tone,
  });

  return verdict;
}

export async function getFinal(requestId: string): Promise<{
  request: VerdictRequest | null;
  verdicts: VerdictResponse[];
}> {
  const { data: request } = await (supabase as any)
    .from('verdict_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  const { data: verdicts = [] } = await (supabase as any)
    .from('verdict_responses')
    .select('*')
    .eq('request_id', requestId);

  return {
    request: request || null,
    verdicts,
  };
}


