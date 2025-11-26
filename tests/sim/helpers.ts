export async function runPartialVerdictFlow(): Promise<{ requestId: string }> {
  // TODO: Wire this to your simulation helpers:
  // - create a seeker + request
  // - inject 1 of N verdicts
  // For now this is a placeholder to keep TypeScript happy.
  throw new Error('runPartialVerdictFlow is not implemented.');
}

export async function runCompleteVerdictFlow(
  requestId?: string
): Promise<{ judgeEmail: string; judgePassword: string }> {
  // TODO: Wire this to your simulation helpers:
  // - ensure judges exist
  // - submit all required verdicts
  // - return judge credentials for the earnings flow.
  throw new Error('runCompleteVerdictFlow is not implemented.');
}
