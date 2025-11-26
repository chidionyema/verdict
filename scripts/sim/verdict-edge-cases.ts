// @ts-nocheck
/**
 * Verdict edge-case simulations:
 *
 * 1) Partial fill: 1/3 verdicts → request should remain in_progress.
 * 2) Duplicate response: same judge cannot respond twice.
 * 3) Closed request: no new verdicts accepted after completion.
 *
 * Run with:
 *   npx tsx scripts/sim/verdict-edge-cases.ts
 */

import {
  createTestUser,
  createTestJudges,
  createRequest,
  judgeRespond,
  getFinal,
} from './helpers';

async function testPartialFill() {
  // eslint-disable-next-line no-console
  console.log('🔍 Test 1: Partial fill (1/3 verdicts)...');

  const seeker = await createTestUser('seeker', 2);
  const [judge] = await createTestJudges(1);

  const request = await createRequest(seeker, {
    category: 'decision',
    media_type: 'text',
    context: 'Should I move cities for a new job opportunity?',
    text_content:
      'Offer is in a different city with better pay but I am close to family here. Looking for outside perspective.',
  });

  await judgeRespond(judge, request.id);

  const final = await getFinal(request.id);
  if (!final.request) throw new Error('Request not found after partial fill');

  const { request: finalRequest } = final;

  if (finalRequest.status !== 'in_progress') {
    throw new Error(
      `Expected status in_progress after 1 verdict, got ${finalRequest.status}`
    );
  }
  if (finalRequest.received_verdict_count !== 1) {
    throw new Error(
      `Expected received_verdict_count=1, got ${finalRequest.received_verdict_count}`
    );
  }

  // eslint-disable-next-line no-console
  console.log('✅ Test 1 passed.');
}

async function testDuplicateResponse() {
  // eslint-disable-next-line no-console
  console.log('🔍 Test 2: Duplicate response protection...');

  const seeker = await createTestUser('seeker', 3);
  const [judge] = await createTestJudges(1);

  const request = await createRequest(seeker, {
    category: 'appearance',
    media_type: 'text',
    context: 'Is this outfit professional enough for a finance interview?',
    text_content: 'Dark blazer, white shirt, dark jeans, clean sneakers.',
  });

  await judgeRespond(judge, request.id);

  let duplicateErrorCaught = false;
  try {
    await judgeRespond(judge, request.id);
  } catch (err: any) {
    duplicateErrorCaught = true;
    // eslint-disable-next-line no-console
    console.log('  ↳ Duplicate response blocked with error:', err?.message || err);
  }

  if (!duplicateErrorCaught) {
    throw new Error('Expected duplicate response to be rejected, but it succeeded');
  }

  const final = await getFinal(request.id);
  const count = final.verdicts.length;
  if (count !== 1) {
    throw new Error(`Expected exactly 1 verdict after duplicate attempt, got ${count}`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Test 2 passed.');
}

async function testClosedRequestRejection() {
  // eslint-disable-next-line no-console
  console.log('🔍 Test 3: Closed request rejects new verdicts...');

  const seeker = await createTestUser('seeker', 4);
  const judges = await createTestJudges(4);

  const request = await createRequest(seeker, {
    category: 'decision',
    media_type: 'text',
    context: 'Should I take a remote-only role or a hybrid role?',
    text_content:
      'Remote role pays slightly less but offers more flexibility. Hybrid role is higher pay but requires 3 days in office.',
  });

  // Fill the request to completion with first 3 judges
  for (let i = 0; i < 3; i++) {
    // eslint-disable-next-line no-await-in-loop
    await judgeRespond(judges[i], request.id);
  }

  const final = await getFinal(request.id);
  if (!final.request) throw new Error('Request not found after completion');

  const { request: finalRequest } = final;
  const isCompleted = finalRequest.status === 'completed';

  if (!isCompleted) {
    throw new Error(
      `Expected request to be completed after 3 verdicts, got status=${finalRequest.status}`
    );
  }

  // Attempt a 4th verdict after completion
  let closedErrorCaught = false;
  try {
    await judgeRespond(judges[3], request.id);
  } catch (err: any) {
    closedErrorCaught = true;
    // eslint-disable-next-line no-console
    console.log('  ↳ Closed request blocked with error:', err?.message || err);
  }

  if (!closedErrorCaught) {
    throw new Error('Expected closed request to reject new verdicts, but it succeeded');
  }

  // eslint-disable-next-line no-console
  console.log('✅ Test 3 passed.');
}

async function run() {
  try {
    await testPartialFill();
    await testDuplicateResponse();
    await testClosedRequestRejection();

    // eslint-disable-next-line no-console
    console.log('🎉 All edge-case simulations passed.');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Edge-case simulation failed:', err);
    process.exit(1);
  }
}

run();


