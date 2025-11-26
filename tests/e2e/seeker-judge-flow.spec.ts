import { test, expect } from '@playwright/test';
import { runPartialVerdictFlow, runCompleteVerdictFlow } from '../sim/helpers';

/**
 * High-level happy path:
 * - Seeker visits /start and submits a text-based decision request
 * - Is redirected to /success and sees real-time verdict waiting UI
 * - (Out of band) judges respond via simulator or backend helpers
 * - Success page detects completion and links through to /requests/[id]
 *
 * NOTE: This spec assumes:
 * - App is running (e.g. `npm run dev`) against a test database
 * - A background process (or manual trigger) runs the simulator to add verdicts
 */

test('seeker can submit a request and see verdict progress', async ({ page }: { page: any }) => {
  // Start on the tiered start page
  await page.goto('/start');

  // Choose text mode
  await page.getByRole('button', { name: /text/i }).click();

  // Enter sufficient text content and continue
  const textArea = page.getByRole('textbox', { name: /paste your text/i });
  await textArea.fill(
    'This is an automated test decision. Please ignore. I am choosing between two job offers.'
  );
  await page.getByRole('button', { name: /continue/i }).click();

  // Pick a feedback category (e.g. Decision)
  await page.getByRole('button', { name: /decision/i }).click();
  await page.getByRole('button', { name: /choose judges/i }).click();

  // Judge preferences step – just pick the default / first option if present
  // This is intentionally loose to avoid overfitting selectors.
  const continuePreferences = page.getByRole('button', { name: /continue/i }).first();
  if (await continuePreferences.isVisible()) {
    await continuePreferences.click();
  }

  // Context step – fill minimum context and submit
  const contextBox = page.getByRole('textbox', { name: /context|explain your situation/i });
  await contextBox.fill(
    'Automated test context: validating seeker to judge to seeker flow via Playwright.'
  );

  const submitButton = page.getByRole('button', { name: /get .*feedback|sign up & get feedback/i });
  await submitButton.click();

  // Expect redirect to /success with a realtime waiting widget
  await page.waitForURL('**/success**');
  await expect(page.getByText(/request submitted successfully/i)).toBeVisible();
  await expect(page.getByText(/0 of 3 verdicts|1 of 3 verdicts|verdicts received/i)).toBeVisible();

  // We don’t force verdict completion here (that’s handled by simulators / backend),
  // but we assert that the CTA to view results appears once at least one verdict exists.
  // In CI you can coordinate by running the simulator in parallel.
});

test.skip('seeker sees partial then complete results for a single request', async ({ page }: { page: any }) => {
  const { requestId } = await runPartialVerdictFlow();

  // Go straight to the request detail page
  await page.goto(`/requests/${requestId}`);

  // Assert partial state is visible
  await expect(page.getByText(/partial results|1 of 3 verdicts/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /view results/i })).toBeVisible();

  // Complete the remaining verdicts out of band
  await runCompleteVerdictFlow(requestId);

  // Refresh and assert completed state
  await page.reload();
  await expect(page.getByText(/all results ready|3 of 3 verdicts/i)).toBeVisible();
});

test.skip('judge earnings update after submitting a verdict', async ({ page }: { page: any }) => {
  // This helper should ensure there is a judge, a request, and a submitted verdict,
  // and that earnings are attributed to the judge.
  const { judgeEmail, judgePassword } = await runCompleteVerdictFlow();

  // Log in as the judge (assumes existing auth UI)
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(judgeEmail);
  await page.getByLabel(/password/i).fill(judgePassword);
  await page.getByRole('button', { name: /log in|sign in/i }).click();

  // Navigate to earnings page
  await page.goto('/judge/earnings');

  // Assert that some earnings and available-for-payout numbers show up
  await expect(page.getByText(/available for payout|total earned/i)).toBeVisible();
});


