// @ts-nocheck
/**
 * Judge earnings reconciliation script.
 *
 * Verifies that for recent verdict_responses:
 * - There is exactly one judge_earnings row per verdict.
 * - The earnings amount matches the tier-based expected payout.
 *
 * Run with:
 *   env-cmd -f .env.local tsx scripts/admin/check-earnings.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getTierConfigByVerdictCount } from '@/lib/validations';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  // Look back 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);

  // Fetch verdicts with their request's target_verdict_count
  const { data: verdicts, error } = await supabase
    .from('verdict_responses')
    .select(
      `
      id,
      request_id,
      judge_id,
      created_at,
      judge_earning,
      verdict_requests!inner (
        target_verdict_count
      )
    `
    )
    .gte('created_at', since.toISOString());

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load verdict_responses:', error);
    process.exit(1);
  }

  let issues = 0;

  for (const v of verdicts || []) {
    const targetCount = v.verdict_requests?.target_verdict_count ?? 3;
    const tierCfg = getTierConfigByVerdictCount(targetCount);
    const expectedAmount = tierCfg.judgePayout;

    const { data: earnings, error: earnError } = await supabase
      .from('judge_earnings')
      .select('id, amount, payout_status, created_at')
      .eq('verdict_response_id', v.id);

    if (earnError) {
      // eslint-disable-next-line no-console
      console.error('Error loading earnings for verdict', v.id, earnError);
      issues++;
      continue;
    }

    if (!earnings || earnings.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[EARNINGS] Missing earnings row for verdict',
        v.id,
        'expected',
        expectedAmount
      );
      issues++;
      continue;
    }

    if (earnings.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        '[EARNINGS] Multiple earnings rows for verdict',
        v.id,
        'rows:',
        earnings.map((e) => e.id)
      );
      issues++;
    }

    const amount = Number(earnings[0].amount ?? 0);
    if (Math.abs(amount - expectedAmount) > 0.001) {
      // eslint-disable-next-line no-console
      console.warn(
        '[EARNINGS] Amount mismatch for verdict',
        v.id,
        'expected',
        expectedAmount,
        'got',
        amount
      );
      issues++;
    }
  }

  if (issues === 0) {
    // eslint-disable-next-line no-console
    console.log('✅ Earnings reconciliation passed. No issues found in last 30 days.');
  } else {
    // eslint-disable-next-line no-console
    console.log(`⚠️ Earnings reconciliation found ${issues} potential issue(s).`);
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error in check-earnings script:', err);
  process.exit(1);
});


