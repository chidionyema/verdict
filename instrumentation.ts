export async function register() {
  // Better Stack logging is initialized on-demand in lib/logger.ts
  // No additional setup needed here

  if (process.env.NODE_ENV === 'production') {
    console.log('Production instrumentation registered');
  }
}
