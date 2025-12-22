/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on app startup.
 * Fails fast with clear error messages if anything is missing.
 */

const requiredEnvVars = {
  // Supabase (CRITICAL)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // Optional but recommended
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

const optionalEnvVars = {
  NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'development' 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    : (process.env.NEXT_PUBLIC_APP_URL || (() => { throw new Error('NEXT_PUBLIC_APP_URL required in production') })()),
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
} as const;

// Validate on module load
function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === '') {
      // Supabase keys are absolutely critical
      if (key.includes('SUPABASE')) {
        missing.push(key);
      } else {
        // Stripe keys only needed if not in demo mode
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
          warnings.push(`${key} (required for payments)`);
        }
      }
    }
  }

  if (missing.length > 0) {
    const error = `
╔════════════════════════════════════════════════════════════════╗
║  CRITICAL: Missing Required Environment Variables             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  The following environment variables are required:             ║
║                                                                ║
${missing.map((v) => `║  ❌ ${v.padEnd(58)}║`).join('\n')}
║                                                                ║
║  Please set these in your .env.local file or deployment       ║
║  environment.                                                  ║
║                                                                ║
║  Example .env.local:                                          ║
║  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co            ║
║  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();

    throw new Error(error);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('\n⚠️  Warning: Some optional environment variables are missing:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('\n');
  }
}

// Run validation
if (typeof window === 'undefined') {
  // Server-side only
  validateEnv();
}

// Export validated env vars with types
export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  // App
  app: {
    url: optionalEnvVars.NEXT_PUBLIC_APP_URL,
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  },
} as const;

// Type-safe environment access
export type Env = typeof env;
