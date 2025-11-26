/**
 * Full verdict flow simulation:
 *
 * - Creates a seeker and N judges (or reuses if already present)
 * - Creates a request
 * - Has all judges respond
 * - Fetches final request + verdicts and logs a summary
 *
 * Run with:
 *   npx tsx scripts/sim/full-verdict-flow.ts
 */

import { createTestUser, createTestJudges, createRequest, judgeRespond, getFinal } from './helpers';

async function runSimulation() {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting full verdict flow simulation...');

  const seeker = await createTestUser('seeker');
  const judges = await createTestJudges(3);

  const request = await createRequest(seeker, {
    category: 'decision',
    media_type: 'text',
    context: 'I have two job offers and I am not sure which one to pick. One is a startup, the other is a big tech company.',
    text_content:
      'Offer A: Startup with more equity, lower base. Offer B: Big tech with higher base, less upside. I care about learning, stability, and long-term upside.',
  });

  // eslint-disable-next-line no-console
  console.log(`📨 Created request ${request.id} for seeker ${seeker.email}`);

  // Judges respond sequentially to avoid DB race conditions in count updates
  for (const j of judges) {
    // eslint-disable-next-line no-await-in-loop
    await judgeRespond(j, request.id);
  }

  const final = await getFinal(request.id);

  if (!final.request) {
    // eslint-disable-next-line no-console
    console.error('❌ Request not found after simulation.');
    process.exit(1);
  }

  const { request: finalRequest, verdicts } = final;
  const averageRating =
    verdicts.length > 0
      ? verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) / verdicts.length
      : 0;

  // eslint-disable-next-line no-console
  console.log('🏁 Final Request State →', {
    id: finalRequest.id,
    status: finalRequest.status,
    received_verdict_count: finalRequest.received_verdict_count,
    target_verdict_count: finalRequest.target_verdict_count,
  });

  // eslint-disable-next-line no-console
  console.log('🧠 Verdicts Summary →', {
    count: verdicts.length,
    averageRating: averageRating.toFixed(2),
  });

  verdicts.forEach((v, idx) => {
    // eslint-disable-next-line no-console
    console.log(`  #${idx + 1} rating=${v.rating} tone=${v.tone} feedback="${v.feedback.slice(0, 80)}..."`);
  });

  // Simple assertion – treat completed as closed/in_progress domain status
  const done =
    finalRequest.status === 'closed' || finalRequest.received_verdict_count >= finalRequest.target_verdict_count;

  if (!done) {
    // eslint-disable-next-line no-console
    console.error('❌ Simulation failed: request did not close correctly.');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Simulation completed successfully.');
}

runSimulation().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Simulation error:', err);
  process.exit(1);
});


